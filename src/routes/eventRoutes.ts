import { Router } from "express";

import { streamCallEventsController } from "../controllers/eventControllers.js";

const router = Router();

router.get("/calls", streamCallEventsController);

export default router;
