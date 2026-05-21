import { notes } from "../data/notes.js";

function getHighestNoteNumber() {
    return notes.reduce((highestNumber, note) => {
        const noteNumber = Number(note.id.replace("note-", ""));

        if (Number.isNaN(noteNumber)) {
            return highestNumber;
        }

        return Math.max(highestNumber, noteNumber);
    }, 0);
}

let nextNoteNumber = getHighestNoteNumber() + 1;

export function findNotesByCallId(callId) {
  return notes.filter((note) => note.call_id === callId);
}

export function createNote(callId, content) {
  const newNote = {
    id: `note-${nextNoteNumber++}`,
    call_id: callId,
    content: content
  };
  notes.push(newNote);
  return newNote;
}

export function deleteNotesByCallId(callId) {
  const deletedNotes = [];

  for (let i = notes.length - 1; i >= 0; i--) {
    if (notes[i].call_id === callId) {
      const removedNotes = notes.splice(i, 1);
      deletedNotes.push(removedNotes[0]);
    }
  }

  return deletedNotes;
}