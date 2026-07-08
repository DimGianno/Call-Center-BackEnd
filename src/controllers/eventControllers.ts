import type { Request, Response } from "express";

import { getAuthenticatedUserId } from "../middleware/authMiddleware.js";
import { subscribeToCallEvents } from "../services/callEventsService.js";

export const streamCallEventsController = (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const unsubscribe = subscribeToCallEvents(userId, res);

    req.on("close", unsubscribe);
};
