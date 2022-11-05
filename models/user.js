const mongoose = require("mongoose");
const user = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  likedBuilds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builds"
    }
  ],
  verification: {
    verified: {type: Boolean, default: false},
    date: {type: String, default: new Date().toLocaleDateString()}
  }
});

module.exports = mongoose.model("User", user);
