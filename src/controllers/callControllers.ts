import type { Request, Response } from "express";
import { 
    getAllCalls,
    getCallById, 
    archiveCall,
    unarchiveCall,
    addNoteToCall,
    deleteCall,
    archiveAllCalls,
    unarchiveAllCalls,
} from "../services/callService.js";
import type { CallFilters } from "../models/callModel.js";

export const getAllCallsController = async (req: Request, res: Response) => {
    const filters: CallFilters = {};

    const isArchived = req.query.is_archived;

    if (isArchived !== undefined) {
        if (isArchived === "true") {
        filters.is_archived = true;
        } else if (isArchived === "false") {
        filters.is_archived = false;
        } else {
        res.status(400).json({
            error: "Invalid is_archived filter. Expected 'true' or 'false'.",
        });
        return;
        }
    }

    const direction = req.query.direction;

    if (direction !== undefined) {
        if (direction === "inbound" || direction === "outbound") {
        filters.direction = direction;
        } else {
        res.status(400).json({
            error: "Invalid direction filter. Expected 'inbound' or 'outbound'.",
        });
        return;
        }
    }

    const callType = req.query.call_type;

    if (callType !== undefined) {
        if (
        callType === "answered" ||
        callType === "missed" ||
        callType === "voicemail"
        ) {
        filters.call_type = callType;
        } else {
        res.status(400).json({
            error:
            "Invalid call_type filter. Expected 'answered', 'missed', or 'voicemail'.",
        });
        return;
        }
    }

    const pageQuery = req.query.page;
    const limitQuery = req.query.limit;

    const page =
    typeof pageQuery === "string" ? Number.parseInt(pageQuery, 10) : 1;

    const limit =
    typeof limitQuery === "string" ? Number.parseInt(limitQuery, 10) : 10;

    if (!Number.isInteger(page) || page < 1) {
    res.status(400).json({
        error: "Invalid page. Expected a positive integer.",
    });
    return;
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    res.status(400).json({
        error: "Invalid limit. Expected a positive integer between 1 and 50.",
    });
    return;
    }

    const result = await getAllCalls(filters, { page, limit });

    if (!result.success) {
    res.status(result.statusCode).json({
        error: result.error,
    });
    return;
    }

    res.status(200).json({
    calls: result.data.items,
    pagination: result.data.pagination,
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

export const unarchiveCallController = async (req: Request, res: Response) => {
    const callId = req.params.callId;

    if (!callId || typeof callId !== "string") {
        res.status(400).json({
            error: "Call ID is required and must be a string",
        });
        return;
    }

    const result = await unarchiveCall(callId);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error,
        });
        return;
    }

    res.status(200).json(result.data);
};

export const addNoteToCallController = async ( req: Request, res: Response) => {
  const callId = req.params.callId;

  if (!callId || typeof callId !== "string") {
    res.status(400).json({
      error: "Call ID is required and must be a string",
    });
    return;
  }

  const content = req.body.content;

  if (typeof content !== "string") {
    res.status(400).json({
      error: "Note content is required and must be a string",
    });
    return;
  }

  const result = await addNoteToCall(callId, content);

  if (!result.success) {
    res.status(result.statusCode).json({
      error: result.error,
    });
    return;
  }

  res.status(201).json(result.data);
};

export const deleteCallController = async (req: Request, res: Response) => {
    const callId = req.params.callId;

    if (!callId || typeof callId !== "string") {
    res.status(400).json({
        error: "Call ID is required and must be a string",
    });
    return;
    }

    const result = await deleteCall(callId);

    if (!result.success) {
    res.status(result.statusCode).json({
        error: result.error,
    });
    return;
    }

    res.status(200).json(result.data);
};

export const archiveAllCallsController = async (_req: Request, res: Response) => {
  const result = await archiveAllCalls();

  if (!result.success) {
    res.status(result.statusCode).json({
      error: result.error,
    });
    return;
  }

  res.status(200).json(result.data);
};

export const unarchiveAllCallsController = async ( _req: Request, res: Response) => {
  const result = await unarchiveAllCalls();

  if (!result.success) {
    res.status(result.statusCode).json({
      error: result.error,
    });
    return;
  }

  res.status(200).json(result.data);
};