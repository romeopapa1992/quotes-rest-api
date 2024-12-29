import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const { refreshToken } = req.body;
  
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
  
    try {
      const result = await db.query("SELECT * FROM refresh_tokens WHERE token = $1", [refreshToken]);
  
      if (result.rows.length === 0) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }
  
      const storedToken = result.rows[0];
  
      const tokenAge = new Date() - new Date(storedToken.created_at);
      const maxAge = 7 * 24 * 60 * 60 * 1000; 
      if (tokenAge > maxAge) {
        await db.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
        return res.status(403).json({ message: "Refresh token expired" });
      }
  
      jwt.verify(refreshToken, process.env.SESSION_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ message: "Invalid or expired refresh token" });
        }
  
        const accessToken = jwt.sign(
          { id: user.id, email: user.email },
          process.env.SESSION_SECRET,
          { expiresIn: "1h" }
        );
  
        res.json({ accessToken });
      });
    } catch (err) {
      console.error("Error handling refresh token:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const result = await db.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Refresh token not found" });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Error during logout:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
