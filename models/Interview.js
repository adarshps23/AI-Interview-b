const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  role: String,
  difficulty: String,
  questions: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Interview", interviewSchema);