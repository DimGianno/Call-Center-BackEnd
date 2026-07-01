export type User = {
    id: string;
    name: string;
    email: string;
    created_at: string;
};

export type AuthResponse = {
    user: User;
    accessToken: string;
    sessionExpiresAt: string;
};

export type AuthResult = AuthResponse & {
    sessionToken: string;
};

export type SessionResponse = {
    user: User;
    sessionExpiresAt: string;
};

export type TutorialState = {
    version: number;
    hasSeenWelcome: boolean;
    completedAt: string | null;
    skippedAt: string | null;
    completedTopics: string[];
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
