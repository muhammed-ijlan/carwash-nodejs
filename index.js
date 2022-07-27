//imports
const express = require("express")
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


app.get("/", (req, res) => {
    res.render("index")
})


//listen
const port = 4000;
app.listen(port, () => {
    console.log(`Backend connected on ${port}`);
})