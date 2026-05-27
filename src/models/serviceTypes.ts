import type { Call } from "./callModel.js";
import type { Note } from "./noteModel.js";

export type ServiceSuccess<T> = {
  success: true;
  data: T;
};

export type ServiceError = {
  success: false;
  statusCode: number;
  error: string;
};

export type ServiceResult<T> = ServiceSuccess<T> | ServiceError;

export type CallWithNotes = Call & {
  notes: Note[];
};