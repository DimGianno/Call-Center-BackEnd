export type User = {
    id: string;
    name: string;
    email: string;
    email_verified_at: string | null;
    email_verification_required_at: string | null;
    email_verification_sent_at: string | null;
    created_at: string;
};

export type EmailVerificationStatus = {
    verified: boolean;
    verifiedAt: string | null;
    requiredAt: string | null;
    gracePeriodExpired: boolean;
};

export type AuthResponse = {
    user: User;
    accessToken: string;
    emailVerification: EmailVerificationStatus;
    sessionExpiresAt: string;
};

export type AuthResult = AuthResponse & {
    sessionToken: string;
};

export type SessionResponse = {
    user: User;
    emailVerification: EmailVerificationStatus;
    sessionExpiresAt: string;
};

export type TutorialState = {
    version: number;
    hasSeenWelcome: boolean;
    completedAt: string | null;
    skippedAt: string | null;
    completedTopics: string[];
    newTopics: string[];
};

export type SignupInput = {
    name: string;
    email: string;
    password: string;
};

export type LoginInput = {
    email: string;
    password: string;
};
