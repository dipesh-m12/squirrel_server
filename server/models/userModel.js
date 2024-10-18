const mongoose = require("mongoose");
//23 fields
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      // required: true,
    },
    state: {
      type: String,
      // required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    orgLogo: {
      type: String,
    },
    orgName: {
      type: String,
    },
    orgType: {
      type: String,
    },
    orgEmail: {
      type: String,
    },
    orgContact: {
      type: String,
    },
    jobTitle: {
      type: String,
    },
    orgLocation: {
      type: String,
    },
    username: {
      type: String,
    },
    linkedIn: {
      type: String,
    },
    facebook: {
      type: String,
    },
    twitter: {
      type: String,
    },
    avatar: {
      type: String,
    },
    userId: {
      type: String,
      unique: true,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
