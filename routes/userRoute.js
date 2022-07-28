//imports
const router = require("express").Router()
const jwt = require("jsonwebtoken")
const CryptoJS = require("crypto-js");
const User = require("../models/User")
const verify = require("../verifyToken")



//GET
//home route
router.get("/", (req, res) => {
    res.render("index")
})

//login Route
router.get("/login", (req, res) => {
    res.render("login")
})

//register get ROute
router.get("/register", (req, res) => {
    res.render("register")
})

//POST
//login post route
router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email })

        if (user == null) {
            return res.status(404).json("No user Found!")
        }

        const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
        const originalPassword = bytes.toString(CryptoJS.enc.Utf8);

        // originalPassword !== req.body.password && res.status(401).json("wrong Password or Email")
        if (originalPassword !== req.body.password) {
            return res.status(401).json("wrong password or email")
        }

        const accessToken = jwt.sign({
            id: user._id
        }, process.env.SECRET_KEY)

        const { password, ...info } = user._doc;
        res.status(200).json({ ...info, accessToken, password })

    } catch (err) {
        res.status(500).json(err)
    }

})


//register post route
router.post("/register", async (req, res) => {
    try {

        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: CryptoJS.AES.encrypt(
                req.body.password,
                process.env.SECRET_KEY
            ).toString()

        })
        res.status(201).json(newUser)

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json("something already exist")
        }
        res.status(500).json("User not created")
    }
})






// router.post("/register", async (req, res) => {

//     const { name, email, password: plainTextPassword } = req.body;
//     const password = await bcrypt.hash(plainTextPassword, 10)

//     if (!plainTextPassword || typeof plainTextPassword !== "string") {
//         return res.json({ status: "error", error: "Invalid Password" })
//     }
//     if (plainTextPassword.length < 5) {
//         return res.json({ status: "error", error: "Password should be 6 characters" })
//     }

//     try {
//         const newUser = await User.create({
//             name,
//             email,
//             password
//         })
//         res.status(201).json(newUser)

//     } catch (err) {

//         if (err.code === 11000) {
//             return res.json({ status: "error", error: "email already exists" })
//         }
//         throw err

//     }

// })



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