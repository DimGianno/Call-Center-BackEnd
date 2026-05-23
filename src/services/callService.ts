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
import type { Note } from "../models/noteModel.js";
import type {
    CallWithNotes,
    CommandResult,
    ServiceError
} from "../models/serviceTypes.js";

import { isValidCallId } from "../utils/validators.js";

export function getAllCalls(filters: CallFilters = {}): Call[] {
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

    return results;
}

export function getCallById(callId: string): CallWithNotes | ServiceError {
    if (!isValidCallId(callId)) {
        return { error: "Invalid call ID format" };
    }

    const call = findCallById(callId);
    if (!call) {
        return { error: "Call not found" };
    }

    const notes = findNotesByCallId(callId);
    return {
        ...call,
        notes
    };
}

export function archiveCall(callId: string): CommandResult {
    if (!isValidCallId(callId)) {
        return { error: "Invalid call ID format" };
    }
    const call = findCallById(callId);
    if (!call) {
        return { error: "Call not found" };
    }
    if (call.is_archived) {
        return { error: "Call is already archived" };
    }

    updateCall(callId, { is_archived: true });
    return { message: `Call ${callId} archived successfully` };
}

export function unarchiveCall(callId: string): CommandResult {
    if (!isValidCallId(callId)) {
        return { error: "Invalid call ID format" };
    }
    const call = findCallById(callId);
    if (!call) {
        return { error: "Call not found" };
    }
    if (!call.is_archived) {
        return { error: "Call is not archived" };
    }

    updateCall(callId, { is_archived: false });
    return { message: `Call ${callId} unarchived successfully` };
}

export function addNoteToCall(
    callId: string,
    content: string
): CallWithNotes | ServiceError {
    if (!isValidCallId(callId)) {
        return { error: "Invalid call ID format" };
    }
    const call = findCallById(callId);

    if (!call) {
        return { error: "Call not found" };
    }

    if (!content || content.trim() === "") {
        return { error: "Note content cannot be empty" };
    }

    createNote(callId, content.trim());

    const notes = findNotesByCallId(callId);

    return {
        ...call,
        notes
    };
}

export function deleteCall(callId: string): CommandResult {
    if (!isValidCallId(callId)) {
        return { error: "Invalid call ID format" };
    }

    const call = findCallById(callId);

    if (!call) {
        return { error: "Call not found" };
    }

    deleteNotesByCallId(callId);
    deleteCallById(callId);
    return {
        message: `Call ${callId} and associated notes deleted successfully`
    };
}
