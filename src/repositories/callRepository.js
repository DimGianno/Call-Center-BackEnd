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