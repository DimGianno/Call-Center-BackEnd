import type { Types } from "mongoose";

const directions = ["inbound", "outbound"] as const;
const callTypes = ["answered", "missed", "voicemail"] as const;

type Direction = (typeof directions)[number];
type CallType = (typeof callTypes)[number];

export type MockCallInput = {
    user_id: Types.ObjectId;
    direction: Direction;
    from: string;
    to: string;
    call_type: CallType;
    duration: number;
    is_archived: boolean;
    created_at: Date;
    notes: Array<{
        content: string;
    }>;
};

const noteTemplates = [
    "Customer asked about pricing plan",
    "Customer requested a callback",
    "Customer reported an account access issue",
    "Customer asked for billing clarification",
    "Customer wanted more information about available services",
    "Customer asked to update contact details",
    "Customer requested technical support",
    "Customer asked about cancellation policy",
    "Customer wanted to speak with a supervisor",
    "Customer left a follow-up question"
];

const generatePhoneNumber = (index: number): string => {
    const baseNumber = 600000000 + index;
    return `+33${baseNumber}`;
};

const generateNotes = (callIndex: number): MockCallInput["notes"] => {
    const noteCount = callIndex % 4;

    return Array.from({ length: noteCount }, (_, noteIndex) => ({
        content: noteTemplates[(callIndex + noteIndex) % noteTemplates.length]
    }));
};

export const generateMockCalls = (
    count: number,
    userId: Types.ObjectId
): MockCallInput[] => {
    return Array.from({ length: count }, (_, index) => {
        const callNumber = index + 1;
        const direction = directions[index % directions.length];
        const call_type = callTypes[index % callTypes.length];

        return {
            user_id: userId,
            direction,
            from:
                direction === "inbound"
                    ? generatePhoneNumber(callNumber)
                    : "+33123456789",
            to:
                direction === "inbound"
                    ? "+33123456789"
                    : generatePhoneNumber(callNumber),
            call_type,
            duration:
                call_type === "missed" ? 0 : 30 + ((callNumber * 17) % 420),
            is_archived: callNumber % 5 === 0,
            created_at: new Date(
                Date.UTC(
                    2025,
                    3,
                    1 + (index % 28),
                    8 + (index % 10),
                    (index * 7) % 60,
                    0
                )
            ),
            notes: generateNotes(callNumber)
        };
    });
};
