import {
  findAllCalls,
  findCallById,
  updateCall
} from "../repositories/callRepository.js";

import { findNotesByCallId } from "../repositories/noteRepository.js";

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

  return results;
}

export function getCallById(callId) {
  const call = findCallById(callId);

  if (!call) {
    return null;
  }

  const notes = findNotesByCallId(callId);

  return {
    ...call,
    notes
  };
}

export function archiveCall(callId) {
  return updateCall(callId, { is_archived: true });
}

export function unarchiveCall(callId) {
  return updateCall(callId, { is_archived: false });
}