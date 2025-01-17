import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();
const saltRounds = 10;

router.post("/register", async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }
  
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }
  
    try {
      const existingUser = await db.query("SELECT * FROM users WHERE email = $1", [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          message: "Email is already registered.",
        });
      }
  
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const result = await db.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
        [email, hashedPassword]
      );
  
      res.status(201).json({
        message: "User registered successfully",
        user: result.rows[0],
      });
    } catch (err) {
      console.error("Error registering user:", err);
      res.status(500).json({ message: "Error registering user" });
    }
  });
  

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET, {
      expiresIn: "7d",
    });

    await db.query("INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)", [user.id, refreshToken]);

    res.status(200).json({ message: "Login successful", accessToken, refreshToken });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ message: "Error logging in" });
  }
});

router.get("/verify", (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
  
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }
  
    jwt.verify(token, process.env.SESSION_SECRET, (err) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      res.status(200).json({ message: "Token is valid" });
    });
  });

export default router;

