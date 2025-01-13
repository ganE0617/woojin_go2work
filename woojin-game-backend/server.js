const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/woojin-game", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

const playerSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true },
  highScore: { type: Number, default: 0 }
});

const Player = mongoose.model("Player", playerSchema);

app.post("/api/players", async (req, res) => {
  try {
    const { nickname } = req.body;
    const player = new Player({ nickname });
    await player.save();
    res.status(201).json(player);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: '이미 사용 중인 닉네임입니다.' });
    } else {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
});

app.post("/api/scores", async (req, res) => {
  try {
    const { nickname, score } = req.body;
    const player = await Player.findOne({ nickname });
    if (score > player.highScore) {
      player.highScore = score;
      await player.save();
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const players = await Player.find()
      .sort({ highScore: -1 })
      .limit(10);
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
