import { notes } from "../data/notes.js";

export function findNotesByCallId(callId) {
  return notes.filter((note) => note.call_id === callId);
}