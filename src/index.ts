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
const activeCalls = getAllCalls();

if (activeCalls.length === 0) {
    console.log("No active calls found.");
} else {
    activeCalls.forEach((call) => {
        const validationResult = validateCall(call);

        if (!validationResult.isValid) {
            console.log(`Call ${call.id} is invalid:`);
            console.log(validationResult.errors);
        }
    });
}

console.log("\n=== Validate specific call ===");
console.log(getCallById("abc"));

console.log("\n=== Archive call ===");
console.log(archiveCall("1"));
console.log("\n=== Unarchive call ===");
console.log(unarchiveCall("1"));
console.log("\n=== Add note to call ===");
console.log(addNoteToCall("1", "TestTestTestTestTestTestTestTestTestTestTest"));
