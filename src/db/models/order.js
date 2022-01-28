const mongoose = require('mongoose');
const { userSchema } = require('./user');
const { skinSchema } = require('./skin');

const orderSchema = mongoose.Schema({
    // unique id provided by the db
    user: userSchema,
    skins: [skinSchema],
    totalPrice: {
        type: Number,
        required: true
    }
    // possibly more fields...
});

const Order = mongoose.model('Order', orderSchema);

module.exports.Order = Order
module.exports.orderSchema = orderSchema