require("dotenv").config()
//imports
const express = require("express");
const mongoose = require("mongoose")
const User = require("./models/User")

const app = express();
const userRoute = require("./routes/userRoute")
const flash = require("express-flash")
const session = require("express-session");

const passport = require("passport");
const methodeOverride = require("method-override")

const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcrypt");
const Book = require("./models/Book");
const { use } = require("passport");

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)



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


//STRIPE ITEMS
const storeItems = new Map([
    [1, { priceInCents: 50000, name: "Car / Bike Washing" }],
])


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

// MIDDLEWARE
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

function isLoggedOut(req, res, next) {
    if (!req.isAuthenticated()) return next();
    res.redirect('/');
}


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

//services stripe routes
app.get("/services", isLoggedIn, (req, res) => {
    res.render("services", { name: req.user.name })
})

app.post("/create-checkout-session", isLoggedIn, async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: req.body.items.map(item => {
                const storeItem = storeItems.get(item.id)
                return {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: storeItem.name,
                        },
                        unit_amount: storeItem.priceInCents,
                    },
                    quantity: item.quantity,
                }
            }),
            success_url: `${process.env.SERVER_URL}/book`,
            cancel_url: `${process.env.SERVER_URL}/`,
        })
        res.json({ url: session.url, session: session })


    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})



//BOOK ROUTE
app.get("/book", isLoggedIn, (req, res) => {
    res.render("book", { name: req.user.name, email: req.user.email })
})

// BOOK POST ROUTE
app.post("/book", isLoggedIn, async (req, res) => {
    try {
        User.findOne({ _id: req.user._id }).then((user) => {
            if (user) {
                Book.create({
                    number: req.body.number,
                    location: req.body.location,
                    vehicleNumber: req.body.vehicleNumber,
                    message: req.body.message,
                    vehicleType: req.body.vehicleType,
                    date: new Date().toISOString().slice(0, 10)
                }).then((newEvent) => {
                    user.bookings.push(newEvent)
                    user.save();

                    res.redirect("/")
                })
            }
        })
    } catch (err) {
        res.redirect("/")
    }
})

app.get("/bookings", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ _id: req.user._id })
    res.render("bookings", { name: req.user.name, bookings: user.bookings })
})

app.get("/admin", (req, res) => {
    res.render("admin")
})

//listen
const port = 4000;
app.listen(port, () => {
    console.log(`Backend connected on ${port}`);
})