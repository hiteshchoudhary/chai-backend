import { Router } from "express";
import {checkout,paymentVerification}  from "../controllers/payment.controller.js";

const router = Router();

router.route("/checkout").post(checkout)
router.route("/paymentVerification").post(paymentVerification)

export default router