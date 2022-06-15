const express = require("express");
const mongoose = require("mongoose");
const store = require("../middleware/multer");
const fs = require("fs");
const User = require("../models/user");
const { ObjectId } = require("mongodb");
const router = express.Router();

router.get("/", async (req, res) => {
  let session = req.session.user;
  let user = req.session.userDetails;
  if (!session || user.role === 1) {
    res.redirect("/");
    return;
  }
  const authorBlogs = await User.findOne({ _id: user._id });
  let otherTravelJunkies = await User.find({
    _id: { $ne: mongoose.Types.ObjectId(user._id) },
    role: 2,
    status: "active",
  });
  res.render("author/authorview", {
    authorBlogs: authorBlogs,
    otherTravelJunkies: otherTravelJunkies,
    author: true,
    profile: false,
  });
});

router.get("/new", (req, res) => {
  let session = req.session.user;
  let user = req.session.userDetails;
  if (!session || user.role === 1) {
    res.redirect("/");
  }
  res.render("author/new", { author: true, profile: false });
});

router.post("/newpost", store.array("images", 2), (req, res) => {
  let user = req.session.userDetails;
  let session = req.session.user;

  if (!session || user.role === 1) {
    res.redirect("/");
    return;
  }
  const files = req.files;
  if (!files) {
    const error = new Error("please choose files");
  }
  // convert images into base64 encoding
  let imgArray = files.map((file) => {
    let img = fs.readFileSync(file.path);

    return (encode_image = img.toString("base64"));
  });
  imgArray.map((src, index) => {
    let newBlog = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      content: req.body.content,
      image: [
        {
          filename: files[index].originalname,
          contentType: files[index].mimetype,
          imageBase64: src,
        },
      ],
    };

    try {
      User.findByIdAndUpdate(
        user._id,
        {
          $push: {
            blogs: newBlog,
          },
        },
        {
          safe: true,
          upsert: true,
        },
        function (err, sql) {
          console.log(err);
        }
      );

      res.redirect("/author");
      return;
    } catch (error) {
      res.redirect("/new");
    }
  });
});

router.get("/post/:id", async (req, res) => {
  let id = req.params.id;
  let session = req.session.user;
  let user = req.session.userDetails;
  try {
    const post = await User.aggregate([
      { $unwind: "$blogs" },
      {
        $match: { "blogs._id": ObjectId(id) },
      },
      { $project: { blogs: 1 } },
    ]);

    let markdown = post[0].blogs;
    if (!session) {
      res.render("author/blogview", {
        post: post,
        markdown: markdown,
        show: true,
      });
      return;
    }
    let guest;
    await User.aggregate([
      { $unwind: "$blogs" },
      {
        $match: {
          "blogs._id": ObjectId(id),
          "blogs.interactions.user": user._id,
        },
      },
    ]).then((res) => {
      if (res == "") {
        guest = true;
      } else {
        guest = false;
      }
    });

    let fav;
    await User.aggregate([
      { $match: { _id: ObjectId(user._id) } },
      { $unwind: "$favourites" },
      { $match: { "favourites.blogid": id } },
    ]).then((res) => {
      if (res == "") {
        fav = true;
      } else {
        fav = false;
      }
    });

    if (user.role === 1) {
      res.render("author/blogview", {
        post: post,
        user: true,
        guest: guest,
        favourite: fav,
      });
    }
    res.render("author/blogview", {
      post: post,
      author: true,
      profile: false,
      guest: guest,
      favourite: fav,
    });
  } catch (error) {
    console.log(error.message);
  }
});

router.get("/edit/:id", async (req, res) => {
  id = req.params.id;
  let session = req.session.user;
  let user = req.session.userDetails;

  try {
    const editPost = await User.aggregate([
      { $unwind: "$blogs" },
      {
        $match: { "blogs._id": ObjectId(id) },
      },
      { $project: { blogs: 1, _id: 0 } },
    ]);

    if (!session || user.role === 1) {
      res.redirect("/");
      return;
    }
    res.render("author/editpost", {
      editPost: editPost,
      author: true,
      profile: false,
    });
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/editpost/:id", async (req, res) => {
  id = req.params.id;
  let user = req.session.userDetails;
  try {
    await User.updateOne(
      { _id: user._id, "blogs._id": id },
      {
        $set: {
          "blogs.$.title": req.body.title,
          "blogs.$.category": req.body.category,
          "blogs.$.description": req.body.description,
          "blogs.$.content": req.body.content,
        },
      }
    );
    res.redirect("/author");
  } catch (error) {
    console.log(error.message);
  }
});

router.get("/delete/:id", async (req, res) => {
  let id = req.params.id;
  let user = req.session.userDetails;
  try {
    await User.updateOne({ _id: user._id }, { $pull: { blogs: { _id: id } } });
    res.redirect("/author");
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
