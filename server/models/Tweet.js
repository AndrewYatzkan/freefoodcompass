const { mongoose } = require('../db');

const TweetSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    text: {
        type: String
    },
    start_timestamp: {
        type: Number
    },
    end_timestamp: {
        type: Number
    },
    location: {
        type: String
    },
    coordinates: {
        type: Object
    },
    food: {
        type: String
    },
    note: {
        type: String
    }
}, {timestamps: true});

module.exports = mongoose.model('Tweet', TweetSchema);
