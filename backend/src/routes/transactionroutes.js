import express from "express"
import { isAunthenticated , authSystemUserMiddleware} from "../middleware/authmiddleware.js";


import transactionController from "../controllors/transactioncontrollor.js";

const { createTransaction, createInitialFundsTransaction } = transactionController;


const TransactionRouter = express.Router();

TransactionRouter.route("/transaction").post(isAunthenticated , createTransaction );

TransactionRouter.route("/init-transaction").post(authSystemUserMiddleware ,createInitialFundsTransaction );


export default TransactionRouter;