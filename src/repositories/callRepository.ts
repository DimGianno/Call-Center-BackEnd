import { calls } from "../data/calls.js";
import type { Call } from "../models/callModel.js";

export function findAllCalls(): Call[] {
    return calls;
}

export function findCallById(callId: string): Call | null {
    return calls.find((call) => call.id === callId) || null;
}

export function updateCall(
    callId: string,
    updatedFields: Partial<Call>
): Call | null {
    const call = findCallById(callId);

    if (!call) {
        return null;
    }

    Object.assign(call, updatedFields);

    return call;
}

export function deleteCallById(callId: string): Call | null {
    const callIndex = calls.findIndex((call) => call.id === callId);

    if (callIndex === -1) {
        return null;
    }

    const deletedCall = calls.splice(callIndex, 1)[0];

    return deletedCall;
}
