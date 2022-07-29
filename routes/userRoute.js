//imports
const router = require("express").Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const User = require("../models/User")
const verify = require("../verifyToken")
const passport = require("passport")


const initializePassport = require("../passport-config")

initializePassport(passport,
    email => users.find(user => user.email == email),
    id => users.find(user => user.id === id)
)



const users = []

//GET
//home route
router.get("/", checkAuthenticated, (req, res) => {
    res.render("index")
})

//login Route
router.get("/login", checkNotAuthenticated, (req, res) => {
    res.render("login")
})

//register get ROute
router.get("/register", checkNotAuthenticated, (req, res) => {
    res.render("register")
})

//POST

//login post route
router.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,

}))


//register post route
router.post("/register", checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect("/login")

    } catch (err) {
        res.redirect("/register")
    }
    console.log(users);
})

// LOGOUT
router.delete('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

/////////////////////////////////////////////////////////////////////////////
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    return res.redirect("/login")
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/")
    }
    next();
}








//login
// router.post("/login", async (req, res) => {
//     try {
//         const user = await User.findOne({ email: req.body.email })

//         if (user == null) {
//             return res.status(404).json("No user Found!")
//         }

//         const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
//         const originalPassword = bytes.toString(CryptoJS.enc.Utf8);

//         // originalPassword !== req.body.password && res.status(401).json("wrong Password or Email")
//         if (originalPassword !== req.body.password) {
//             return res.status(401).json("wrong password or email")
//         }

//         const accessToken = jwt.sign({
//             id: user._id
//         }, process.env.SECRET_KEY)


//         const { password, ...info } = user._doc;
//         // console.log(user._doc);

//         return res.status(200).redirect("/")


//     } catch (err) {
//         return res.status(500).json(err)
//     }

// })

//register



// router.post("/register", async (req, res) => {
//     try {

//         const newUser = await User.create({
//             name: req.body.name,
//             email: req.body.email,
//             password: CryptoJS.AES.encrypt(
//                 req.body.password,
//                 process.env.SECRET_KEY
//             ).toString()

//         })
//         res.status(201).json(newUser)

//     } catch (err) {
//         if (err.code === 11000) {
//             return res.status(400).json("something already exist")
//         }
//         return res.status(500).json("User not created")
//     }
// })


module.exports = router;