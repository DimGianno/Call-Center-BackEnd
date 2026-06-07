import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    void _next; // To satisfy the type signature, even though we won't use it

    console.error(err);

    res.status(500).json({
        error: "Internal server error"
    });
};
