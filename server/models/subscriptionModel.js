const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    orgname: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      // unique: true,
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("subscription", emailSchema);

module.exports = Subscription;
