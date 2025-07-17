var express = require("express");
var router = express.Router();
const { param, validationResult } = require("express-validator");
const Tweet = require("../models/tweets");
const User = require("../models/users");
const Hashtag = require('../models/hashtags');

router.get('/:title',
    param('title').isString().isLength({max: 280}).escape(),
    async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ result: false, error: errors.array() });
        }
        const possibleHashtag = await Hashtag.findOne({title: {$regex: new RegExp(req.params.title, 'i')}}).populate('tweetList').populate({path:'tweetList', populate: {path:'creator'}});
        if (!possibleHashtag) {
            return res.json({result: true, tweetList: []})
        }
        res.json({result: true, tweetList: possibleHashtag.tweetList});
    } catch(error) {
        console.log(error);
        res.json({result: false, error: 'Server error'})
    }
}) 

module.exports = router;