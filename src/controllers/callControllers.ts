import type { Request, Response } from "express";

export const getAllCallsController = (_req: Request, res: Response) => {
    res.json({
        message: "Get all calls controller works",
    });
};

export const getCallByIdController = (req: Request, res: Response) => {
    res.json({
        message: "Get single call controller works",
        callId: req.params.callId,
    });
};

export const archiveCallController = (req: Request, res: Response) => {
    res.json({
        message: "Archive call controller works",
        callId: req.params.callId,
    });
};
