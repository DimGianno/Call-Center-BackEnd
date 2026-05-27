import express from "express";
import cors from "cors";
import callRoutes from "./routes/callRoutes.js"
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/calls", callRoutes);

app.get("/", (_req, res) => {
    res.json({
    message: "Call Center API is running",
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;