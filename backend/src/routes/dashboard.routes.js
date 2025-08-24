import { Router } from 'express';
import {
    getChannelStats,
    adminDashboard,
} from "../controllers/dashboard.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { authorizeRoles } from '../middlewares/roleCheck.middleware.js';

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/stats", authorizeRoles("user", "admin")).get(getChannelStats);
router.route("/admin", authorizeRoles("admin")).get(adminDashboard);
export default router