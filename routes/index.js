const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const nodemailer = require("nodemailer");
const Builds = require("../models/Builds");
const User = require("../models/user");

const jwtsecret = "secretmsghere";

async function getUsername(res, token) {
  const ret = await jwt.verify(token, jwtsecret, async (err, user) => {
    if (err) {
      return res.send({status: "err", message: "Unable to verify user"})
    } else {
      const ret = await User.findById(user.id);
      if (ret) {
        return { id: ret.id, username: ret.username };
      }
      else{
        return res.send({status: "err", message: "User doesn't exist in our database"})
      }
    }
  });
  return ret;
}



function returndate(date) {
  let a = date.indexOf("/");
  return date.substr(a + 1, 2);
}

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "karthikapps70@gmail.com",
    pass: "AppPasswords",
  },
});

router.get("/", (req, res) => {
  res.send({ status: "ok" });
});

const SendEmail = (id, email) => {
  const url = `https://travelerscroll.herokuapp.com/confirmation/${id}`;

  transporter.sendMail(
    {
      to: email,
      subject: "Confirm Email",
      html: `Please click this email to confirm your email: <a href="${url}">${url}</a>`,
    },
    (error, result) => {
      if (error) {
        return console.log(error);
      }
    }
  );
};

const ReSendEmail = async (token, email) => {
  let user = await User.findById(id);
  user.verification.date = new Date().toLocaleDateString();
  await user.save();

  const url = `https://travelerscroll.herokuapp.com/confirmation/${token}`;

  transporter.sendMail(
    {
      to: email,
      subject: "Confirm Email",
      html: `Please click this email to confirm your email: <a href="${url}">${url}</a> 
        <br />
        This link is only valid for 2 days
      `,
    },
    (error, result) => {
      if (error) {
        return console.log(error);
      }
    }
  );
};

const MakeUsername = (email) => {
  const index = email.indexOf("@");
  const username = email.substr(0, index);
  return username;
};

router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  User.findOne({ username }, async (err, user) => {
    if (err) throw err;
    if (user) res.send({ status: "err", message: "User Already Exists" });
    if (!user) {
      const hashed = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        password: hashed,
        email,
      });
      await newUser.save();
      const info = { id: newUser._id, username: newUser.username };
      const token = jwt.sign(info, jwtsecret);
      SendEmail(token, newUser.email);
      res.send({ status: "ok", token: token });
    }
  });
});

router.post("/gregister", async (req, res) => {
  let { email, gid } = req.body;
  User.findOne({ email }, async (err, user) => {
    if (err) throw err;
    if (user) return res.send({ status: "err", message: "User already exists" });
    if (!user) {
      const username = MakeUsername(email);
      const hashed = await bcrypt.hash(gid, 10);
      console.log(hashed);
      const newUser = new User({
        username,
        password: hashed,
        email,
      });
      await newUser.save();
      newUser.verification.verified = true;
      await newUser.save();
      const info = { id: newUser._id, username: newUser.username };
      const token = jwt.sign(info, jwtsecret);
      return res.send({ status: "ok", token: token });
    }
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user) {
    const valid = await bcrypt.compare(password, user.password);
    if (valid) {
      const info = { id: user._id, username: user.username };
      const token = jwt.sign(info, jwtsecret);
      return res.send({ status: "ok", token: token });
    }
  }
  return res.send({ status: "err", msg: "Username or Password was incorrect" });
});

router.post("/glogin", async (req, res) => {
  let { email, gid } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const valid = await bcrypt.compare(gid, user.password);
    if (valid) {
      const info = { id: user._id, username: user.username };
      const token = jwt.sign(info, jwtsecret);
      return res.send({ status: "ok", token: token });
    }
  }
  return res.send({ status: "err", msg: "There was an error" });
});

router.get("/confirmation/:token", async (req, res) => {
  let userInfo = await getUsername(res, req.params.token);
  let user = await User.findById(userInfo.id);
  if (user) {
    let date = parseInt(returndate(user.verification.date));
    let currentDate = new Date().toLocaleDateString();
    let cur = parseInt(returndate(currentDate));
    if (date == cur || date + 2 == cur) {
      user.verification.verified = true;
      await user.save();
      return res.redirect("https://travelerscroll.herokuapp.com/login");
    } else {
      return res.send("Confirmation link expired");
    }
  } else {
    return res.send("there was an error");
  }
});

router.post("/resendConfirmation/:id", async (req, res) => {
  let user = await User.findById(req.params.id);
  if (user) {
    const info = { id: user._id, username: user.username };
    const token = jwt.sign(info, jwtsecret);
    ReSendEmail(token, user.email);
    return res.send("email sent");
  } else {
    return res.send({ status: "err", msg: "couldnt find user" });
  }
});

router.post("/forgotpassword", async (req, res) => {
  let user = await User.find({ email: req.body.email });
  user = user[0]; // email is unique so there is only 1 user anyway
  if (user && user.verification.verified) {
    const info = { id: user._id, username: user.username };
    const token = jwt.sign(info, jwtsecret);
    const url = `https://travelerscroll.herokuapp.com/forgotpassword/${token}`;

    user.verification.date = new Date().toLocaleDateString();
    await user.save();

    transporter.sendMail(
      {
        to: user.email,
        subject: "Reset password Email",
        html: `Please click this email to reset your password: <a href="${url}">${url}</a>
        <br />
        This link is only valid for 2 days.`,
      },
      (error, result) => {
        if (error) {
          return console.log(error);
        }
      }
    );
    return res.send({ status: "ok" });
  } else {
    if (!user.verification.verified) {
      return res.send({
        status: "err",
        msg: "Email is not verified. Please verify your email to continue",
      });
    } else {
      return res.send({ status: "err", msg: "Unable to find user with this email" });
    }
  }
});

router.get("/forgotpassword/:token", async (req, res) => {
  let userInfo = await getUsername(res, req.params.token);
  let user = await User.findById(userInfo.id);
  if (user) {
    let date = parseInt(returndate(user.verification.date));
    let currentDate = new Date().toLocaleDateString();
    let cur = parseInt(returndate(currentDate));
    if (date == cur || date + 1 == cur) {
      user.verification.verified = true;
      await user.save();
      return res.redirect(`https://travelerscroll.netlify.app/passwordreset/${user._id}`);
    } else {
      return res.send("Confirmation link expired");
    }
  }
});

router.post("/resetpassword/:id", async (req, res) => {
  let { password } = req.body;
  let user = await User.findById(req.params.id);
  if (user) {
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();
    return res.send({ status: "ok" });
  } else {
    return res.send({ status: "err", message: "invalid user" });
  }
});

router.get("/get-user/:token", async (req, res) => {
  if (!req.params.token) return res.send({ status: "ok" });
  const user = await getUsername(res, req.params.token);
  return res.send({ status: "ok", userId: user.id });
});

// logout rout
router.get("/logout", async (req, res) => {
  return res.send({ status: "ok" });
});

router.get("/profile/:id", async (req, res) => {
  User.findOne({ username: req.params.id }, async (err, user) => {
    if (err) {
      res.send({ status: "err", message: "There was an issue with" });
    }
    if (!user) {
      return res.send({ status: "err", message: "Unable to find user" });
    } else {
      user = await user.populate("likedBuilds");
      let createdBuilds = await Builds.find({
        Author: { id: user._id, username: user.username },
      });
      if (!createdBuilds) {
        return res.send({ status: "err", message: "Something went wrong" });
      } else {
        let retuser = {
          username: user.username,
          likedBuilds: user.likedBuilds,
          createdBuilds: createdBuilds,
        };
        return res.send({ status: "ok", user: retuser });
      }
    }
  });
});

module.exports = router;
