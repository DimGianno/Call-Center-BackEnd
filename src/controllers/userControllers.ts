import type { Request, Response } from "express";
import { z } from "zod";

import { getAuthenticatedUserId } from "../middleware/authMiddleware.js";
import {
    getTutorialPreference,
    updateTutorialPreference
} from "../services/userService.js";

const ISO_DATE_PATTERN =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

const isIsoDateString = (value: string): boolean => {
    return ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
};

const isoDateStringOrNullSchema = z
    .string()
    .trim()
    .refine(isIsoDateString, "Expected an ISO date string or null")
    .transform((value) => new Date(value).toISOString())
    .nullable();

const tutorialPreferenceSchema = z
    .object({
        version: z.number().int().optional(),
        hasSeenWelcome: z.boolean().optional(),
        completedAt: isoDateStringOrNullSchema.optional(),
        skippedAt: isoDateStringOrNullSchema.optional(),
        completedTopics: z.array(z.string().trim()).optional(),
        newTopics: z.array(z.string().trim()).optional()
    })
    .strict()
    .refine(
        (value) => Object.keys(value).length > 0,
        "At least one tutorial field is required"
    );

const getValidationErrorMessage = (error: z.ZodError): string => {
    return error.issues[0]?.message ?? "Invalid request body";
};

export const getTutorialPreferenceController = async (
    req: Request,
    res: Response
) => {
    const userId = getAuthenticatedUserId(req);
    const result = await getTutorialPreference(userId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json(result.data);
};

export const updateTutorialPreferenceController = async (
    req: Request,
    res: Response
) => {
    const userId = getAuthenticatedUserId(req);
    const parsedBody = tutorialPreferenceSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({
            error: getValidationErrorMessage(parsedBody.error)
        });
        return;
    }

    const result = await updateTutorialPreference(userId, parsedBody.data);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json(result.data);
};
