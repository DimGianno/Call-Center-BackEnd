import mongoose, { Schema } from "mongoose";

export type NoteDocument = {
  _id: mongoose.Types.ObjectId;
  content: string;
};

export type CallDocument = {
  _id: mongoose.Types.ObjectId;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  call_type: "answered" | "missed" | "voicemail";
  duration: number;
  is_archived: boolean;
  created_at: Date;
  notes: NoteDocument[];
};

const noteSchema = new Schema<NoteDocument>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: true,
  }
);

const callSchema = new Schema<CallDocument>(
  {
    direction: {
      type: String,
      required: true,
      enum: ["inbound", "outbound"],
    },
    from: {
      type: String,
      required: true,
      trim: true,
    },
    to: {
      type: String,
      required: true,
      trim: true,
    },
    call_type: {
      type: String,
      required: true,
      enum: ["answered", "missed", "voicemail"],
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    is_archived: {
      type: Boolean,
      required: true,
      default: false,
    },
    created_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: [noteSchema],
      default: [],
    },
  },
  {
    versionKey: false,
  }
);

export const CallDbModel = mongoose.model<CallDocument>("Call", callSchema);