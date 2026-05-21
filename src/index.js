import { createNote } from "./repositories/noteRepository.js";
import {
  getAllCalls,
  getCallById,
  archiveCall,
  unarchiveCall,
  addNoteToCall,
  deleteCall
} from "./services/callService.js";

console.log("\n=== test call ===");
console.log(deleteCall("3"));
console.log(addNoteToCall("2", "This is a new note for call 2"));
console.log(getCallById("1"));
console.log(getCallById("2"));
console.log(addNoteToCall("2", "This is a new new note for call 2"));
console.log(addNoteToCall("2", "This is a new new note for call 2"));
console.log(getCallById("2"));





