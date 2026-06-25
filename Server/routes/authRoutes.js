import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  setNewPassword,
  ForgotPassword,
  verifyUser,
  resendVerification,
  generateToken
} from "../controllers/authController.js";
import passport from '../config/passport.js'
import jwt from 'jsonwebtoken' 
import { authLimiter } from "../middlewares/rateLimiter.js";
const router = express.Router();

router.post("/register",authLimiter, registerUser);

router.post("/login",authLimiter, loginUser);
router.post('/logout',logoutUser)

router.post('/forgot-password',authLimiter,ForgotPassword)
router.post('/reset-password',authLimiter,setNewPassword)

router.post('/verify',authLimiter,verifyUser)
router.post('/resend-verification',authLimiter, resendVerification);

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);


router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login',session:false }),
  (req, res) => {
    try{
      const user =req.user
      if(!user){
        return res.redirect(`${process.env.VITE_URL}/login?error=auth_failed`)
      }

      const token = generateToken(user)

    res.redirect(`${process.env.VITE_URL}/oauth-callback?token=${token}`)
    }
    catch{
      res.redirect(`${process.env.VITE_URL}/login?error=server_error`);
    }
 
  }
);

export default router;