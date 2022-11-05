const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
var passport = require("passport");
const passportLocal = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
var MongoDBStore = require("connect-mongodb-session")(session);

// MODELS
const User = require("./models/user");

// DATABASE
mongoose.connect(
  "mongodb+srv://rksp:rkspdbpass@cluster0.gkkn6.mongodb.net/GenshinApp?retryWrites=true&w=majority"
);

// Session Store
const store = new MongoDBStore({
  uri: "mongodb+srv://rksp:rkspdbpass@cluster0.gkkn6.mongodb.net/GenshinApp?retryWrites=true&w=majority",
  collection: "Sessions",
  clear_interval: 3600,
});
// Catch errors
store.on("error", function (error) {
  console.log(error);
});

app.use(
  cors({
    origin: "https://travelerscroll.netlify.app", // <-- location of the react app were connecting to
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: "secrettexthere",
    cookie: { maxAge: 1000 * 60 * 60 * 48 },
    store: store,
    resave: false,
    saveUninitialized: false,
  })
);

const Authenticate = (req, res, next) => {
  if (!req.session.user) {
    res.send({ status: "err", message: "Login Required" });
  } else {
    next();
  }
};

// Routes
const indexRoutes = require("./routes/index.js");
const buildRoutes = require("./routes/builds");

app.use(indexRoutes);
app.use("/builds", buildRoutes);

app.get("/", (req, res) => {
  res.send("Hello world");
});

// process.env.PORT

app.listen(process.env.PORT, () => {
  {
    console.log("Server is running on port: 5000");
  }
});
