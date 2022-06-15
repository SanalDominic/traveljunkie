const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user");
const topTravelJunkies = require("../helpers/topTravelJunkies");

router.get("/", async (req, res) => {
  let session = req.session.user;
  let user = req.session.userDetails;

  try {
    let travelJnkies = await topTravelJunkies.topTravelJunkies();
    let blogData = await User.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$blogs" },
    ]);

    if (!session) {
      res.render("author/allblogs", {
        blogData: blogData,
        travelJnkies: travelJnkies,
      });
      return;
    }
    if (user.role === 1) {
      res.render("author/allblogs", {
        blogData: blogData,
        travelJnkies: travelJnkies,
        user: true,
      });
      return;
    }
    let blogDataAuthor = await User.aggregate([
      { $match: { _id: { $ne: mongoose.Types.ObjectId(user._id) } } },
      { $unwind: "$blogs" },
    ]);
    res.render("author/allblogs", {
      blogData: blogDataAuthor,
      travelJnkies: travelJnkies,
      author: true,
      profile: true,
    });
  } catch (error) {
    res.send("catch error")
  }
});

router.get("/category/:id", async (req, res) => {
  let session = req.session.user;
  let user = req.session.userDetails;
  try {
    const blogData = await User.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$blogs" },
      {
        $match: { "blogs.category": req.params.id },
      },
    ]);

    let travelJnkies = await topTravelJunkies.topTravelJunkies();

    if (!session) {
      res.render("author/categoryview", {
        blogData: blogData,
        travelJnkies: travelJnkies,
      });
      return;
    }
    if (user.role === 1) {
      res.render("author/categoryview", {
        blogData: blogData,
        travelJnkies: travelJnkies,
        user: true,
      });
      return;
    }
    let blogDataAuthor = await User.aggregate([
      { $match: { _id: { $ne: mongoose.Types.ObjectId(user._id) } } },
      { $unwind: "$blogs" },
      {
        $match: { "blogs.category": req.params.id },
      },
    ]);
    res.render("author/categoryview", {
      blogData: blogDataAuthor,
      travelJnkies: travelJnkies,
      author: true,
      profile: true,
    });
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/like", async (req, res) => {
  let { blogId } = req.body;
  let session = req.session.user;
  let user = req.session.userDetails;
  if (session) {
    let blog = await User.aggregate([
      { $unwind: "$blogs" },
      {
        $match: {
          "blogs._id": ObjectId(blogId),
          "blogs.interactions.user": user._id,
        },
      },
    ]);
    if (blog.length === 0) {
      await User.updateOne(
        { "blogs._id": ObjectId(blogId) },
        {
          $push: {
            "blogs.$.interactions": {
              like: 1,
              user: user._id,
            },
          },
        }
      );
      res.send(true);
      return;
    }

    await User.updateOne(
      { "blogs._id": ObjectId(blogId) },
      {
        $pull: {
          "blogs.$.interactions": {
            user: user._id,
          },
        },
      }
    );
    res.send(false);
  }
});

router.post("/favourites", async (req, res) => {
  let { blogId } = req.body;
  let user = req.session.userDetails;
  let session = req.session.user;
  if (session) {
    let isFavourite = await User.aggregate([
      { $match: { _id: ObjectId(user._id) } },
      { $unwind: "$favourites" },
      { $match: { "favourites.blogid": blogId } },
    ]);

    if (isFavourite.length === 0) {
      let fav = await User.updateOne(
        { _id: ObjectId(user._id) },
        {
          $push: {
            favourites: {
              blogid: blogId,
            },
          },
        }
      );
      res.send(true);
      return;
    }

    let fav = await User.updateOne(
      { _id: ObjectId(user._id) },
      {
        $pull: {
          favourites: {
            blogid: blogId,
          },
        },
      }
    );
    res.send(false);
  }
});

router.post("/search", async (req, res) => {
  let searchKey = req.body.searchKey;
  let data = await User.aggregate([
    {
      $match: { "blogs.title": { $regex: searchKey } },
    },
    {
      $project: {
        name: "$name",
        blogs: {
          $filter: {
            input: "$blogs",
            as: "blog",
            cond: {
              $regexMatch: {
                input: "$$blog.title",
                regex: searchKey,
              },
            },
          },
        },
      },
    },
  ]);
  res.json(data);
});

module.exports = router;
