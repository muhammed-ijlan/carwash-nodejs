const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
    number: String,
    location: String,
    vehicleNumber: String,
    message: String,
    vehicleType: String,
    date: String
}, {
    collection: "bookings"
})

module.exports = mongoose.model("Book", BookSchema)