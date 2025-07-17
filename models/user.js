const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
	username: String,
	email: String,
	password: { type: String, select: false },
	creationDate: Date,
	tweetsOwned: { type: mongoose.Schema.Types.ObjectId, ref: "tweets" },
	tweetsLiked: { type: mongoose.Schema.Types.ObjectId, ref: "tweets" },
});

const User = mongoose.model("users", userSchema);

module.exports = User;
