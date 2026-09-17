import express from "express"
import {Register , Login, Logout } from "../controllors/UserControllor.js"
const router = express.Router()

router.route("/register").post(Register);
router.route("/login").post(Login);
router.route("/logout").post(Logout);

export default router;