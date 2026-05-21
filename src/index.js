import {
  getAllCalls,
  getCallById,
  archiveCall,
  unarchiveCall
} from "./services/callService.js";

console.log("\n=== All non-archived calls ===");
console.log(getAllCalls());

console.log("\n=== Single call with notes ===");
console.log(getCallById("1"));

console.log("\n=== Archive call with id 1 ===");
console.log(archiveCall("1"));

console.log("\n=== All non-archived calls after archiving id 1 ===");
console.log(getAllCalls());

console.log("\n=== Try to get a call that does not exist ===");
console.log(getCallById("999"));

console.log("\n=== Unarchive call with id 1 ===");
console.log(unarchiveCall("1"));