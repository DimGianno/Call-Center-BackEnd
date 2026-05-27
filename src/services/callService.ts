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

export function getAllCalls(filters: CallFilters = {}): ServiceResult<Call[]> {
    let results = findAllCalls();
    if (typeof filters.is_archived === "boolean") {
        results = results.filter(
            (call) => call.is_archived === filters.is_archived
        );
    } else {
        results = results.filter((call) => call.is_archived === false);
    }

    if (filters.direction) {
        results = results.filter(
            (call) => call.direction === filters.direction
        );
    }

    if (filters.call_type) {
        results = results.filter(
            (call) => call.call_type === filters.call_type
        );
    }

    return {
        success: true,
        data: results,
    };
}

export function getCallById(callId: string): ServiceResult<CallWithNotes> {
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

    const notes = findNotesByCallId(callId);
    return {
        success: true,
        data: { ...call, notes },
    };
}

export function archiveCall(callId: string): ServiceResult<Call> {
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
    if (call.is_archived) {
        return { 
            success: false,
            statusCode: 400,
            error: "Call is already archived",
        };
    }

    const updatedCall = updateCall(callId, { is_archived: true });

    if (!updatedCall) {
        return {
            success: false,
            statusCode: 500,
            error: "Failed to archive call",
        };
    }

    return { 
        success: true,
        data: updatedCall,
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
