import type { Call } from "../models/callModel.js";

export const calls: Call[] = [
    {
        id: "1",
        direction: "inbound",
        from: "+33 6 12 34 56 78",
        to: "+33 1 23 45 67 89",
        call_type: "answered",
        duration: 120,
        is_archived: false,
        created_at: "2025-04-10T14:32:00Z"
    },
    {
        id: "2",
        direction: "outbound",
        from: "+33 1 23 45 67 89",
        to: "+33 6 98 76 54 32",
        call_type: "missed",
        duration: 0,
        is_archived: false,
        created_at: "2025-04-10T15:10:00Z"
    },
    {
        id: "3",
        direction: "inbound",
        from: "+33 7 55 44 33 22",
        to: "+33 1 23 45 67 89",
        call_type: "voicemail",
        duration: 45,
        is_archived: true,
        created_at: "2025-04-09T09:15:00Z"
    }
];
