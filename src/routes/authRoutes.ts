import { Router } from "express";

import {
    changePasswordController,
    forgotPasswordController,
    loginController,
    logoutController,
    refreshController,
    resendVerificationController,
    resetPasswordController,
    signupController,
    verifyEmailController
} from "../controllers/authControllers.js";
import { requireAuth } from "../middleware/authMiddleware.js";

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: session
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "665f1f4e91a5b6a4d1c8b123"
 *         name:
 *           type: string
 *           example: "Dimitrios"
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2026-01-01T10:00:00.000Z"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: "#/components/schemas/User"
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         sessionExpiresAt:
 *           type: string
 *           format: date-time
 *           example: "2026-01-01T10:10:00.000Z"
 */

const router = Router();

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Sign up a user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dimitrios"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthResponse"
 *       400:
 *         description: Invalid request body.
 *       409:
 *         description: Email already exists.
 */
router.post("/signup", signupController);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: User authenticated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthResponse"
 *       400:
 *         description: Invalid request body.
 *       401:
 *         description: Invalid credentials.
 */
router.post("/login", loginController);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Generic password reset request response.
 *       400:
 *         description: Invalid request body.
 */
router.post("/forgot-password", forgotPasswordController);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset a password with an emailed token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Invalid request body or reset token.
 */
router.post("/reset-password", resetPasswordController);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change the authenticated user's password
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed and sessions revoked.
 *       400:
 *         description: Invalid current or new password.
 *       401:
 *         description: Authentication required.
 */
router.post("/change-password", requireAuth, changePasswordController);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh the current session
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session refreshed successfully.
 *       401:
 *         description: Session cookie is missing, invalid, or expired.
 */
router.post("/refresh", refreshController);

router.post("/resend-verification", resendVerificationController);

router.post("/verify-email", verifyEmailController);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out the current session
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Session cleared successfully.
 */
router.post("/logout", logoutController);

export default router;
