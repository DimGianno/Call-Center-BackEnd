import type { Call, CallFilters } from "../models/callModel.js";
import type {
    CallWithNotes,
    PaginatedResult,
    PaginationOptions,
    ServiceResult
} from "../models/serviceTypes.js";

import { isValidMongoObjectId } from "../utils/validators.js";

import { CallDbModel } from "../db/models/callDbModel.js";
import {
    mapCallDocumentToCall,
    mapCallDocumentToCallWithNotes
} from "../mappers/callMapper.js";

export async function getAllCalls(
    filters: CallFilters = {},
    paginationOptions: PaginationOptions = { page: 1, limit: 10 }
): Promise<ServiceResult<PaginatedResult<Call>>> {
    const query: Partial<CallFilters> = {};

    if (typeof filters.is_archived === "boolean") {
        query.is_archived = filters.is_archived;
    } else {
        query.is_archived = false;
    }

    if (filters.direction) {
        query.direction = filters.direction;
    }

    if (filters.call_type) {
        query.call_type = filters.call_type;
    }

    const { page, limit } = paginationOptions;
    const skip = (page - 1) * limit;

    const [calls, totalItems] = await Promise.all([
        CallDbModel.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit),
        CallDbModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
        success: true,
        data: {
            items: calls.map(mapCallDocumentToCall),
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        }
    };
}

export async function getCallById(
    callId: string
): Promise<ServiceResult<CallWithNotes>> {
    if (!isValidMongoObjectId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format"
        };
    }

    const call = await CallDbModel.findById(callId);

    if (!call) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found"
        };
    }

    return {
        success: true,
        data: mapCallDocumentToCallWithNotes(call)
    };
}

export async function archiveCall(
    callId: string
): Promise<ServiceResult<Call>> {
    if (!isValidMongoObjectId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format"
        };
    }

    const call = await CallDbModel.findById(callId);

    if (!call) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found"
        };
    }
    if (call.is_archived) {
        return {
            success: false,
            statusCode: 400,
            error: "Call is already archived"
        };
    }

    call.is_archived = true;

    const updatedCall = await call.save();

    return {
        success: true,
        data: mapCallDocumentToCall(updatedCall)
    };
}

export async function unarchiveCall(
    callId: string
): Promise<ServiceResult<Call>> {
    if (!isValidMongoObjectId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format"
        };
    }

    const call = await CallDbModel.findById(callId);

    if (!call) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found"
        };
    }
    if (!call.is_archived) {
        return {
            success: false,
            statusCode: 400,
            error: "Call is not archived"
        };
    }

    call.is_archived = false;

    const updatedCall = await call.save();

    return {
        success: true,
        data: mapCallDocumentToCall(updatedCall)
    };
}

export async function addNoteToCall(
    callId: string,
    content: string
): Promise<ServiceResult<CallWithNotes>> {
    if (!isValidMongoObjectId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format"
        };
    }

    if (!content || content.trim() === "") {
        return {
            success: false,
            statusCode: 400,
            error: "Note content cannot be empty"
        };
    }

    const call = await CallDbModel.findById(callId);

    if (!call) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found"
        };
    }

    call.notes.push({
        content: content.trim()
    } as never);

    const updatedCall = await call.save();

    return {
        success: true,
        data: mapCallDocumentToCallWithNotes(updatedCall)
    };
}

export async function deleteCall(
    callId: string
): Promise<ServiceResult<{ message: string }>> {
    if (!isValidMongoObjectId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format"
        };
    }

    const deletedCall = await CallDbModel.findByIdAndDelete(callId);

    if (!deletedCall) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found"
        };
    }

    return {
        success: true,
        data: {
            message: `Call ${callId} and associated notes deleted successfully`
        }
    };
}

export async function archiveAllCalls(): Promise<
    ServiceResult<{ message: string; modifiedCount: number }>
> {
    const result = await CallDbModel.updateMany(
        { is_archived: false },
        { $set: { is_archived: true } }
    );

    return {
        success: true,
        data: {
            message: "All active calls archived successfully",
            modifiedCount: result.modifiedCount
        }
    };
}

export async function unarchiveAllCalls(): Promise<
    ServiceResult<{ message: string; modifiedCount: number }>
> {
    const result = await CallDbModel.updateMany(
        { is_archived: true },
        { $set: { is_archived: false } }
    );

    return {
        success: true,
        data: {
            message: "All archived calls unarchived successfully",
            modifiedCount: result.modifiedCount
        }
    };
}
