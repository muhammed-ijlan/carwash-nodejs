require("dotenv").config()
//imports
const express = require("express");
const mongoose = require("mongoose")
const User = require("./models/User")

const app = express();
const flash = require("express-flash")
const session = require("express-session");

const passport = require("passport");
const methodeOverride = require("method-override")

const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcrypt");
const Book = require("./models/Book");

const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");

// RAZORPAY

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})


app.post('/create/orderId', (req, res) => {
    var options = {
        amount: 50000,// amount in the smallest currency unit
        currency: "INR",
        receipt: "rcp11"
    }
    instance.orders.create(options, function (err, order) {
        res.json({ orderId: order.id })
    })
});

var successPayment = false;
app.post('/verification', ((req, res) => {
    successPayment = true;
    res.redirect("/book")
}))



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

// MIDDLEWARE
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

function isLoggedOut(req, res, next) {
    if (!req.isAuthenticated()) return next();
    res.redirect('/');
}

function isPaymentSuccess(req, res, next) {
    if (successPayment) {
        return next();
    }
    res.redirect("/services")
}



///////////////////////////////////////////////

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



//**  ROUTES
// !! USER ROUTES
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



// SERVICES
app.get("/services", isLoggedIn, (req, res) => {
    res.render("services", { name: req.user.name })
})


//!! BOOK ROUTES

app.get("/book", isLoggedIn, isPaymentSuccess, (req, res) => {
    res.render("book", { name: req.user.name, email: req.user.email })
})

// BOOK POST ROUTE
app.post("/book", isPaymentSuccess, isLoggedIn, async (req, res) => {
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

                    const output = `
                    <p>You Have a New Vehicle Wash Booking</p>
                    <h3>Contact Details</h3>
                    <ul>
                    <li>Name: ${req.body.name}</li>
                    <li>Email: ${req.body.email}</li>
                    <li>Phone Number: ${req.body.number}</li>
                    <li>location: ${req.body.location}</li>
                    <li>Vehicle Number: ${req.body.vehicleNumber}</li>
                    <li>Vehicle Type: ${req.body.vehicleType}</li>
                    </ul>
                    <h3>Message</h3>
                    <p>${req.body.message}</p>
                    `
                    let transporter = nodemailer.createTransport({
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        auth: {
                            user: process.env.EMAIL,
                            pass: process.env.EMAIL_PASS,
                        },
                        tls: {
                            rejectUnauthorized: false
                        }
                    });

                    let mailOptions = {
                        from: `"New Form "<${req.body.email}>`,
                        to: process.env.EMAIL,
                        subject: "New Booking Form submitted",
                        html: output,
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            return console.log(error);
                        }
                        console.log('Message sent: %s', info.messageId);
                    });

                    res.redirect("bookings")
                    successPayment = false;
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

// !! ADMIN ROUTES

app.get('/admin', function (req, res) {

});

//listen
const port = 4000;
app.listen(port, () => {
    console.log(`Backend connected on ${port}`);
})
