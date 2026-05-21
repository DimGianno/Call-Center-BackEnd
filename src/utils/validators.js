const VALID_DIRECTIONS = ["inbound", "outbound"];
const VALID_CALL_TYPES = ["answered", "missed", "voicemail"];

export function validateCall(call) {
    const errors = [];

    if (!call.id || typeof call.id !== "string") {
        errors.push("Call id is required and must be a string");
    }

    if (!VALID_DIRECTIONS.includes(call.direction)) {
        errors.push("Direction must be either 'inbound' or 'outbound'");
    }

    if (!call.from || typeof call.from !== "string") {
        errors.push("From phone number is required and must be a string");
    }

    if (!call.to || typeof call.to !== "string") {
        errors.push("To phone number is required and must be a string");
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