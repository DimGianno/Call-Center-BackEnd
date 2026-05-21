import { notes } from "../data/notes.js";

export function findNotesByCallId(callId) {
  return notes.filter((note) => note.call_id === callId);
}

export function addNoteToCall(callId, content) {
  const newNote = {
    id: `note-${notes.length + 1}`,
    call_id: callId,
    content: content
  };
  notes.push(newNote);
  return newNote;
}