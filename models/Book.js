const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, uneque: true },
    number: { type: String, required: true },
    location: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    message: { type: String },
    vehicleType: { type: String },
    date: String

}, {
    collection: "bookings"
})

module.exports = mongoose.model("Book", BookSchema)