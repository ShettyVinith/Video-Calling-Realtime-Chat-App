import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMyFriends,
  getRecommendedUsers,
  sendFriendRequest,
} from "../controllers/user.controller.js";

const router = express.Router();

//apply authentication middleware to all routes
router.use(protectRoute);
router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);

router.post("/friend-request/:id", sendFriendRequest);

export default router;
