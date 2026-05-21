import {
  getAllCalls,
  getCallById,
  archiveCall
} from "./services/callService.js";

console.log("=== All non-archived calls ===");
console.log(getAllCalls());

console.log("=== Single call with notes ===");
console.log(getCallById("1"));

console.log("=== Archive call with id 1 ===");
console.log(archiveCall("1"));

console.log("=== All non-archived calls after archiving id 1 ===");
console.log(getAllCalls());

console.log("=== Try to get a call that does not exist ===");
console.log(getCallById("999"));