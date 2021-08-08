const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    hotel_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    order_details: {
        type: Object,
        required: true
    }
});

module.exports = mongoose.model("Order", orderSchema);