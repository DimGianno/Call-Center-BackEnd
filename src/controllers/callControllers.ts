import type { Request, Response } from "express";
import { 
    getAllCalls,
    getCallById, 
    archiveCall,
} from "../services/callService.js";
import { error } from "node:console";

export const getAllCallsController = (_req: Request, res: Response) => {
    const result = getAllCalls();
    
    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error,
        });
        return;
    }

    res.status(200).json({
        calls: result.data,
    });
};

export const getCallByIdController = (req: Request, res: Response) => {
    const callId = req.params.callId;

    if (!callId || typeof callId !== "string") {
        res.status(400).json({
            error: "Call ID is required and must be a string",
        });
        return;
    }

    const result = getCallById(callId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error,
        });
        return;
    }

    res.status(200).json(result.data);
};

export const archiveCallController = (req: Request, res: Response) => {
    const callId = req.params.callId;

    if (!callId || typeof callId !== "string") {
        res.status(400).json({
            error: "Call ID is required and must be a string",
        });
        return;
    }

    const result = archiveCall(callId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error,
        });
        return;
    }

    res.status(200).json(result.data);
};
