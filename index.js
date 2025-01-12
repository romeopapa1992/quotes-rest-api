import express from "express";
import bodyParser from "body-parser";
import passport from "passport";
import session from "express-session";
import env from "dotenv";
import cors from "cors";

import authRoutes from "./src/routes/authRoutes.js";
import quoteRoutes from "./src/routes/quoteRoutes.js";
import refreshTokenRoutes from "./src/routes/refreshTokenRoutes.js";

env.config();

console.log("Session Secret:", typeof process.env.SESSION_SECRET, process.env.SESSION_SECRET);
console.log("PostgreSQL User:", typeof process.env.PG_USER, process.env.PG_USER);
console.log("PostgreSQL Password Type:", typeof process.env.PG_PASSWORD);
console.log("PostgreSQL Password:", process.env.PG_PASSWORD);

const app = express();
const port = 4000;

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({ origin: "http://localhost:4173", credentials: true }));

app.use("/auth", authRoutes);
app.use("/quotes", quoteRoutes);
app.use("/refresh-token", refreshTokenRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
