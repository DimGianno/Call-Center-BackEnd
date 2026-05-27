import {
    findAllCalls,
    findCallById,
    updateCall,
    deleteCallById
} from "../repositories/callRepository.js";

import {
    findNotesByCallId,
    createNote,
    deleteNotesByCallId
} from "../repositories/noteRepository.js";

import type { Call, CallFilters } from "../models/callModel.js";
import type {
    CallWithNotes,
    ServiceResult,
} from "../models/serviceTypes.js";

import { isValidMongoObjectId  } from "../utils/validators.js";

import { CallDbModel } from "../db/models/callDbModel.js";
import {
    mapCallDocumentToCall,
    mapCallDocumentToCallWithNotes,
} from "../mappers/callMapper.js";



export async function getAllCalls(filters: CallFilters = {}): Promise<ServiceResult<Call[]>> {
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

    const calls = await CallDbModel.find(query).sort({ created_at: -1});

    return {
        success: true,
        data: calls.map(mapCallDocumentToCall),
    };
}

export async function getCallById(callId: string): Promise<ServiceResult<CallWithNotes>> {
    if (!isValidMongoObjectId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format",
        };
    }

    const call = await CallDbModel.findById(callId);

    if (!call) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found",
        };
    }

    return {
        success: true,
        data: mapCallDocumentToCallWithNotes(call),
    };
}

export async function archiveCall(callId: string): Promise<ServiceResult<Call>> {
    if (!isValidMongoObjectId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format",
        };
    }
    
    const call = await CallDbModel.findById(callId);

    if (!call) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found",
        };
    }
    if (call.is_archived) {
        return { 
            success: false,
            statusCode: 400,
            error: "Call is already archived",
        };
    }

    call.is_archived = true;

    const updatedCall = await call.save();

    return { 
        success: true,
        data: mapCallDocumentToCall(updatedCall),
    };
}

export async function unarchiveCall(callId: string): Promise<ServiceResult<Call>> {
    if (!isValidMongoObjectId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format",
        };
    }

    const call = await CallDbModel.findById(callId);
    
    if (!call) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found",
        };
    }
    if (!call.is_archived) {
        return { 
            success: false,
            statusCode: 400,
            error: "Call is not archived",
        };
    }

    call.is_archived = false;

    const updatedCall = await call.save();

    return { 
        success: true,
        data: mapCallDocumentToCall(updatedCall),
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
            error: "Invalid call ID format",
        };
    }
    
    if (!content || content.trim() === "") {
        return {
            success: false,
            statusCode: 400,
            error: "Note content cannot be empty",
        };
    }

    const call = await CallDbModel.findById(callId);

    if (!call) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found",
        };
    }

    call.notes.push({
        content: content.trim(),
    } as never);

    const updatedCall = await call.save();

    return {
        success: true,
        data: mapCallDocumentToCallWithNotes(updatedCall), 
    };
}

export async function deleteCall(callId: string): Promise<ServiceResult<{message: string}>> {
    if (!isValidMongoObjectId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format",
        };
    }
    
    const deletedCall = await CallDbModel.findByIdAndDelete(callId);

    if (!deletedCall) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found",
        };
    }

    return {
        success: true,
        data: {
            message: `Call ${callId} and associated notes deleted successfully`,
        },
    };
}
