import express from "express";
import cors from "cors";
import callRoutes from "./routes/callRoutes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/calls", callRoutes);

app.get("/", (_req, res) => {
    res.json({
    message: "Call Center API is running",
    });
});

export default app;