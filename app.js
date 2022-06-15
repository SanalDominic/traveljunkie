let createError = require("http-errors");
let express = require("express");

const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("req-flash");
const hbs = require("hbs");
require("dotenv").config();

hbs.registerHelper("dateFormat", require("handlebars-dateformat"));

let path = require("path");
let cookieParser = require("cookie-parser");
let logger = require("morgan");

mongoose
  .connect(process.env.DATABASE)
  .then((res) => console.log("mongo is connected"))
  .catch((err) => {
    console.log("no db connection");
  });

let indexRouter = require("./routes/index");
let authorsRouter = require("./routes/author");
let blogsRouter = require("./routes/blogs");
let adminRouter = require("./routes/admin");

let app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

hbs.registerPartials(__dirname + "/views/partials");
app.use(logger("dev"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "what",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

app.use("/", indexRouter);
app.use("/author", authorsRouter);
app.use("/blogs", blogsRouter);
app.use("/admin", adminRouter);

app.get("*", function (req, res) {
  res.render("customerr", { footer: true });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
