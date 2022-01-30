const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = mongoose.Schema({
    // unique id provided by the db
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    skins: [{ type: Schema.Types.ObjectId, ref: 'Skin' }],
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports.Order = Order