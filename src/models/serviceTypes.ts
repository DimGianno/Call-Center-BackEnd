import type { Call } from "./callModel.js";
import type { Note } from "./noteModel.js";

export type ServiceError = {
    error: string;
};

export type ServiceSuccess = {
    message: string;
};

export type CommandResult = ServiceSuccess | ServiceError;

export type CallWithNotes = Call & {
    notes: Note[];
};
