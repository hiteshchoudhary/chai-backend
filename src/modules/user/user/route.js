import { Router } from "express"
import controller from "./controller";

const router = Router({ mergeParams: true });

router.post("/send-otp", controller.sendOtp);
router.post("/validate-otp", controller.validateOtp);


module.exports = router;