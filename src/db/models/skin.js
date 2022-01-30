const mongoose = require('mongoose');

const skinSchema = new mongoose.Schema({
    // unique id provided by the db
    name: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!value)
                throw new Error('Name must not be empty.');
        }
    },
    thumbnail: {
        type: String,
        required: true
    },
    skin: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priceUsd: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    }
});

const Skin = mongoose.model('Skin', skinSchema);

module.exports.Skin = Skin