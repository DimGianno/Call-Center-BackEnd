import type { CallDocument } from "../db/models/callDbModel.js";
import type { Call } from "../models/callModel.js";
import type { CallWithNotes } from "../models/serviceTypes.js";

export const mapCallDocumentToCall = (call: CallDocument): Call => {
    return {
        id: call._id.toString(),
        direction: call.direction,
        from: call.from,
        to: call.to,
        call_type: call.call_type,
        duration: call.duration,
        is_archived: call.is_archived,
        created_at: call.created_at.toISOString()
    };
};

export const mapCallDocumentToCallWithNotes = (
    call: CallDocument
): CallWithNotes => {
    return {
        ...mapCallDocumentToCall(call),
        notes: call.notes.map((note) => ({
            id: note._id.toString(),
            content: note.content
        }))
    };
};
