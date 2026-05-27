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

function printSection(title: string): void {
    console.log(`\n=== ${title} ===`);
}

printSection("1. Get all active calls");
console.table(getAllCalls());

printSection("2. Get archived calls only");
console.table(getAllCalls({ is_archived: true }));

printSection("3. Filter active inbound calls");
console.table(getAllCalls({ direction: "inbound" }));

printSection("4. Filter active missed calls");
console.table(getAllCalls({ call_type: "missed" }));

printSection("5. Get one valid call with notes");
console.log(getCallById("1"));

printSection("6. Try to get a call with invalid id format");
console.log(getCallById("abc"));

printSection("7. Try to get a call that does not exist");
console.log(getCallById("999"));

printSection("8. Archive a valid call");
console.log(archiveCall("1"));

printSection("9. Try to archive the same call again");
console.log(archiveCall("1"));

printSection("10. Try to archive a call with invalid id format");
console.log(archiveCall("abc"));

printSection("11. Try to archive a call that does not exist");
console.log(archiveCall("999"));

printSection("12. Unarchive a valid call");
console.log(unarchiveCall("1"));

printSection("13. Try to unarchive the same call again");
console.log(unarchiveCall("1"));

printSection("14. Add a valid note to a call");
console.log(addNoteToCall("2", "Customer requested a follow-up call."));

printSection("15. Try to add an empty note");
console.log(addNoteToCall("2", "   "));

printSection("16. Try to add a note to a missing call");
console.log(addNoteToCall("999", "This should fail."));

printSection("17. Try to add a note with invalid call id format");
console.log(addNoteToCall("abc", "This should fail."));

printSection("18. Get call 2 after adding note");
console.log(getCallById("2"));

printSection("19. Delete a valid call and its notes");
console.log(deleteCall("3"));

printSection("20. Try to get deleted call");
console.log(getCallById("3"));

printSection("21. Try to delete the same call again");
console.log(deleteCall("3"));

printSection("22. Validate all remaining active calls");
const activeCalls = getAllCalls();

if (activeCalls.length === 0) {
    console.log("No active calls found.");
} else {
    activeCalls.forEach((call) => {
        const validationResult = validateCall(call);

        if (validationResult.isValid) {
            console.log(`Call ${call.id} is valid.`);
        } else {
            console.log(`Call ${call.id} is invalid:`);
            console.log(validationResult.errors);
        }
    });
}
