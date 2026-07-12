import { UserDbModel } from "../db/models/userDbModel.js";
import type { ServiceResult } from "../models/serviceTypes.js";
import type { TutorialState } from "../models/userModel.js";

export const CURRENT_TUTORIAL_VERSION = 2;

const NEW_TOPICS_BY_VERSION: Record<number, string[]> = {
    2: ["call-item"]
};

type TutorialStateUpdate = Partial<TutorialState>;

const getDefaultTutorialState = (): TutorialState => {
    return {
        version: CURRENT_TUTORIAL_VERSION,
        hasSeenWelcome: false,
        completedAt: null,
        skippedAt: null,
        completedTopics: [],
        newTopics: []
    };
};

const getNewTopicsSince = (version: number): string[] => {
    return Object.entries(NEW_TOPICS_BY_VERSION)
        .filter(([releaseVersion]) => Number(releaseVersion) > version)
        .flatMap(([, topics]) => topics);
};

const mapTutorialState = (
    tutorial: TutorialState | undefined | null
): TutorialState => {
    const defaultState = getDefaultTutorialState();
    const version = tutorial?.version;

    const normalizedVersion =
        typeof version === "number" && Number.isInteger(version)
            ? version
            : defaultState.version;
    const storedNewTopics = Array.isArray(tutorial?.newTopics)
        ? tutorial.newTopics
        : [];

    return {
        version: normalizedVersion,
        hasSeenWelcome:
            typeof tutorial?.hasSeenWelcome === "boolean"
                ? tutorial.hasSeenWelcome
                : defaultState.hasSeenWelcome,
        completedAt:
            typeof tutorial?.completedAt === "string"
                ? tutorial.completedAt
                : null,
        skippedAt:
            typeof tutorial?.skippedAt === "string" ? tutorial.skippedAt : null,
        completedTopics: Array.isArray(tutorial?.completedTopics)
            ? tutorial.completedTopics
            : [],
        newTopics: Array.from(
            new Set([
                ...storedNewTopics,
                ...getNewTopicsSince(normalizedVersion)
            ])
        )
    };
};

export const getTutorialPreference = async (
    userId: string
): Promise<ServiceResult<TutorialState>> => {
    const user = await UserDbModel.findById(userId);

    if (!user) {
        return {
            success: false,
            statusCode: 404,
            error: "User not found"
        };
    }

    const tutorialState = mapTutorialState(user.tutorial);

    if (!user.tutorial) {
        user.tutorial = tutorialState;
        await user.save();
    }

    return {
        success: true,
        data: tutorialState
    };
};

export const updateTutorialPreference = async (
    userId: string,
    tutorialStateUpdate: TutorialStateUpdate
): Promise<ServiceResult<TutorialState>> => {
    const user = await UserDbModel.findById(userId);

    if (!user) {
        return {
            success: false,
            statusCode: 404,
            error: "User not found"
        };
    }

    const tutorialState = {
        ...mapTutorialState(user.tutorial),
        ...tutorialStateUpdate
    };

    user.tutorial = tutorialState;
    await user.save();

    return {
        success: true,
        data: tutorialState
    };
};
