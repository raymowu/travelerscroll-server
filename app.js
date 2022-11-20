const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

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

// has cors error on login VVVVVVVV
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

app.use(
  cors({
    origin: "https://travelerscroll.netlify.app", // <-- location of the react app were connecting to
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
const indexRoutes = require("./routes/index.js");
const buildRoutes = require("./routes/builds");
const { join } = require("path");

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
