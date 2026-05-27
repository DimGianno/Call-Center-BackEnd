import { Router } from "express";
import {
    getAllCallsController,
    getCallByIdController,
    archiveCallController,
} from "../controllers/callControllers.js"

const router = Router();

router.get("/", getAllCallsController);

router.get("/:callId", getCallByIdController);

router.patch("/:callId/archive", archiveCallController);

export default router;