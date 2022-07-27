//imports
const express = require("express")
const mongoose = require("mongoose")
const app = express();

// static files

app.use(express.static("public"))
app.use("/css", express.static(__dirname + "public/css"))
app.use("/js", express.static(__dirname + "public/js"))
app.use("/img", express.static(__dirname + "public/img"))
app.use("/scss", express.static(__dirname + "public/scss"))

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

//register ROute
app.get("/register", (req, res) => {
    res.render("register")
})

mongoose.connect()

//listen
const port = 4000;
app.listen(port, () => {
    console.log(`Backend connected on ${port}`);
})