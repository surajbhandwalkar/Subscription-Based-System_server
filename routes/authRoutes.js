
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();


router.post("/register", async (req, res) => {
  const { email, password, startDate, duration } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const start = new Date(startDate);
  const end = new Date(start);
  duration === "monthly" ? end.setMonth(end.getMonth() + 1) : end.setFullYear(end.getFullYear() + 1);

  const newUser = new User({ email, password: hashedPassword, startDate: start, endDate: end });
  await newUser.save();

  res.json({ message: "Registered successfully" });
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});


router.get("/status", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(userId);
    const now = new Date();
    const status = now <= new Date(user.endDate) ? "Active" : "Expired";
    res.json({ status });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;
