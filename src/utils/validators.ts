import mongoose from "mongoose";
import type { Call } from "../models/callModel.js";

export const isValidMongoObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

const VALID_DIRECTIONS = ["inbound", "outbound"] as const;
const VALID_CALL_TYPES = ["answered", "missed", "voicemail"] as const;

const CALL_ID_REGEX = /^[1-9]\d*$/;
const PHONE_REGEX = /^\+33 [1-9](?: \d{2}){4}$/;

export type ValidationResult = {
    isValid: boolean;
    errors: string[];
};

export function isValidCallId(callId: string): boolean {
    return CALL_ID_REGEX.test(callId);
}

export function isValidPhoneNumber(phone: string): boolean {
    return PHONE_REGEX.test(phone);
}

export function validateCall(call: Call): ValidationResult {
    const errors: string[] = [];

    if (!isValidCallId(call.id)) {
        errors.push("Call id is required and must be a valid string");
    }

    if (!VALID_DIRECTIONS.includes(call.direction)) {
        errors.push("Direction must be either 'inbound' or 'outbound'");
    }

    if (!isValidPhoneNumber(call.from)) {
        errors.push("From phone number is required and must be a valid string");
    }

    if (!isValidPhoneNumber(call.to)) {
        errors.push("To phone number is required and must be a valid string");
    }

    if (!VALID_CALL_TYPES.includes(call.call_type)) {
        errors.push("Call type must be 'answered', 'missed', or 'voicemail'");
    }

    if (call.duration < 0) {
        errors.push("Duration must be a non-negative number");
    }

    if (Number.isNaN(Date.parse(call.created_at))) {
        errors.push("created_at must be a valid date string");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
