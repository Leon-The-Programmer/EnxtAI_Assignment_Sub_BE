import express from "express";
import userRouter from "./routes/userrouter.js";
import productRouter from "./routes/productrouter.js";
import portfolioRouter from "./routes/portfoliorouter.js";
import txnRouter from "./routes/txnrouter.js";

import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors({origin: "*"}));

// Mounting routers..
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/txn", txnRouter);
app.use("/api/v1/portfolio", portfolioRouter);

export default app;