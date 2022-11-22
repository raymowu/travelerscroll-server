const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Builds = require("../models/Builds");
const Comments = require("../models/Comment");
const User = require("../models/user");

const jwtsecret = "secretmsghere";


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

const Authenticate = async (res, token) => {
  if(!token){
    return res.send({status: "err", message: "Not logged in"})
  }
  else{
      await jwt.verify(token, jwtsecret, async (err, user) => {
        if (err) {
          return res.send({status: "err", message: err})
        } else {
          const ret = await User.findById(user.id);
          if (!ret) {
            res.send({status: "err", message: "No user found"})
          }
        }
    });
  }
}

router.post("/", async (req, res) => {
  const {
    token,
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
  await Authenticate(res, token)
  const user = await getUsername(token);

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
        return res.send({ status: "ok", build: build, userId: "none" });
      }
    }
  });
});

router.post("/build/:id/liked", async (req, res) => {
  const { liked, token } = req.body; // the action of liking the build.
  await Authenticate(res, token)
  const userid = await getUsername(token);
  
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
      return res.send({ status: "ok", build: build });
    } else {
      build.likedUsers.splice(build.likedUsers.indexOf(user._id), 1);
      user.likedBuilds.splice(user.likedBuilds.indexOf(build._id), 1);
      build.likes--;
      await build.save();
      await user.save();
      return res.send({ status: "ok", build: build });
    }
  }
});

// comment stuff
router.post("/build/:id/newComment", async (req, res) => {
  const { text, token } = req.body;
  await Authenticate(res, token)
  const user = await getUsername(token);
  if(!user) return res.send({status: "err", message: "not signed in"})
  
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

router.post("/build/:id/delete", async (req, res) => {
  const { token } = req.body;
  await Authenticate(res, token)
  const userInfo = await getUsername(token);
  let build = await Builds.findById(req.params.id);
  let user = await User.findById(userInfo.id)
  // return res.send({status: "ok", user: user._id, build: build.Author.id})
  if (build && user) {
    if(!user._id.equals(build.Author.id)) return res.send({status: "err", message: "Can not delete build you didnt create"})
    await Comments.deleteMany({ _id: { $in: build.comments } });
    for (i of build.likedUsers) {
      let user = await User.findById(i);
      if (user) {
        user.likedBuilds.splice(user.likedBuilds.indexOf(build._id), 1);
        await user.save();
      }
    }
    await Builds.findByIdAndDelete(req.params.id);
    return res.send({ status: "ok", user: user.username });
  }
  return res.send({status: "err", message: "unabe to find user or build"})
  
  
});




module.exports = router;
