import express from "express";
import userRouter from "./routes/userrouter.ts";
import productRouter from "./routes/productrouter.ts";
import portfolioRouter from "./routes/portfoliorouter.ts";
import txnRouter from "./routes/txnrouter.ts";

const app = express();

app.use(express.json());

// Mounting routers..
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/txn", txnRouter);
app.use("/api/v1/portfolio", portfolioRouter);

export default app;