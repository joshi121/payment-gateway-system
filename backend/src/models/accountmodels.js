import mongoose from "mongoose"
import ledgerModel from "./ledgermodel.js";
import User from "./UserModel.js"
import { redisConnection } from "../config/redis.config.js";

const accountSchema =new mongoose.Schema({
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [ true, "Account must be associated with a user" ],
        index: true
    },
    status:{
        type: String,
        enum: {
            values: [ "ACTIVE", "FROZEN", "CLOSED" ],
            message: "Status can be either ACTIVE, FROZEN or CLOSED",
        },
        default: "ACTIVE"

    },
    currency:{
        type: String,
        required: [ true, "Currency is required for creating an account" ],
        default: "INR"

    }
},   
    {
        timestamps: true
    })

accountSchema.index({ user: 1, status: 1 })

accountSchema.methods.getBalance = async function () {
    const cacheKey = `account:balance:${this._id}`;

    // 1. Check Redis cache first (sub-millisecond return from RAM)
    try {
        const cachedBalance = await redisConnection.get(cacheKey);
        if (cachedBalance !== null) {
            return Number(cachedBalance);
        }
    } catch (err) {
        console.warn("[REDIS CACHE READ ERROR]: Falling back to MongoDB aggregation:", err.message);
    }

    // 2. Cache miss -> Derive sender balance from ledger aggregation
    const balanceData = await ledgerModel.aggregate([
        { $match: { account: this._id } },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "DEBIT" ] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "CREDIT" ] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: [ "$totalCredit", "$totalDebit" ] }
            }
        }
    ]);

    const balance = balanceData.length === 0 ? 0 : balanceData[ 0 ].balance;

    // 3. Store in Redis with 20 minutes TTL (1200 seconds)
    try {
        await redisConnection.set(cacheKey, balance, "EX", 1200);
    } catch (err) {
        console.warn("[REDIS CACHE WRITE ERROR]:", err.message);
    }

    return balance;
};

const accountModel = mongoose.model("Account", accountSchema)


export default accountModel