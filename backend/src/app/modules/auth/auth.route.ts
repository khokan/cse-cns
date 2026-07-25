import { Router } from "express";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../types/auth.types";

const router = Router()

router.post("/register", AuthController.registerTrecHolder)
router.post("/login", AuthController.loginUser)
router.get("/me", checkAuth(UserRole.ADMIN, UserRole.ADMIN, UserRole.TRECHOLDER), AuthController.getMe)
router.post("/refresh-token", AuthController.getNewToken)
router.post("/change-password", checkAuth(UserRole.ADMIN, UserRole.TRECHOLDER), AuthController.changePassword)
router.post("/logout", checkAuth(UserRole.ADMIN, UserRole.TRECHOLDER), AuthController.logoutUser)
router.post("/forget-password", AuthController.forgetPassword)
router.post("/reset-password", AuthController.resetPassword)
router.post("/verify-email", AuthController.verifyEmail)

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError)

export const AuthRoutes = router;