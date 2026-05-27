import { Router } from "express";
import {
    getAllCallsController,
    getCallByIdController,
    archiveCallController,
    unarchiveCallController,
} from "../controllers/callControllers.js"

const router = Router();

router.get("/", getAllCallsController);

router.get("/:callId", getCallByIdController);

router.patch("/:callId/archive", archiveCallController);

router.patch("/:callId/unarchive", unarchiveCallController);


export default router;