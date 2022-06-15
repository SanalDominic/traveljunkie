const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  about: {
    type: String,
  },
  profile: [
    {
      filename: {
        type: String,
      },
      contentType: {
        type: String,
      },
      imageBase64: {
        type: String,
      },
    },
  ],
  place: {
    type: String,
    default: "place",
  },
  country: {
    type: String,
    default: "country",
  },
  role: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    default: "active",
  },
  favourites: [
    {
      authorid: {
        type: String,
      },
      blogid: {
        type: String,
      },
    },
  ],
  blogs: [
    {
      delete: {
        type: Boolean,
        default: false,
      },
      featured: {
        type: Boolean,
        required: true,
        default: false,
      },
      title: {
        type: String,
      },
      description: {
        type: String,
      },
      category: {
        type: String,
        default: "places",
      },
      content: {
        type: String,
      },
      image: [
        {
          filename: {
            type: String,
          },
          contentType: {
            type: String,
          },
          imageBase64: {
            type: String,
          },
        },
      ],
      createdAt: {
        type: Date,
        default: Date.now,
      },
      interactions: [
        {
          like: {
            type: Number,
            default: false,
          },
          report: {
            type: Number,
            default: 0,
          },
          user: {
            type: String,
            required: true,
          },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
