import {
  findAllCalls,
  findCallById,
  updateCall
} from "../repositories/callRepository.js";

import { findNotesByCallId } from "../repositories/noteRepository.js";

export function getAllCalls() {
  return findAllCalls().filter((call) => call.is_archived === false);
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