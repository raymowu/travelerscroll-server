const express = require("express");
const router = express.Router();

const Builds = require("../models/Builds");
const Comments = require("../models/Comment");
const user = require("../models/user");
const User = require("../models/user");

const Authenticate = (req, res, next) => {
  if (!req.session.user) {
    res.send({ status: "err", message: "Login Required" });
  } else {
    next();
  }
};

router.post("/", Authenticate, async (req, res) => {
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
      Author: req.session.user,
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
  const { liked } = req.body; // the action of liking the build.
  const build = await Builds.findById(req.params.id);
  const user = await User.findById(req.session.user.id);
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
router.post("/build/:id/newComment", Authenticate, (req, res) => {
  const { text } = req.body;
  Comments.create(
    {
      text,
      Author: req.session.user,
    },
    async (err, comment) => {
      if (err) {
        console.log(err)
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
  let build = await Builds.findById(req.params.id);
  if(build){
    await Comments.deleteMany({_id: {$in: build.comments}})
    for(i of build.likedUsers){
      let user = await User.findById(i)
      if(user){
        user.likedBuilds.splice(user.likedBuilds.indexOf(build._id), 1);
        await user.save()
      }
      
    }
  }
  await Builds.findByIdAndDelete(req.params.id);
  return res.send({status: "ok", user: req.session.user.username});
});

module.exports = router;
