import type { UserDocument } from "../db/models/userDbModel.js";
import { sendEmail } from "./emailService.js";

const escapeHtml = (value: string): string => {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
};

export const sendNewSignupNotification = async (
    user: UserDocument
): Promise<boolean> => {
    const notificationEmail = process.env.NEW_SIGNUP_NOTIFICATION_EMAIL?.trim();

    if (process.env.NODE_ENV !== "production" || !notificationEmail) {
        return false;
    }

    const userId = user._id.toString();
    const createdAt = user.created_at.toISOString();

    return sendEmail({
        to: notificationEmail,
        subject: "[Production] New Call Center signup",
        text: [
            "A new user signed up for the Call Center production app.",
            "",
            `Name: ${user.name}`,
            `Email: ${user.email}`,
            `User ID: ${userId}`,
            `Signed up at: ${createdAt}`
        ].join("\n"),
        html: [
            "<p>A new user signed up for the Call Center production app.</p>",
            "<dl>",
            `<dt>Name</dt><dd>${escapeHtml(user.name)}</dd>`,
            `<dt>Email</dt><dd>${escapeHtml(user.email)}</dd>`,
            `<dt>User ID</dt><dd>${escapeHtml(userId)}</dd>`,
            `<dt>Signed up at</dt><dd>${escapeHtml(createdAt)}</dd>`,
            "</dl>"
        ].join(""),
        idempotencyKey: `new-signup/${userId}`
    });
};
