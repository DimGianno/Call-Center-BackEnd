import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_LENGTH = 16;

const derivePasswordHash = async (
    password: string,
    salt: string
): Promise<Buffer> => {
    const derivedKey = (await scrypt(
        password,
        salt,
        PASSWORD_KEY_LENGTH
    )) as Buffer;

    return derivedKey;
};

export const hashPassword = async (
    password: string
): Promise<{ password_hash: string; password_salt: string }> => {
    const password_salt = randomBytes(PASSWORD_SALT_LENGTH).toString("hex");
    const passwordHash = await derivePasswordHash(password, password_salt);

    return {
        password_hash: passwordHash.toString("hex"),
        password_salt
    };
};

export const verifyPassword = async (
    password: string,
    passwordHash: string,
    passwordSalt: string
): Promise<boolean> => {
    const storedHash = Buffer.from(passwordHash, "hex");
    const submittedHash = await derivePasswordHash(password, passwordSalt);

    if (storedHash.length !== submittedHash.length) {
        return false;
    }

    return timingSafeEqual(storedHash, submittedHash);
};
