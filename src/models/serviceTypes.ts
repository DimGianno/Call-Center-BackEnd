import type { Call } from "./callModel.js";

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

export type NoteResponse = {
  id: string;
  content: string;
};

export type CallWithNotes = Call & {
  notes: NoteResponse[];
};