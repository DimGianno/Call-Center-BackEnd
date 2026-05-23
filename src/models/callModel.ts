export type CallDirection = "inbound" | "outbound";

export type CallType = "answered" | "missed" | "voicemail";

export type Call = {
    id: string;
    direction: CallDirection;
    from: string;
    to: string;
    call_type: CallType;
    duration: number;
    is_archived: boolean;
    created_at: string;
};

export type CallFilters = {
    direction?: CallDirection;
    call_type?: CallType;
    is_archived?: boolean;
};
