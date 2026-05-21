import { addNoteToCall } from "./repositories/noteRepository.js";
import {
  getAllCalls,
  getCallById,
  archiveCall,
  unarchiveCall,
  addNoteToCallService
} from "./services/callService.js";

console.log("=== Call with ID 1 ===");
console.log(getCallById("1"));

console.log("\n=== Add a note to a call ===");
console.log(addNoteToCallService("1", "This is a new note for call 1"));

console.log("=== Call with ID 1 ===");
console.log(getCallById("1"));

console.log("\n=== Try to add note to missing call ===");
console.log(addNoteToCallService("999", "This should fail."));

console.log("\n=== Try to add empty note ===");
console.log(addNoteToCallService("1", ""));