const express = require("express");
const User = require("../models/user");
const { ObjectId } = require("mongodb");
const router = express.Router();

router.get("/", async (req, res) => {
  let adminSession = req.session.admin;
  if (!adminSession) {
    res.redirect("/");
    return;
  }
  let authorData = await User.find(
    { role: 2 },
    { name: 1, email: 1, status: 1 }
  );

  let blogData = await User.find(
    { role: 2, $unwind: "$blogs" },
    { name: 1, blogs: 1 }
  );

  let mostLiked = await User.aggregate([
    { $match: { role: 2 } },
    { $unwind: "$blogs" },
    {
      $group: {
        _id: {
          authId: "$_id",
          id: "$blogs._id",
          featured: "$blogs.featured",
          title: "$blogs.title",
        },
        interactions: { $push: "$blogs.interactions" },
      },
    },
    { $unwind: "$interactions" },
    { $unwind: "$interactions" },
    { $group: { _id: "$_id", likes: { $sum: "$interactions.like" } } },
    { $sort: { likes: -1 } },
  ]).limit(5);

  res.render("author/adminhome", {
    authorData: authorData,
    blogData: blogData,
    mostLiked: mostLiked,
    footer: true,
  });
});

router.get("/delete/:id", async (req, res) => {
  let id = req.params.id;
  let user = req.session.userDetails;
  try {
    await User.updateOne(
      { "blogs._id": id },
      { $set: { "blogs.$.delete": true } }
    );
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/setstatus", async (req, res) => {
  let authorId = req.body.authorID;
  let status = req.body.status;

  try {
    await User.updateOne(
      { _id: ObjectId(authorId) },
      {
        $set: {
          status: status,
          role: 1,
        },
      }
    );
    
  } catch (error) {
    console.log(error.message);
  }

});

router.post("/setfeatured", async (req, res) => {
  let { authorId, blogId, featured } = req.body;

  try {
    await User.updateOne(
      { _id: ObjectId(authorId), "blogs._id": blogId },
      {
        $set: {
          "blogs.$.featured": featured,
        },
      }
    );
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/setblogStatus", async (req, res) => {
  let { authorId, blogId, blogStatus } = req.body;
  try {
    await User.updateOne(
      { _id: ObjectId(authorId), "blogs._id": blogId },
      {
        $set: {
          "blogs.$.delete": blogStatus,
        },
      }
    );
  } catch (error) {
    console.log(error.message);
  }
});

router.get("/logout", (req, res) => {
  delete req.session.admin;
  res.redirect("/");
});

module.exports = router;
