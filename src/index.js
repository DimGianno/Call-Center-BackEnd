import { validateCall } from "./utils/validators.js";
import { createNote } from "./repositories/noteRepository.js";
import {
  getAllCalls,
  getCallById,
  archiveCall,
  unarchiveCall,
  addNoteToCall,
  deleteCall
} from "./services/callService.js";

console.log("\n=== Validate all seed calls ===");

getAllCalls().forEach((call) => {
    const validationResult = validateCall(call);

    if (!validationResult.isValid) {
        console.log(`Call ${call.id} is invalid:`);
        console.log(validationResult.errors);
    }
    else {
        console.log(`Call ${call.id} is valid.`);
    }
});

console.log("\n=== Validate specific call ===");
console.log(getCallById("abc"));