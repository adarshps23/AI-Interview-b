const Interview = require("./models/Interview");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios"); // 🔥 NEW
require("dotenv").config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is connected!" });
});

// 🔥 UPDATED ROUTE WITH OPENROUTER
app.post("/generate", async (req, res) => {
  const { role, difficulty } = req.body;

  try {
    const prompt = `Generate 5 ${difficulty} level interview questions for a ${role}. Return only questions as a simple list.`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "user", content: prompt }
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.choices[0].message.content;

    // 🔥 Convert AI response into array
    const questions = text
      .split("\n")
      .map(q => q.replace(/^\d+[\).\s-]*/, "").trim())
      .filter(q => q !== "");

    // Save to DB
    const newInterview = new Interview({
      role,
      difficulty,
      questions,
    });

    await newInterview.save();

    res.json({ questions });

  } catch (error) {
    console.log("OPENROUTER ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// GET all interviews
app.get("/interviews", async (req, res) => {
  try {
    const data = await Interview.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// DELETE interview
app.delete("/interviews/:id", async (req, res) => {
  try {
    await Interview.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Delete failed" });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Server start
app.listen(5000, () => {
  console.log("Server running on port 5000");
});