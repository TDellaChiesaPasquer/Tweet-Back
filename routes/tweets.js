var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const Tweet = require("../models/tweets");
const User = require("../models/users");
const Hashtag = require("../models/hashtags");
const { generateAccessToken, authenticateToken } = require("../modules/jwt");

// GET /tweets
// Returns all tweets
// TODO
// Ajouter des tweet, pour le moment renvoie un tableau vide, mais il n'y a aucun tweet -> tester avec des tweets
router.get("/", async (req, res) => {
	try {
		data = await Tweet.find().populate("creator").sort({ date: -1 });
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
			await User.findByIdAndUpdate(req.userId, {
				$push: { tweetsOwned: savedTweet._id },
			});
			let hashtagList = content.match(/#[a-z]+/gi);
			hashtagList = [...new Set(hashtagList)];
			for (const element of hashtagList) {
				const possibleHashtag = await Hashtag.findOne({
					title: element,
				});
				if (!possibleHashtag) {
					const newHashtag = new Hashtag({
						title: element,
						tweetList: [savedTweet._id],
					});
					newHashtag.save();
					continue;
				}
				await Hashtag.findByIdAndUpdate(possibleHashtag._id, {
					$push: { tweetList: savedTweet._id },
				});
			}
			// Renvoie true seulement si les 2 ajouts ont eu lieu.
			res.json({ result: true, tweet: savedTweet });
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
router.delete(
	"/",
	authenticateToken,
	body("tweetId").isString().trim().isLength({ min: 1, max: 50 }).escape(),
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res
					.status(400)
					.json({ result: false, error: errors.array() });
			}
			// Retire l'objectId du tweet au tableau de tweets des users
			const deletedTweet = await Tweet.findByIdAndDelete(
				req.body.tweetId
			);
			await User.findByIdAndUpdate(req.userId, {
				$pull: { tweetsOwned: req.body.tweetId },
			});
			let hashtagList = deletedTweet.content.match(/#[a-z]+/gi);
			hashtagList = [...new Set(hashtagList)];
			for (const element of hashtagList) {
				const possibleHashtag = await Hashtag.findOne({
					title: element,
				});
				if (!possibleHashtag) {
					continue;
				}
				if (possibleHashtag.length === 1) {
					await Hashtag.findByIdAndDelete(possibleHashtag._id);
					continue;
				}
				await Hashtag.findByIdAndUpdate(possibleHashtag._id, {
					$pull: { tweetList: deletedTweet._id },
				});
			}
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

router.get("/trends", async (req, res, next) => {
	try {
		const hashtagList = await Hashtag.find();
		res.json({
			result: true,
			hashtagList: hashtagList
				.map((e) => {
					return { title: e.title, number: e.tweetList.length };
				})
				.sort((a, b) => b.number - a.number),
		});
	} catch (error) {
		console.log(error);
		res.json({ result: false, error: "Server error" });
	}
});

router.put(
	"/like",
	authenticateToken,
	body("tweetId").isString().trim().isLength({ min: 1, max: 50 }).escape(),
	body("liking")
		.isBoolean()
		.customSanitizer((value) => value === "true" || value === true),
	async (req, res, next) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res
					.status(400)
					.json({ result: false, error: errors.array() });
			}
			const user = await User.findById(req.userId);
			const possibleTweet = await Tweet.findById(req.body.tweetId);
			if (!possibleTweet) {
				return res.json({ result: false, error: "Tweet not found" });
			}
			if (req.body.liking) {
				if (
					possibleTweet.likes.some(
						(e) => e.toString() === req.userId.toString()
					)
				) {
					return res.json({ result: true, message: "Already liked" });
				}
				await Tweet.findByIdAndUpdate(req.body.tweetId, {
					$push: { likes: req.userId },
				});
				await User.findByIdAndUpdate(req.userId, {
					$push: { tweetsLiked: req.body.tweetId },
				});
				return res.json({ result: true });
			}
			if (
				!possibleTweet.likes.some(
					(e) => e.toString() === req.userId.toString()
				)
			) {
				return res.json({ result: true, message: "Already not liked" });
			}
			await Tweet.findByIdAndUpdate(req.body.tweetId, {
				$pull: { likes: req.userId },
			});
			await User.findByIdAndUpdate(req.userId, {
				$pull: { tweetsLiked: req.body.tweetId },
			});
			res.json({ result: true });
		} catch (error) {
			console.log(error);
			res.json({ result: false, error: "Server error" });
		}
	}
);

module.exports = router;
