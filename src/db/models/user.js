const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // unique id provided by the db
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!value)
                throw new Error('Name must not be empty.');
        }
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    creationTime: {
        type: Date,
        required: true
    },
    admin: {
        type: Boolean,
        required: true
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User