import type { Response } from "express";

export type CallChangeAction =
    | "archive"
    | "unarchive"
    | "delete"
    | "add_note"
    | "delete_note"
    | "archive_all"
    | "unarchive_all"
    | "reset";

type CallChangeEvent = {
    version: 1;
    action: CallChangeAction;
    callId?: string;
};

type CallEventClient = {
    heartbeat: NodeJS.Timeout;
    response: Response;
};

const clientsByUserId = new Map<string, Set<CallEventClient>>();
const HEARTBEAT_INTERVAL_MS = 25_000;

const writeSseEvent = (res: Response, event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
};

export const subscribeToCallEvents = (userId: string, res: Response) => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();
    res.write(": connected\n\n");

    const client: CallEventClient = {
        response: res,
        heartbeat: setInterval(() => {
            res.write(": heartbeat\n\n");
        }, HEARTBEAT_INTERVAL_MS)
    };

    const userClients =
        clientsByUserId.get(userId) ?? new Set<CallEventClient>();
    userClients.add(client);
    clientsByUserId.set(userId, userClients);

    return () => {
        clearInterval(client.heartbeat);
        userClients.delete(client);

        if (userClients.size === 0) {
            clientsByUserId.delete(userId);
        }
    };
};

export const broadcastCallChange = (
    userId: string,
    action: CallChangeAction,
    callId?: string
) => {
    const userClients = clientsByUserId.get(userId);

    if (!userClients) {
        return;
    }

    const event: CallChangeEvent = {
        version: 1,
        action,
        ...(callId ? { callId } : {})
    };

    for (const client of userClients) {
        writeSseEvent(client.response, "calls:changed", event);
    }
};

export const getCallEventClientCount = (userId: string): number => {
    return clientsByUserId.get(userId)?.size ?? 0;
};
