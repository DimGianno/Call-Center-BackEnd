import { Router } from "express";
import {
    getAllCallsController,
    getCallByIdController,
    archiveCallController,
    unarchiveCallController,
    addNoteToCallController,
    deleteCallController,
    archiveAllCallsController,
    unarchiveAllCallsController,
} from "../controllers/callControllers.js"

const router = Router();

router.get("/", getAllCallsController);

router.patch("/archive-all", archiveAllCallsController);
router.patch("/unarchive-all", unarchiveAllCallsController);

router.get("/:callId", getCallByIdController);

router.patch("/:callId/archive", archiveCallController);

router.patch("/:callId/unarchive", unarchiveCallController);

router.post("/:callId/notes", addNoteToCallController);

router.delete("/:callId", deleteCallController)

export default router;