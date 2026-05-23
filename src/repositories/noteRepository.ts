import { notes } from "../data/notes.js";
import type { Note } from "../models/noteModel.js";

function getHighestNoteNumber(): number {
    return notes.reduce((highestNumber, note) => {
        const noteNumber = Number(note.id.replace("note-", ""));

        if (Number.isNaN(noteNumber)) {
            return highestNumber;
        }

        return Math.max(highestNumber, noteNumber);
    }, 0);
}

let nextNoteNumber = getHighestNoteNumber() + 1;

export function findNotesByCallId(callId: string): Note[] {
    return notes.filter((note) => note.call_id === callId);
}

export function createNote(callId: string, content: string): Note {
    const newNote: Note = {
        id: `note-${nextNoteNumber++}`,
        call_id: callId,
        content: content
    };
    notes.push(newNote);
    return newNote;
}

export function deleteNotesByCallId(callId: string): Note[] {
    const deletedNotes: Note[] = [];

    for (let i = notes.length - 1; i >= 0; i--) {
        if (notes[i].call_id === callId) {
            const removedNotes = notes.splice(i, 1);
            deletedNotes.push(removedNotes[0]);
        }
    }

    return deletedNotes;
}
