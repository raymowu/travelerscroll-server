const mongoose = require("mongoose");
const Comment = new mongoose.Schema({
  text: {type: String, required: true},
  Author: {
    id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    username: {type: String, required: true}
    }
});

module.exports = mongoose.model("Comment", Comment);
