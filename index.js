//imports
const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const dotenv = require("dotenv").config()
const app = express();

const userRoute = require("./routes/userRoute")

// static files

app.use(express.static("public"))
app.use("/css", express.static(__dirname + "public/css"))
app.use("/js", express.static(__dirname + "public/js"))
app.use("/img", express.static(__dirname + "public/img"))
app.use("/scss", express.static(__dirname + "public/scss"))

//body parser setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//set View engine
app.set("views", "./views")
app.set("view engine", "ejs")

//Route
app.use("/", userRoute)

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