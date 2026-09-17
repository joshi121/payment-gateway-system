import transactionModel from "../models/transactionmodel.js";
import ledgerModel from "../models/ledgermodel.js";
import accountModel from "../models/accountmodels.js";
import { emailQueue } from "../queues/email.queue.js";
import { redisConnection } from "../config/redis.config.js";
import mongoose from "mongoose";

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */

async function createTransaction(req, res) {

    /**
     * 1. Validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    /**
     * 2. Validate idempotency key
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })

        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing",
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    /**
     * 3. Check account status
     */

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    let transaction;
    const session = await mongoose.startSession() // Session initialization moved safe outside try block
    try {
        session.startTransaction()

        /**
         * 5. Create transaction (PENDING)
         * MINIMAL FIX 1: Fixed non-array syntax crash for session rollback safety
         */
        transaction = new transactionModel({
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        })
        await transaction.save({ session })

        const debitLedgerEntry = new ledgerModel({
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        })
        await debitLedgerEntry.save({ session })

        await (() => {
            return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
        })()

        const creditLedgerEntry = new ledgerModel({
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        })
        await creditLedgerEntry.save({ session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

        await session.commitTransaction()
        session.endSession()

        // 10. Invalidate Redis balance cache for both accounts so next getBalance() fetches fresh ledger balance
        try {
            await redisConnection.del(`account:balance:${fromAccount}`, `account:balance:${toAccount}`);
        } catch (cacheErr) {
            console.warn("[REDIS CACHE INVALIDATION WARNING]:", cacheErr.message);
        }

        // 11. Offload success email to BullMQ background queue (< 2ms)
        await emailQueue.add('sendTransactionSuccessEmail', {
            type: 'TRANSACTION_SUCCESS',
            payload: {
                email: req.user.email,
                name: req.user.name,
                amount,
                toAccount
            }
        });

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: transaction
        })

    } catch (error) {
        await session.abortTransaction()
        session.endSession()

        console.error("Critical Error in createTransaction:", error)
       
        // Offload failure email to BullMQ background queue
        try {
            await emailQueue.add('sendTransactionFailureEmail', {
                type: 'TRANSACTION_FAILURE',
                payload: {
                    email: req.user.email,
                    name: req.user.name,
                    amount,
                    toAccount
                }
            });
        } catch (queueErr) {
            console.error("Failure email alert failed to queue:", queueErr.message);
        }

        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
        })
    }
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }
    console.log("mil gye details");
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })
    console.log("accnt bhi mil gya");
    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })
    console.log("host accnt bhi mil gya");
    
    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    //MINIMAL FIX 2: Blunder Guard to prevent self-debit wash trading
    if (fromUserAccount._id.toString() === toAccount.toString()) {
        return res.status(400).json({
            message: "Transaction blunder: fromAccount and toAccount cannot be the same"
        })
    }

    const session = await mongoose.startSession()
    try {
        session.startTransaction()

        // MINIMAL FIX 3: Clean syntax without arrays, aligned with the first function
        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        })
        await transaction.save({ session })

        const debitLedgerEntry = new ledgerModel({
            account: fromUserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        })
        await debitLedgerEntry.save({ session })

        //  MINIMAL FIX 4: Corrected to use strictly 'toAccount' to prevent balance loop bug
        const creditLedgerEntry = new ledgerModel({
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        })
        await creditLedgerEntry.save({ session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

        transaction.status = "COMPLETED" // Keep the local state sync for response representation

        await session.commitTransaction()
        session.endSession()

        // Invalidate Redis balance cache for both accounts
        try {
            await redisConnection.del(`account:balance:${fromUserAccount._id}`, `account:balance:${toAccount}`);
        } catch (cacheErr) {
            console.warn("[REDIS CACHE INVALIDATION WARNING]:", cacheErr.message);
        }

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: transaction
        })

    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        console.error("Critical Error in createInitialFundsTransaction:", error)
        return res.status(500).json({
            message: "Internal server error during initial processing",
            error: error.message
        })
    }
}

export default {
    createTransaction,
    createInitialFundsTransaction
}