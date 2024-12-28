import jwt from "jsonwebtoken";

export default function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("No token provided");
    return res.status(401).json({ message: "Unauthorized: No token" });
  }

  jwt.verify(token, process.env.SESSION_SECRET, (err, user) => {
    if (err) {
      console.error("Token verification failed:", err);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}
