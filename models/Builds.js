const mongoose = require("mongoose");
const Builds = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "None" },
  character: { type: String, required: true },
  Author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: { type: String, required: true },
  },
  weapons: [],
  weapons_replacement: [],
  artifacts: [],
  artifact_sands_stat: "",
  artifact_goblet_stat: "",
  artifact_circlet_stat: "",
  artifact_substats: [],
  teams: [],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  likes: { type: Number, default: 0 },
  likedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  date: { type: String, default: new Date().toLocaleDateString() },
});

module.exports = mongoose.model("Builds", Builds);
