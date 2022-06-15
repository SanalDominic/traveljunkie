const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
module.exports = {



topTravelJunkies: async () => {

   let result= await User.aggregate([
        { $match: { status: "active", role: 2 } },
        { $unwind: "$blogs" },
        {
          $group: {
            _id: {
              id: "$_id",
              name: "$name",
              place: "$place",
              country: "$country",
              profile: "$profile",
            },
            interactions: { $push: "$blogs.interactions" },
          },
        },
        { $unwind: "$interactions" },
        { $unwind: "$interactions" },
        { $group: { _id: "$_id", likes: { $sum: "$interactions.like" } } },
        { $sort: { likes: -1 } },
      ]).limit(4);
   return result
  },

}