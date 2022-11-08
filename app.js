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
  process.env.MONGODB_URI ||
    "mongodb+srv://rksp:rkspdbpass@cluster0.gkkn6.mongodb.net/GenshinApp?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
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

// app.use(
//   cors({
//     origin: "http://localhost:3000", // <-- location of the react app were connecting to/
//     credentials: true,
//   })
// );

const corsOptions = {
  origin: "https://travelerscroll.netlify.app",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://travelerscroll.netlify.app"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(cors(corsOptions));

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
    console.log("Server is running on");
  }
});
