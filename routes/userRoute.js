//imports
const router = require("express").Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const verify = require("../verifyToken")

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
            res.status(401).json("Wrong credentials!")
        } else {

            const accessToken = jwt.sign({
                id: user._id
            },
                "secretmessage",
                { expiresIn: "5d" }
            )

            const { ...info } = user._doc;

            res.status(201).json({ ...info, accessToken })
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

    const { name, email, password: plainTextPassword } = req.body;
    const password = await bcrypt.hash(plainTextPassword, 10)

    if (!plainTextPassword || typeof plainTextPassword !== "string") {
        return res.json({ status: "error", error: "Invalid Password" })
    }
    if (plainTextPassword.length < 5) {
        return res.json({ status: "error", error: "Password should be 6 characters" })
    }

    try {
        const newUser = await User.create({
            name,
            email,
            password
        })
        console.log("user created successfully", newUser);

    } catch (err) {

        if (err.code === 11000) {
            return res.json({ status: "error", error: "email already exists" })
        }
        throw err

    }
    res.json({ status: "ok" })
})



// router.post("/register", async (req, res) => {

//     const newUser = new User({
//         name: req.body.name,
//         email: req.body.email,
//         password: req.body.password
//     })

//     try {
//         const savedUser = await newUser.save();
//         res.status(201).json(savedUser)
//     } catch (err) {
//         res.status(401).json(err)
//     }
// })



module.exports = router;