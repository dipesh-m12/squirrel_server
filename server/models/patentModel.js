const mongoose = require("mongoose");

const patentSchema = new mongoose.Schema(
  //24 fields
  {
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
      //   unique: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    coauthors: {
      type: String, // Modify this to an array of strings if needed.
    },
    org: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    grantDate: {
      // Changed to Date type
      type: Date,
      required: true,
    },
    filingDate: {
      // Changed to Date type
      type: Date,
      required: true,
    },
    patentNumber: {
      type: String,
      required: true,
      unique: true,
    },
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    abstract: {
      type: String,
      required: true,
    },
    sector: {
      type: String,
      required: true,
    },
    usedTech: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      // required: true,
      // unique: true,
    },
    pdf: {
      type: String,
      required: true,
    },
    patentId: {
      type: String,
      required: true,
      unique: true,
    },
    listedAt: {
      type: Date,
      default: Date.now,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    transactionType: {
      // New field added
      type: String,
      // enum: ["available", "sold", "both"],
      required: true, // Change to false if it's optional
      default: "available", //default -- avialable
    },
    patentType: {
      // New field added
      type: String,
      // required: true, // Change to false if it's optional
      default: "Utility",
    },
    patentImages: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

const Patent = mongoose.model("Patent", patentSchema);

module.exports = Patent;
