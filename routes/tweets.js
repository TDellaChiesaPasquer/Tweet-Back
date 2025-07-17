var express = require("express");
var router = express.Router();
const Tweet = require("../models/tweets");

// GET /tweet/tweets
// Returns all tweets
router.get('/tweets', (req, res) => {
	try {
		Tweet.find().then(data => {
			res.json({ result: true, tweets: data });
		});
	} catch (error) {
		res.json({ result: false, error });
	}
});

module.exports = router;
