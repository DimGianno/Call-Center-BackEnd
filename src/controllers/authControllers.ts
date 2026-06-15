import type { Request, Response } from "express";
import { z } from "zod";

import { loginUser, signupUser } from "../services/authService.js";

const signupRequestSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required"),
        email: z.string().trim().email("Email must be a valid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
    })
    .strict();

const loginRequestSchema = z
    .object({
        email: z.string().trim().email("Email must be a valid email address"),
        password: z.string().min(1, "Password is required")
    })
    .strict();

const getValidationErrorMessage = (error: z.ZodError): string => {
    return error.issues[0]?.message ?? "Invalid request body";
};

export const signupController = async (req: Request, res: Response) => {
    const parsedBody = signupRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({
            error: getValidationErrorMessage(parsedBody.error)
        });
        return;
    }

    const result = await signupUser(parsedBody.data);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(201).json(result.data);
};

export const loginController = async (req: Request, res: Response) => {
    const parsedBody = loginRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({
            error: getValidationErrorMessage(parsedBody.error)
        });
        return;
    }

    const result = await loginUser(parsedBody.data);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json(result.data);
};
