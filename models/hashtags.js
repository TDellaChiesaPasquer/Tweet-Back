const mongoose = require('mongoose');

const hashtagSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    tweetList: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tweets',
        default: []
    }]
});

const Hashtag = mongoose.model('hashtags', hashtagSchema);

module.exports = Hashtag;