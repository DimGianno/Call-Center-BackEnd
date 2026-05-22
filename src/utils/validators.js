const VALID_DIRECTIONS = ["inbound", "outbound"];
const VALID_CALL_TYPES = ["answered", "missed", "voicemail"];

const CALL_ID_REGEX = /^[1-9]\d*$/;
const PHONE_REGEX = /^\+33 [1-9](?: \d{2}){4}$/;

export function isValidCallId(callId) {
    return typeof callId === "string" && CALL_ID_REGEX.test(callId);
}

export function isValidPhoneNumber(phone) {
    return typeof phone === "string" && PHONE_REGEX.test(phone);
}


export function validateCall(call) {
    const errors = [];

    if (!call.id || typeof call.id !== "string" || !isValidCallId(call.id)) {
        errors.push("Call id is required and must be a valid string");
    }

    if (!VALID_DIRECTIONS.includes(call.direction)) {
        errors.push("Direction must be either 'inbound' or 'outbound'");
    }

    if (!call.from || typeof call.from !== "string" || !isValidPhoneNumber(call.from)) {
        errors.push("From phone number is required and must be a valid string");
    }

    if (!call.to || typeof call.to !== "string" || !isValidPhoneNumber(call.to)) {
        errors.push("To phone number is required and must be a valid string");
    }

    if (!VALID_CALL_TYPES.includes(call.call_type)) {
        errors.push("Call type must be 'answered', 'missed', or 'voicemail'");
    }

    if (typeof call.duration !== "number" || call.duration < 0) {
        errors.push("Duration must be a non-negative number");
    }

    if (typeof call.is_archived !== "boolean") {
        errors.push("is_archived must be a boolean");
    }

    if (!call.created_at || Number.isNaN(Date.parse(call.created_at))) {
        errors.push("created_at must be a valid date string");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}