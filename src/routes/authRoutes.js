import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();
const saltRounds = 10;
const refreshTokens = [];

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );
    res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ message: "Error registering user" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

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

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET, {
      expiresIn: "7d",
    });

    refreshTokens.push(refreshToken);
    res.status(200).json({ message: "Login successful", accessToken: token, refreshToken });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ message: "Error logging in" });
  }
});

router.post("/refresh-token", (req, res) => {
  const { token } = req.body;

  if (!token || !refreshTokens.includes(token)) {
    return res.status(403).json({ message: "Refresh token is invalid" });
  }

  jwt.verify(token, process.env.SESSION_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET, {
      expiresIn: "1h",
    });

    res.json({ accessToken });
  });
});

export default router;

