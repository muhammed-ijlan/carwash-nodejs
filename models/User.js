const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, uneque: true },
    password: { type: String, required: true },
    number: { type: String, required: true },
    location: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    message: { type: String }



}, {
    collection: "users"
})

module.exports = mongoose.model("User", UserSchema)