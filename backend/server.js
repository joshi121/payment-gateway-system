import "dotenv/config";
import app from "./src/app.js";
import { ConnectToDB } from "./src/config/connectToDb.js";
import "./src/workers/email.worker.js"; // Initialize BullMQ background email worker

ConnectToDB();

const PORT = process.env.PORT || 3000; 

app.listen(PORT, () => {
    console.log(`🚀 Server is running on PORT ${PORT}`);
});