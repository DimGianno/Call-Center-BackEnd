import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
    res.json({
        message: "Get all calls route works",
    });
});

router.get("/:callId", (req, res) => {
    res.json({
        message: "Get single call route works",
        callId: req.params.callId,
    });
});

router.patch("/:callId/archive", (req, res) => {
    res.json({
        message: "Archive call route works",
        callId: req.params.callId,
    });
});

export default router;