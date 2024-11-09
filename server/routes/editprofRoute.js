const express = require("express");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Wishlist = require("../models/wishlistModel");
const Impression = require("../models/impressionsModel");
const Enquiry = require("../models/enquiryModel");
const Patent = require("../models/patentModel");

// Update user details route
userRouter.put("/update", async (req, res) => {
  // Retrieve the token from the cookie
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      status: 401,
      success: false,
      error: true,
      message: "No token found, please log in again",
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;

    // Find the user by userId and update the document
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: req.body }, // Update fields with the body data
      { new: true, runValidators: true } // Return the updated document and run validators
    );
    //.select("-password"); // Exclude the password field from the response
    if (!updatedUser) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: true,
        message: "User not found",
      });
    }

    // Respond with the updated user data
    return res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Update failed",
      data: error.message,
    });
  }
});

userRouter.delete("/delete-user", async (req, res) => {
  try {
    // Get the token from the cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: true,
        message: "No token found, please log in again",
      });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;

    // Find and delete the user by their userId
    const deletedUser = await User.findOneAndDelete({ userId });

    if (!deletedUser) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: true,
        message: "User not found",
      });
    }
    // Delete all patents associated with the user

    // If the user is successfully deleted, respond with success
    res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "User deleted successfully",
      data: deletedUser,
    });

    // Retrieve the patent IDs before deleting the patents
    const patents = await Patent.find({ userId });
    const patentIds = patents.map((patent) => patent.patentId);

    // Delete patents and related records asynchronously
    await Patent.deleteMany({ userId });
    await Enquiry.deleteMany({
      "patentDetails.patentId": { $in: patentIds },
    });
    await Wishlist.deleteMany({
      "patentDetails.patentId": { $in: patentIds },
    });
    await Impression.deleteMany({
      "patentDetails.patentId": { $in: patentIds },
    });
  } catch (error) {
    // Handle any errors
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Failed to delete user",
      data: error.message,
    });
  }
});

module.exports = userRouter;
