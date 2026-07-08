type SendEmailInput = {
    html: string;
    subject: string;
    text: string;
    to: string;
};

type ResendEmailPayload = {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text: string;
};

export const sendEmail = async (input: SendEmailInput): Promise<boolean> => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
        console.warn(
            "Email was not sent because RESEND_API_KEY or EMAIL_FROM is missing."
        );
        return false;
    }

    const payload: ResendEmailPayload = {
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text
    };

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.warn(`Email provider returned ${response.status}.`);
            return false;
        }

        return true;
    } catch (error) {
        console.warn("Email provider request failed.", error);
        return false;
    }
};
