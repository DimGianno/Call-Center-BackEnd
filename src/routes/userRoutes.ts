import { Router } from "express";

import {
    getTutorialPreferenceController,
    updateTutorialPreferenceController
} from "../controllers/userControllers.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     TutorialState:
 *       type: object
 *       properties:
 *         version:
 *           type: integer
 *           example: 1
 *         hasSeenWelcome:
 *           type: boolean
 *           example: false
 *         completedAt:
 *           type: string
 *           nullable: true
 *           format: date-time
 *           example: null
 *         skippedAt:
 *           type: string
 *           nullable: true
 *           format: date-time
 *           example: null
 *         completedTopics:
 *           type: array
 *           items:
 *             type: string
 *           example: []
 */

/**
 * @openapi
 * /users/me/tutorial:
 *   get:
 *     summary: Get the authenticated user's tutorial preference
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tutorial preference returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/TutorialState"
 *       401:
 *         description: Authentication is required.
 */
router.get("/me/tutorial", getTutorialPreferenceController);

/**
 * @openapi
 * /users/me/tutorial:
 *   patch:
 *     summary: Update the authenticated user's tutorial preference
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/TutorialState"
 *     responses:
 *       200:
 *         description: Tutorial preference updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/TutorialState"
 *       400:
 *         description: Invalid request body.
 *       401:
 *         description: Authentication is required.
 */
router.patch("/me/tutorial", updateTutorialPreferenceController);

export default router;
