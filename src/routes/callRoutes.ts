import { Router } from "express";
import {
    getAllCallsController,
    getCallByIdController,
    archiveCallController,
    unarchiveCallController,
    addNoteToCallController,
    deleteCallController,
} from "../controllers/callControllers.js"

const router = Router();

router.get("/", getAllCallsController);

router.get("/:callId", getCallByIdController);

router.patch("/:callId/archive", archiveCallController);

router.patch("/:callId/unarchive", unarchiveCallController);

router.post("/:callId/notes", addNoteToCallController);

router.delete("/:callId", deleteCallController)

export default router;