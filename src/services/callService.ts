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

import { isValidCallId } from "../utils/validators.js";

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

export function unarchiveCall(callId: string): ServiceResult<Call> {
    if (!isValidCallId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format",
        };
    }
    const call = findCallById(callId);
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

    const updatedCall = updateCall(callId, { is_archived: false });

    if (!updatedCall) {
        return {
            success: false,
            statusCode: 500,
            error: "Failed to unarchive call",
        };
    }
    return { 
        success: true,
        data: updatedCall,
    };
}

export function addNoteToCall(
    callId: string,
    content: string
): ServiceResult<CallWithNotes> {
    if (!isValidCallId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format",
        };
    }
    const call = findCallById(callId);

    if (!call) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found",
        };
    }

    if (!content || content.trim() === "") {
        return {
            success: false,
            statusCode: 400,
            error: "Note content cannot be empty",
        };
    }

    createNote(callId, content.trim());

    const notes = findNotesByCallId(callId);

    return {
        success: true,
        data: { ...call, notes }, 
    };
}

export function deleteCall(callId: string): ServiceResult<{message: string}> {
    if (!isValidCallId(callId)) {
        return {
            success: false,
            statusCode: 400,
            error: "Invalid call ID format",
        };
    }

    const call = findCallById(callId);

    if (!call) {
        return {
            success: false,
            statusCode: 404,
            error: "Call not found",
        };
    }

    deleteNotesByCallId(callId);
    deleteCallById(callId);
    return {
        success: true,
        data: {
            message: `Call ${callId} and associated notes deleted successfully`,
        },
    };
}
