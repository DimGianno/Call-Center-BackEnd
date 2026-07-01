import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import callRoutes from "./routes/callRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { requireAuth } from "./middleware/authMiddleware.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

const PRODUCTION_NODE_ENVS = new Set(["production", "staging"]);

const getAllowedFrontendOrigins = (): string[] => {
    return (process.env.FRONTEND_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
};

const isProductionLikeEnvironment = (): boolean => {
    return PRODUCTION_NODE_ENVS.has(process.env.NODE_ENV ?? "");
};

const isOriginAllowed = (origin: string): boolean => {
    const configuredOrigins = getAllowedFrontendOrigins();

    if (configuredOrigins.includes(origin)) {
        return true;
    }

    return !isProductionLikeEnvironment() && configuredOrigins.length === 0;
};

const app = express();

app.use(
    cors({
        credentials: true,
        origin: (origin, callback) => {
            if (!origin || isOriginAllowed(origin)) {
                callback(null, true);
                return;
            }

            callback(null, false);
        }
    })
);
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
