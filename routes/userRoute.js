//imports
const router = require("express").Router()
const User = require("../models/User")

//routes

//home route
router.get("/", (req, res) => {
    res.render("index")
})

//login Route
router.get("/login", (req, res) => {
    res.render("login")
})

//login post route
router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email, password: req.body.password })
        if (!user) {
            res.status(401).json("user not found")
        } else {

            res.status(201).json("succesfully login")
        }
    } catch (err) {
        res.status(500).json(err)
    }

})

//register get ROute
router.get("/register", (req, res) => {
    res.render("register")
})

//register post route
router.post("/register", async (req, res) => {

    const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    })

    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser)
    } catch (err) {
        res.status(401).json(err)
    }
})

module.exports = router;