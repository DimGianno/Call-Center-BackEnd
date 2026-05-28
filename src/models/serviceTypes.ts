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

export type PaginationOptions = {
  page: number;
  limit: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};