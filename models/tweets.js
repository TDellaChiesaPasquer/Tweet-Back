const mongoose = require('mongoose');

const tweetSchema = mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users',
        default: []
    }],
    date: {
        type: Date,
        default: Date.now
    },
    responseTo: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tweets',
    },
    responses: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tweets',
        default: []
    }]
});

const Tweet = mongoose.model('tweets', tweetSchema);

module.exports = Tweet;