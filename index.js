//imports
const express = require("express");
const mongoose = require("mongoose")
const dotenv = require("dotenv").config()
const User = require("./models/User")

const app = express();
const userRoute = require("./routes/userRoute")
const flash = require("express-flash")
const session = require("express-session");

const passport = require("passport");
const methodeOverride = require("method-override")

const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcrypt")


//set View engine
app.set("view engine", "ejs")

// static files
app.use(express.static("public"))
app.use("/css", express.static(__dirname + "public/css"))
app.use("/js", express.static(__dirname + "public/js"))
app.use("/img", express.static(__dirname + "public/img"))
app.use("/scss", express.static(__dirname + "public/scss"))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}))


app.use(methodeOverride("_method"))


// app.use("/", userRoute)

//mongoose connection
mongoose.connect(process.env.MONGO_URL_DEMO, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("DB connected"))
    .catch((err) => console.log(err))


// passport config
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

/////////////////USERROUTES/////////////

const authenticateUser = async (email, password, done) => {
    const user = await User.findOne({ email })
    if (user == null) {
        return done(null, false, { message: "No user with that email" })
    }
    try {
        if (await bcrypt.compare(password, user.password)) {
            return done(null, user)
        } else {
            return done(null, false, { message: "Password is incorrect" })
        }
    } catch (err) {
        return done(err)
    }
}

passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser))


// MIDDLEWARE
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

function isLoggedOut(req, res, next) {
    if (!req.isAuthenticated()) return next();
    res.redirect('/');
}

// ROUTES
app.get("/", isLoggedIn, (req, res) => {
    res.render("index", { name: req.user.name })
})

//login Route
app.get("/login", isLoggedOut, (req, res) => {
    const response = {
        title: "Login",
        error: req.query.error
    }
    res.render("login", response)
})

//register get ROute
app.get("/register", (req, res) => {
    res.render("register")
})

// LOGOUT
app.delete('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// POST
// register POST 
app.post("/register", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 2)
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        console.log("User created", newUser);
        res.redirect("/login")

    } catch (err) {
        res.redirect("/register")
    }
})

// LOgin POST route
app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login?error=true",
    failureFlash: true,
}))

app.get("/book", (req, res) => {
    res.render("services", { name: req.user.name, email: req.user.email })
})

//listen
const port = 4000;
app.listen(port, () => {
    console.log(`Backend connected on ${port}`);
})