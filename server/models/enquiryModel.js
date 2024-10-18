const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    from: {
      userId: {
        type: String,
        required: true,
      },
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      mobile: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    to: {
      userId: {
        type: String,
        required: true,
      },
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      mobile: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    patentDetails: {
      title: {
        type: String,
        required: true,
      },
      patentNumber: {
        type: String,
        required: true,
      },
      applicationNumber: {
        type: String,
        required: true,
      },
      abstract: {
        type: String,
        required: true,
      },
      usedTech: {
        type: String,
        required: true,
      },
      sector: {
        type: String,
        required: true,
      },
      patentId: {
        type: String,
        required: true,
      },
    },
    enquire: {
      type: Boolean,
      default: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Enquiry = mongoose.model("enquiry", notificationSchema);

module.exports = Enquiry;
