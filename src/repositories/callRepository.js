import { calls } from "../data/calls.js";

export function findAllCalls() {
    return calls;
}

export function findCallById(callId) {
    return calls.find((call) => call.id === callId) || null;
}

export function updateCall(callId, updatedFields) {
    const call = findCallById(callId);

    if (!call) {
        return null;
    }

    Object.assign(call, updatedFields);

    return call;
}

export function deleteCallById(callId) {
    const callIndex = calls.findIndex((call) => call.id === callId);

    if (callIndex === -1) {
        return false;
    }

    const deletedCall = calls.splice(callIndex, 1)[0];

    return deletedCall;
}
