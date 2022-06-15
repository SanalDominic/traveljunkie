const express = require("express");
const mongoose = require("mongoose");
const store = require("../middleware/multer");
const fs = require("fs");
const router = express.Router();
const authenticate = require("../helpers/authenticate");
const topTravelJunkies = require("../helpers/topTravelJunkies");
const User = require("../models/user");
const { ObjectId } = require("mongodb");

router.get("/", async (req, res) => {
  let session = req.session.user;
  let user = req.session.userDetails;
  try {
    let blogData = await User.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$blogs" },
    ])
      .sort({ createdAt: 1 })
      .limit(4);

    let travelJnkies = await topTravelJunkies.topTravelJunkies();

    let featuredBlog = await User.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$blogs" },
      {
        $match: { "blogs.featured": true },
      },
    ]).limit(4);

    if (!session) {
      res.render("author/index", {
        blogData: blogData,
        featured: featuredBlog,
        travelJnkies: travelJnkies,
      });

      return;
    }
    if (user.role === 1) {
      res.render("author/index", {
        blogData: blogData,
        featured: featuredBlog,
        travelJnkies: travelJnkies,
        user: true,
      });
    }

    let blogDataAuthor = await User.aggregate([
      { $match: { _id: { $ne: mongoose.Types.ObjectId(user._id) } } },
      { $unwind: "$blogs" },
    ]).sort({ createdAt: 1 });

    let authorfeaturedBlog = await User.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$blogs" },
      {
        $match: {
          _id: { $ne: mongoose.Types.ObjectId(user._id) },
          "blogs.featured": true,
        },
      },
    ]).limit(4);

    res.render("author/index", {
      blogData: blogDataAuthor,
      featured: authorfeaturedBlog,
      travelJnkies: travelJnkies,
      author: true,
      profile: true,
    });
  } catch (error) {
    console.log("error", error);
  }
});

router.get("/signup", (req, res) => {
  let session = req.session.user;
  if (!session) {
    res.render("author/signup", { error: req.flash("error"), footer: true });
    return;
  }
  res.redirect("/");
});

router.post("/signup", async (req, res) => {
  let signupData = req.body;
  let signupResponse = await authenticate.signUp(signupData);
  if (signupResponse) {
    req.flash("error", "User Exists Try Again !");
    res.redirect("/signin");
    return;
  }
  req.flash("msg", req.body.name);
  res.redirect("/signin");
});

router.get("/signin", (req, res) => {
  let session = req.session.user;
  if (!session) {
    res.render("author/signin", {
      msg: req.flash("msg"),
      error: req.flash("error"),
      footer: true,
    });
  }else
  {  
    if (req.session.admin === true) {
      res.redirect("/admin");
    }
    res.redirect("/");

  }

  
});

router.post("/signin", async (req, res) => {
  let signinData = req.body;
  let signinResponse = await authenticate.signIn(signinData);
  if (!signinResponse) {
    req.flash("error", "Wrong Username Or Password ? Please Try Again");
    res.redirect("/signin");
    return;
  }
  if (signinResponse.role === 3) {
    req.session.admin = true;
    res.redirect("/admin");
    return;
  }
  req.session.user = true;
  req.session.userDetails = {
    _id: signinResponse._id,
    name: signinResponse.name,
    role: signinResponse.role,
  };
  res.redirect("/");
  return;
});

router.get("/authorblogs/:id", async (req, res) => {
  let user = req.session.userDetails;
  let session = req.session.user;
  try {
    const authorBlogs = await User.findOne({ _id: req.params.id });

    let otherTravelJunkies = await User.find({
      _id: { $ne: mongoose.Types.ObjectId(req.params.id) },
      role: 2,
      status: "active",
    });

    if (!session) {
      res.render("author/authorblogs", {
        authorBlogs: authorBlogs,
        otherTravelJunkies: otherTravelJunkies,
      });
      return;
    }
    if (user.role === 1) {
      res.render("author/authorblogs", {
        authorBlogs: authorBlogs,
        otherTravelJunkies: otherTravelJunkies,
        user: true,
      });
      return;
    }

    res.render("author/authorblogs", {
      authorBlogs: authorBlogs,
      otherTravelJunkies: otherTravelJunkies,
      author: true,
      profile: true,
    });
  } catch (error) {
    console.log(error.message);
  }
});

router.get("/beauthor", (req, res) => {
  let user = req.session.userDetails;
  let session = req.session.user;
  if (!session || user.role === 2) {
    res.redirect("/");
    return;
  }
  if (user.role === 1) {
    res.render("author/authorprofile");
  }
});

router.post("/authprofile", store.array("images", 2), (req, res) => {
  let user = req.session.userDetails;
  let session = req.session.user;
  if (session) {
    if (user.role === 1) {
      console.log(user);
      const files = req.files;
      if (!files) {
        const error = new Error("please choose files");
      }
      // convert images into base64 encoding
      let imgArray = files.map((file) => {
        let img = fs.readFileSync(file.path);

        return (encode_image = img.toString("base64"));
      });
      imgArray.map(async (src, index) => {
        try {
          let test = await User.findOneAndUpdate(
            { _id: ObjectId(user._id) },
            {
              $set: {
                about: req.body.about,
                role: 2,
              },
              $push: {
                profile: {
                  filename: files[index].originalname,
                  contentType: files[index].mimetype,
                  imageBase64: src,
                },
              },
            },
            {
              upsert: true,
            }
          ).then(() => {
            res.redirect("/logout");
          });
        } catch (error) {
          console.log(error.message);
        }
      });
    }
  }
});

router.get("/logout", (req, res) => {
  delete req.session.user;
  res.redirect("/");
});

module.exports = router;
