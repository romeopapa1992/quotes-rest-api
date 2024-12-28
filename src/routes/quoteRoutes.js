import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import db from "../db.js";

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  const { content, source } = req.body;

  if (!content || !source) {
    return res.status(400).json({ message: "Both text and source are required!" });
  }

  const userId = req.user.id;

  try {
    const result = await db.query(
      "INSERT INTO quotes (source, content, user_id) VALUES ($1, $2, $3) RETURNING *",
      [source, content, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating quote:", err);
    res.status(500).json({ message: "Error creating quote" });
  }
});

router.get("/", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query("SELECT * FROM quotes WHERE user_id = $1", [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching quotes:", err);
    res.status(500).json({ message: "Error fetching quotes" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  const quoteId = req.params.id;
  const { source, content } = req.body;
  const userId = req.user.id;

  try {
    const result = await db.query(
      "UPDATE quotes SET source = $1, content = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
      [source, content, quoteId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating quote:", err);
    res.status(500).json({ message: "Error updating quote" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  const quoteId = req.params.id;
  const userId = req.user.id;

  try {
    const result = await db.query(
      "DELETE FROM quotes WHERE id = $1 AND user_id = $2 RETURNING *",
      [quoteId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.status(204).end();
  } catch (err) {
    console.error("Error deleting quote:", err);
    res.status(500).json({ message: "Error deleting quote" });
  }
});

export default router;

