var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const Tweet = require("../models/tweets");
const User = require("../models/users");
const { generateAccessToken, authenticateToken } = require("../modules/jwt");

// GET /tweets
// Returns all tweets
// TODO
// Ajouter des tweet, pour le moment renvoie un tableau vide, mais il n'y a aucun tweet -> tester avec des tweets
router.get("/", async (req, res) => {
	try {
		data = await Tweet.find().populate("creator");
		res.json({ result: true, tweets: data });
	} catch (error) {
		console.log(error);
		res.json({
			result: false,
			error: "Server error.",
		});
	}
});

// POST /tweets
// Adds one tweet from one user
// Takes, in body
// user_token, text content of the tweet
router.post(
	"/",
	authenticateToken,
	body("content").isString().trim().isLength({ min: 1, max: 280 }).escape(),
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res
					.status(400)
					.json({ result: false, error: errors.array() });
			}
			const { content } = req.body;

			const tweet = new Tweet({
				creator: req.userId,
				content,
			});

			const savedTweet = await tweet.save();

			// Ajoute l'objectId du tweet au tableau de tweets des users
			const addedTweetUser = await User.findByIdAndUpdate(req.userId, {
				$push: { tweetsOwned: savedTweet._id },
			});

			// Renvoie true seulement si les 2 ajouts ont eu lieu.
			res.json({ result: true, tweet: savedTweet	});
		} catch (error) {
			console.log(error);
			res.json({
				result: false,
				error: "Server error.",
			});
		}
	}
);

// DELETE /tweets/
// Delets one tweet from one user
// Takes, in body
// user_token, tweet_id
router.delete("/", authenticateToken, async (req, res) => {
	try {
		// Retire l'objectId du tweet au tableau de tweets des users
		await Tweet.findByIdAndDelete(req.body.tweetId);
		await User.findByIdAndUpdate(req.userId, {
			$pull: { tweetsOwned: req.body.tweetId },
		});

		// Renvoie true seulement si les 2 suppressions ont eu lieu.
		res.json({ result: true });
	} catch (error) {
		console.log(error);
		res.json({
			result: false,
			error: "Server error.",
		});
	}
});

module.exports = router;
