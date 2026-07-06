import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import callRoutes from "./routes/callRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { corsOptions } from "./config/cors.js";
import { requireAuth } from "./middleware/authMiddleware.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

const app = express();

app.set("trust proxy", 1);

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(requestLogger);

app.use("/auth", authRoutes);
app.use("/users", requireAuth, userRoutes);
app.use("/calls", requireAuth, callRoutes);

app.get("/", (_req, res) => {
    res.json({
        message: "Call Center API is running"
    });
});

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        message: "API is healthy"
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
