import mongoose, { Schema } from "mongoose";

export type NoteInput = {
    content: string;
};

export type NoteDocument = NoteInput & {
    _id: mongoose.Types.ObjectId;
};

export type CallDocument = {
    _id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    direction: "inbound" | "outbound";
    from: string;
    to: string;
    call_type: "answered" | "missed" | "voicemail";
    duration: number;
    is_archived: boolean;
    created_at: Date;
    notes: NoteDocument[];
};

const noteSchema = new Schema<NoteInput>(
    {
        content: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        _id: true
    }
);

const callSchema = new Schema<CallDocument>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        direction: {
            type: String,
            required: true,
            enum: ["inbound", "outbound"]
        },
        from: {
            type: String,
            required: true,
            trim: true
        },
        to: {
            type: String,
            required: true,
            trim: true
        },
        call_type: {
            type: String,
            required: true,
            enum: ["answered", "missed", "voicemail"]
        },
        duration: {
            type: Number,
            required: true,
            min: 0
        },
        is_archived: {
            type: Boolean,
            required: true,
            default: false
        },
        created_at: {
            type: Date,
            required: true,
            default: Date.now
        },
        notes: {
            type: [noteSchema],
            default: []
        }
    },
    {
        versionKey: false
    }
);

callSchema.index(
    {
        user_id: 1,
        is_archived: 1,
        created_at: -1
    },
    {
        name: "user_archive_created_at_idx"
    }
);

export const CallDbModel = mongoose.model<CallDocument>("Call", callSchema);
