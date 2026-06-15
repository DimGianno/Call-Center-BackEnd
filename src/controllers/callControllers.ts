import type { Request, Response } from "express";
import { z } from "zod";
import {
    getAllCalls,
    getCallById,
    archiveCall,
    unarchiveCall,
    addNoteToCall,
    deleteCall,
    archiveAllCalls,
    unarchiveAllCalls,
    resetCalls
} from "../services/callService.js";
import type { CallFilters } from "../models/callModel.js";
import { getAuthenticatedUserId } from "../middleware/authMiddleware.js";
type CallIdParams = {
    callId: string;
};

const getCallsQuerySchema = z
    .object({
        is_archived: z.enum(["true", "false"]).optional(),
        direction: z.enum(["inbound", "outbound"]).optional(),
        call_type: z.enum(["answered", "missed", "voicemail"]).optional(),
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(50).optional().default(10)
    })
    .strict();

const getQueryValidationErrorMessage = (error: z.ZodError): string => {
    const firstIssue = error.issues[0];
    const fieldName = firstIssue?.path[0];

    if (fieldName === "is_archived") {
        return "Invalid is_archived filter. Expected 'true' or 'false'.";
    }

    if (fieldName === "direction") {
        return "Invalid direction filter. Expected 'inbound' or 'outbound'.";
    }

    if (fieldName === "call_type") {
        return "Invalid call_type filter. Expected 'answered', 'missed', or 'voicemail'.";
    }

    if (fieldName === "page") {
        return "Invalid page. Expected a positive integer.";
    }

    if (fieldName === "limit") {
        return "Invalid limit. Expected a positive integer between 1 and 50.";
    }

    return "Invalid query parameter.";
};

export const getAllCallsController = async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);

    const parsedQuery = getCallsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        res.status(400).json({
            error: getQueryValidationErrorMessage(parsedQuery.error)
        });
        return;
    }

    const filters: CallFilters = {};

    if (parsedQuery.data.is_archived !== undefined) {
        filters.is_archived = parsedQuery.data.is_archived === "true";
    }

    if (parsedQuery.data.direction !== undefined) {
        filters.direction = parsedQuery.data.direction;
    }

    if (parsedQuery.data.call_type !== undefined) {
        filters.call_type = parsedQuery.data.call_type;
    }

    const { page, limit } = parsedQuery.data;

    const result = await getAllCalls(userId, filters, { page, limit });

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json({
        calls: result.data.items,
        pagination: result.data.pagination
    });
};

export const getCallByIdController = async (
    req: Request<CallIdParams>,
    res: Response
) => {
    const userId = getAuthenticatedUserId(req);
    const callId = req.params.callId;

    const result = await getCallById(userId, callId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json(result.data);
};

export const archiveCallController = async (
    req: Request<CallIdParams>,
    res: Response
) => {
    const userId = getAuthenticatedUserId(req);
    const callId = req.params.callId;

    const result = await archiveCall(userId, callId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json(result.data);
};

export const unarchiveCallController = async (
    req: Request<CallIdParams>,
    res: Response
) => {
    const userId = getAuthenticatedUserId(req);
    const callId = req.params.callId;

    const result = await unarchiveCall(userId, callId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json(result.data);
};

export const addNoteToCallController = async (
    req: Request<CallIdParams>,
    res: Response
) => {
    const userId = getAuthenticatedUserId(req);
    const callId = req.params.callId;

    const content = req.body.content;

    if (typeof content !== "string") {
        res.status(400).json({
            error: "Note content is required and must be a string"
        });
        return;
    }

    const result = await addNoteToCall(userId, callId, content);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(201).json(result.data);
};

export const deleteCallController = async (
    req: Request<CallIdParams>,
    res: Response
) => {
    const userId = getAuthenticatedUserId(req);
    const callId = req.params.callId;

    const result = await deleteCall(userId, callId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json(result.data);
};

export const archiveAllCallsController = async (
    _req: Request,
    res: Response
) => {
    const userId = getAuthenticatedUserId(_req);
    const result = await archiveAllCalls(userId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json(result.data);
};

export const unarchiveAllCallsController = async (
    _req: Request,
    res: Response
) => {
    const userId = getAuthenticatedUserId(_req);
    const result = await unarchiveAllCalls(userId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json(result.data);
};

export const resetCallsController = async (_req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(_req);
    const result = await resetCalls(userId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json(result.data);
};
