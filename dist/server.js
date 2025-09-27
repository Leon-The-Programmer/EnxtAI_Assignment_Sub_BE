import express, {} from "express";
const app = express();
app.get("/", (req, res) => {
    res.send("Hello from the server!");
});
export default app;
//# sourceMappingURL=server.js.map