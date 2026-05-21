import {
  getAllCalls,
  getCallById,
  archiveCall,
  unarchiveCall
} from "./services/callService.js";

console.log("\n=== All non-archived calls ===");
console.log(getAllCalls());

console.log("\n=== Archived calls ===");
console.log(getAllCalls({ is_archived: true }));

console.log("\n=== Unarchive call with ID 3 ===");
console.log(unarchiveCall("3"));

console.log("\n=== Inbound calls ===");
console.log(getAllCalls({ direction: "inbound" }));

console.log("\n=== Calls of type 'missed' ===");
console.log(getAllCalls({ call_type: "missed" }));

console.log("\n=== Inbound calls of type 'voicemail' ===");
console.log(getAllCalls({ direction: "inbound", call_type: "voicemail" }));