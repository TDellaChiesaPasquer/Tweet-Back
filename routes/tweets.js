var express = require("express");
var router = express.Router();
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
		data = await Tweet.find();
		res.json({ result: true, tweets: data });
	} catch (error) {
		console.log(error);
		res.json({
			result: false,
			error: "Server error.",
		});
	}
});

// POST /tweets/add
// Adds one tweet from one user
// Takes, in body
// user_token, text content of the tweet
router.post(
	"/add",
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
			User.findByIdAndUpdate(
				req.userId,
				{ $push: { tweetsOwned: savedTweet._id } }
			);

			res.json({ result: true });
		} catch (error) {
			console.log(error);
			res.json({
				result: false,
				error: "Server error.",
			});
		}
	}
);

module.exports = router;
