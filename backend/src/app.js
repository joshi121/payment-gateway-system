import express from "express";
import cookieParser from "cookie-parser"; 
import cors from "cors";
import router from "./routes/UserRoutes.js"; 
import AccountRouter from "./routes/accountroutes.js";
import TransactionRouter from "./routes/transactionroutes.js";

const app = express();

// Configure CORS middleware to allow requests from frontend with credentials
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(cleanOrigin) || /\.vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Global Middlewares
app.use(express.json());
app.use(cookieParser()); 

// Routes Setup
app.use("/api/payment/user", router); 
app.use("/api/payment/accounts", AccountRouter); //service registration
app.use("/api/payment/pay" , TransactionRouter);

export default app;