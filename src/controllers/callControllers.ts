import type { Request, Response } from "express";
import { 
    getAllCalls,
    getCallById, 
    archiveCall,
} from "../services/callService.js";
import { error } from "node:console";

export const getAllCallsController = async (_req: Request, res: Response) => {
    const result = await getAllCalls();
    
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

export const getCallByIdController = async (req: Request, res: Response) => {
    const callId = req.params.callId;

    if (!callId || typeof callId !== "string") {
        res.status(400).json({
            error: "Call ID is required and must be a string",
        });
        return;
    }

    const result = await getCallById(callId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error,
        });
        return;
    }

    res.status(200).json(result.data);
};

export const archiveCallController = async (req: Request, res: Response) => {
    const callId = req.params.callId;

    if (!callId || typeof callId !== "string") {
        res.status(400).json({
            error: "Call ID is required and must be a string",
        });
        return;
    }

    const result = await archiveCall(callId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error,
        });
        return;
    }

    res.status(200).json(result.data);
};
