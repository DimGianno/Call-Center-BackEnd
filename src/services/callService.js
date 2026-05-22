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

import { 
  isValidCallId
} from "../utils/validators.js";

export function getAllCalls(filters = {}) {
  let results = findAllCalls();
  if (typeof filters.is_archived === "boolean") {
    results = results.filter((call) => call.is_archived === filters.is_archived);
  } else {
    results = results.filter((call) => call.is_archived === false);
  }

  if (filters.direction) {
    results = results.filter((call) => call.direction === filters.direction);
  }

  if (filters.call_type) {
    results = results.filter((call) => call.call_type === filters.call_type);
  }
  if (results.length === 0) {
    return { message: "No calls found or bad filters" };
  }
  return results;
}

export function getCallById(callId) {
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

export function archiveCall(callId) {
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
    return {"message": `Call ${callId} archived successfully` };
}

export function unarchiveCall(callId) {
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
    return {"message": `Call ${callId} unarchived successfully` };
}

export function addNoteToCall(callId, content) {
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
    return { message: `Note added to call ${callId} successfully` };
}

export function deleteCall(callId) {
    if (!isValidCallId(callId)) {
        return { error: "Invalid call ID format" };
    }

    const call = findCallById(callId);

    if (!call) {
        return { error: "Call not found" };
    }

    deleteNotesByCallId(callId);
    deleteCallById(callId);
    return { message: `Call ${callId} and associated notes deleted successfully` };
}