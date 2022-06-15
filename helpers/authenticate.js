const User = require("../models/user");
const bcrypt = require("bcrypt");
module.exports = {
  signUp: async (signupFormData) => {
    let signupStatus = false;
    let dbUserData = await User.findOne({ email: signupFormData.email });
    if (dbUserData) {
      return (signupStatus = true);
    }
    let hashPassword = await bcrypt.hash(signupFormData.password, 10);
    if (!hashPassword) {
      return (signupStatus = true);
    }
    let userSchema = new User({
      name: signupFormData.name,
      email: signupFormData.email,
      password: hashPassword,
      place: signupFormData.place,
      country: signupFormData.country,
    });
    console.log(userSchema);
    await userSchema.save();
    return false;
  },
  signIn: async (signinFormData) => {
    let dbfindUser = await User.findOne({ email: signinFormData.email });
    if (!dbfindUser) {
      return false;
    }
    let comparePassword = await bcrypt.compare(
      signinFormData.password,
      dbfindUser.password
    );
    if (!comparePassword) {
      return false;
    }
    return dbfindUser;
  },
};
