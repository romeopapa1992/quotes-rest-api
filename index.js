import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["email", "profile"] })
  );
  
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login",
      session: false,
    }),
    (req, res) => {
      const token = jwt.sign({ id: req.user.id }, process.env.SESSION_SECRET, {
        expiresIn: "1h",
      });
      res.redirect(`http://localhost:5173?token=${token}`);
    }
  );  

function verifyToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.SESSION_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

app.post("/register", async (req, res) => {
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

app.post("/login", async (req, res) => {
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

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ message: "Error logging in" });
  }
});

app.post("/quotes", verifyToken, async (req, res) => {
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
  

app.get("/quotes", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query("SELECT * FROM quotes WHERE user_id = $1", [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching quotes:", err);
    res.status(500).json({ message: "Error fetching quotes" });
  }
});

app.put("/quotes/:id", verifyToken, async (req, res) => {
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

app.delete("/quotes/:id", verifyToken, async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
