var express = require('express');
const { authenticateToken, generateAccessToken } = require('../modules/jwt');
var router = express.Router();
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/users');


router.post('/signup', 
    body('username').isString().trim().isLength({min: 3, max: 32}).escape(),
    body('password').isString().isLength({min: 8, max: 32}).escape(),
    body('email').isEmail(),
    async (req, res, next)  => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({result: false, error: errors.array()});
            }
            let possibleUser = await User.findOne({email: req.body.email});     //Verifies if an account with the same email exists
            if (possibleUser) {
                return res.json({result: false, error: 'The email is already taken'});
            }
            possibleUser = await User.findOne({username: req.body.username});   //Verifies if an account with the same username exists
            if (possibleUser) {
                return res.json({result: false, error: 'The username is already taken'});
            }
            const secPassword = bcrypt.hashSync(req.body.password, 10);
            const newUser = new User({
                username: req.body.username,
                password: secPassword,
                email: req.body.email,
                creationDate: new Date(),
                tweetsOwned: [],
                tweetsLiked: []
            });
            const userSaved = await newUser.save();
            const token = generateAccessToken(userSaved._id);
            res.json({result: true, token});
        } catch(error) {
            console.log(error);
            res.status(500).json({result: false, error: 'Server error'});
        }
    }
)

router.post('/signin', 
    body('username').isString().trim().isLength({min: 3, max: 32}).escape(),
    body('password').isString().isLength({min: 8, max: 32}).escape(),
    async (req, res, next)  => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({result: false, error: errors.array()});
            }
            let possibleUser = await User.findOne({username: req.body.username}).select('password');  
            if (!possibleUser) {
                return res.json({result: false, error: 'The username or the password is wrong'});
            }
            const passwordCompare = bcrypt.compareSync(req.body.password, possibleUser.password);
            if (!passwordCompare) {
                return res.json({result: false, error: 'The username or the password is wrong'});
            }
            const token = generateAccessToken(possibleUser._id);
            res.json({result: true, token});
        } catch(error) {
            console.log(error);
            res.status(500).json({result: false, error: 'Server error'});
        }
    }
)

router.get('/info', authenticateToken,
    async (req, res, next) => {
        try {
            const possibleUser = await User.findById(req.userId);
            res.json({result: true, user: possibleUser});
        } catch(error) {
            console.log(error);
            res.status(500).json({result: false, error: 'Server error'});
        }
    }
)

module.exports = router;
