//imports
const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const dotenv = require("dotenv").config()
const app = express();
const User = require("./models/User")

// static files

app.use(express.static("public"))
app.use("/css", express.static(__dirname + "public/css"))
app.use("/js", express.static(__dirname + "public/js"))
app.use("/img", express.static(__dirname + "public/img"))
app.use("/scss", express.static(__dirname + "public/scss"))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//set View engine
app.set("views", "./views")
app.set("view engine", "ejs")


//routes
//home route
app.get("/", (req, res) => {
    res.render("index")
})

//login Route
app.get("/login", (req, res) => {
    res.render("login")
})

//login post
app.post("/login", async (req, res) => {
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

//register ROute
app.get("/register", (req, res) => {
    res.render("register")
})

app.post("/register", async (req, res) => {

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

//mongoose connection
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("DB connected"))
    .catch((err) => console.log(err))

//listen
const port = 4000;
app.listen(port, () => {
    console.log(`Backend connected on ${port}`);
})