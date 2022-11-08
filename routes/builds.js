const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Builds = require("../models/Builds");
const Comments = require("../models/Comment");
const user = require("../models/user");
const User = require("../models/user");
const Sessions = require("../models/Sessions");

const jwtsecret = "secretmsghere";

const getuser = async (req) => {
  let cookie = req.headers.cookie;
  if (cookie) {
    const values = cookie.split(";").reduce((res, item) => {
      const data = item.trim().split("=");
      return { ...res, [data[0]]: data[1] };
    }, {});
    if (values["token"] && values["token"] !== null) {
      return values.token;
    }
  }
  return false;
};

async function getUsername(token) {
  const ret = await jwt.verify(token, jwtsecret, async (err, user) => {
    if (err) {
      console.log(err);
      return null;
    } else {
      const ret = await User.findById(user.id);
      if (ret) {
        return { id: ret.id, username: ret.username };
      }
    }
  });
  return ret;
}

const Authenticate = async (req, res, next) => {
  const token = await getuser(req);
  if (!token) {
    res.send({ status: "err", message: "Login Required", headers: req.headers });
  } else {
    next();
  }
  return res.send({ status: "err", headers: req.headers });
};

router.post("/", Authenticate, async (req, res) => {
  const token = await getuser(req);
  const user = await getUsername(token);
  const {
    title,
    description,
    character,
    weapons,
    weapons_replacement,
    artifacts,
    artifact_sands_stat,
    artifact_goblet_stat,
    artifact_circlet_stat,
    artifact_substats,
    teams,
  } = req.body;

  Builds.create(
    {
      title,
      description,
      character,
      Author: user,
      weapons,
      weapons_replacement,
      artifacts,
      artifact_sands_stat,
      artifact_goblet_stat,
      artifact_circlet_stat,
      artifact_substats,
      teams,
    },
    (err, build) => {
      if (err) {
        console.log(err);
        return res.send({ status: "err", err: err });
      } else {
        if (build) {
          return res.send({ status: "ok" });
        }
      }
    }
  );
});

router.get("/:character", (req, res) => {
  Builds.find({ character: req.params.character }, async (err, builds) => {
    if (err) {
      return res.send({ status: "err", err: err });
    } else {
      if (builds) {
        return res.send({ status: "ok", builds: builds });
      }
    }
  });
});

router.get("/build/:id", async (req, res) => {
  Builds.findById(req.params.id, async (err, build) => {
    if (err) {
      return res.send({ status: "err", err: err });
    } else {
      if (build) {
        await build.populate("comments");
        let liked = false;
        if (req.session.user) {
          let user = await User.findById(req.session.user.id);

          let userID;
          userID = req.session.user.id;
          return res.send({ status: "ok", build: build, userId: userID });
        }
        return res.send({ status: "ok", build: build, userId: "none" });
      }
    }
  });
});

router.post("/build/:id/liked", Authenticate, async (req, res) => {
  const token = await getuser(req);
  const userid = await getUsername(token);
  const { liked } = req.body; // the action of liking the build.
  const build = await Builds.findById(req.params.id);
  const user = await User.findById(userid.id);
  if (build) {
    await build.populate("comments");
    if (liked && !build.likedUsers.includes(user)) {
      build.likedUsers.push(user._id);
      user.likedBuilds.push(build._id);
      build.likes++;
      await build.save();
      await user.save();
      // await Builds.findByIdAndUpdate(build._id, { likes: build.likes + 1 });
      return res.send({ status: "ok", build: build });
    } else {
      // if(user.likedBuilds.includes(build._id)){
      build.likedUsers.splice(build.likedUsers.indexOf(user._id), 1);
      user.likedBuilds.splice(user.likedBuilds.indexOf(build._id), 1);
      build.likes--;
      await build.save();
      await user.save();

      // await Builds.findByIdAndUpdate(build._id, { likes: likes });
      return res.send({ status: "ok", build: build });
      // }
      // else{
      //   return res.send({status: "err", message: "Can't dislike a build you havent liked"});
      // }
    }
  }
});

// comment stuff
router.post("/build/:id/newComment", Authenticate, async (req, res) => {
  const token = await getuser(req);
  const user = await getUsername(token);
  const { text } = req.body;
  Comments.create(
    {
      text,
      Author: user,
    },
    async (err, comment) => {
      if (err) {
        console.log(err);
        return res.send({ status: "err", err: err });
      } else {
        if (comment) {
          const build = await Builds.findById(req.params.id);
          if (build) {
            build.comments.push(comment);
            await build.populate("comments");
            build.save();
            return res.send({ status: "ok", build: build });
          }
        } else {
          res.send({ status: "err", err: "idek" });
        }
      }
    }
  );
});

router.post("/build/:id/delete", Authenticate, async (req, res) => {
  const token = await getuser(req);
  const user = await getUsername(token);
  let build = await Builds.findById(req.params.id);
  if (build) {
    await Comments.deleteMany({ _id: { $in: build.comments } });
    for (i of build.likedUsers) {
      let user = await User.findById(i);
      if (user) {
        user.likedBuilds.splice(user.likedBuilds.indexOf(build._id), 1);
        await user.save();
      }
    }
  }
  await Builds.findByIdAndDelete(req.params.id);
  return res.send({ status: "ok", user: user.username });
});

module.exports = router;
