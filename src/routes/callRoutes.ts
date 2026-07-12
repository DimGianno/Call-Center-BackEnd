import { Router } from "express";
import {
    getAllCallsController,
    getCallByIdController,
    archiveCallController,
    unarchiveCallController,
    addNoteToCallController,
    deleteNoteFromCallController,
    deleteCallController,
    archiveAllCallsController,
    unarchiveAllCallsController,
    resetCallsController
} from "../controllers/callControllers.js";

/**
 * @openapi
 * components:
 *   parameters:
 *     CallId:
 *       in: path
 *       name: callId
 *       required: true
 *       schema:
 *         type: string
 *       description: MongoDB ObjectId of the call.
 *       example: "665f1f4e91a5b6a4d1c8b123"
 *   schemas:
 *     Note:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "665f1f4e91a5b6a4d1c8b456"
 *         content:
 *           type: string
 *           example: "Customer asked for a callback tomorrow"
 *
 *     Call:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "665f1f4e91a5b6a4d1c8b123"
 *         direction:
 *           type: string
 *           enum: [inbound, outbound]
 *           example: inbound
 *         from:
 *           type: string
 *           example: "+306900000001"
 *         to:
 *           type: string
 *           example: "+302310000001"
 *         call_type:
 *           type: string
 *           enum: [answered, missed, voicemail]
 *           example: answered
 *         duration:
 *           type: number
 *           example: 120
 *         is_archived:
 *           type: boolean
 *           example: false
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2026-01-01T10:00:00.000Z"
 *         notes:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/Note"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Call not found"
 */

const router = Router();

/**
 * @openapi
 * /calls:
 *   get:
 *     summary: Get calls
 *     description: Returns calls with optional filtering and pagination. By default, it returns active/unarchived calls.
 *     tags:
 *       - Calls
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_archived
 *         schema:
 *           type: boolean
 *         description: Filter calls by archived status.
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [inbound, outbound]
 *         description: Filter calls by direction.
 *       - in: query
 *         name: call_type
 *         schema:
 *           type: string
 *           enum: [answered, missed, voicemail]
 *         description: Filter calls by call type.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of calls per page.
 *     responses:
 *       200:
 *         description: List of calls returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calls:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Call"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Invalid query parameter.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/", getAllCallsController);

/**
 * @openapi
 * /calls/archive-all:
 *   patch:
 *     summary: Archive all active calls
 *     description: Archives all calls where is_archived is false.
 *     tags:
 *       - Calls
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All active calls archived successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All active calls archived successfully"
 *                 modifiedCount:
 *                   type: number
 *                   example: 3
 */
router.patch("/archive-all", archiveAllCallsController);

/**
 * @openapi
 * /calls/unarchive-all:
 *   patch:
 *     summary: Unarchive all archived calls
 *     description: Unarchives all calls where is_archived is true.
 *     tags:
 *       - Calls
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All archived calls unarchived successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All archived calls unarchived successfully"
 *                 modifiedCount:
 *                   type: number
 *                   example: 3
 */
router.patch("/unarchive-all", unarchiveAllCallsController);

/**
 * @openapi
 * /calls/reset:
 *   post:
 *     summary: Reset calls
 *     description: Deletes the authenticated user's calls and restores sample call data for that user.
 *     tags:
 *       - Calls
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calls reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Calls reset successfully"
 *                 deletedCount:
 *                   type: number
 *                   example: 4
 *                 insertedCount:
 *                   type: number
 *                   example: 150
 */
router.post("/reset", resetCallsController);

/**
 * @openapi
 * /calls/{callId}:
 *   get:
 *     summary: Get a single call
 *     description: Returns one call by ID, including its notes.
 *     tags:
 *       - Calls
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/CallId"
 *     responses:
 *       200:
 *         description: Call returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Call"
 *       400:
 *         description: Invalid call ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Call not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/:callId", getCallByIdController);

/**
 * @openapi
 * /calls/{callId}/archive:
 *   patch:
 *     summary: Archive a call
 *     description: Sets is_archived to true for a single call.
 *     tags:
 *       - Calls
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/CallId"
 *     responses:
 *       200:
 *         description: Call archived successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Call"
 *       400:
 *         description: Invalid call ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Call not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.patch("/:callId/archive", archiveCallController);

/**
 * @openapi
 * /calls/{callId}/unarchive:
 *   patch:
 *     summary: Unarchive a call
 *     description: Sets is_archived to false for a single call.
 *     tags:
 *       - Calls
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/CallId"
 *     responses:
 *       200:
 *         description: Call unarchived successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Call"
 *       400:
 *         description: Invalid call ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Call not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.patch("/:callId/unarchive", unarchiveCallController);

/**
 * @openapi
 * /calls/{callId}/notes:
 *   post:
 *     summary: Add a note to a call
 *     description: Adds a note to an existing call and returns the updated call.
 *     tags:
 *       - Calls
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/CallId"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Customer asked for a callback tomorrow"
 *     responses:
 *       201:
 *         description: Note added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Call"
 *       400:
 *         description: Invalid call ID format or invalid note content.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Call not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.post("/:callId/notes", addNoteToCallController);

/**
 * @openapi
 * /calls/{callId}/notes/{noteId}:
 *   delete:
 *     summary: Delete a note from a call
 *     description: Deletes one note and returns the updated call.
 *     tags:
 *       - Calls
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/CallId"
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the note.
 *     responses:
 *       200:
 *         description: Note deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Call"
 *       400:
 *         description: Invalid call or note ID format.
 *       404:
 *         description: Call or note not found.
 */
router.delete("/:callId/notes/:noteId", deleteNoteFromCallController);

/**
 * @openapi
 * /calls/{callId}:
 *   delete:
 *     summary: Delete a call
 *     description: Deletes a call by ID.
 *     tags:
 *       - Calls
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/CallId"
 *     responses:
 *       200:
 *         description: Call deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Call 665f1f4e91a5b6a4d1c8b123 deleted successfully"
 *       400:
 *         description: Invalid call ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Call not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.delete("/:callId", deleteCallController);

export default router;
