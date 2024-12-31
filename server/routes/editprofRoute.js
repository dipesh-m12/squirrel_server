const express = require("express");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Wishlist = require("../models/wishlistModel");
const Impression = require("../models/impressionsModel");
const Enquiry = require("../models/enquiryModel");
const Patent = require("../models/patentModel");
const emailController = require("../controllers/emailController");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
// Configure multer for multiple files
const upload = multer();

// Configure S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Utility function to upload file to S3
const uploadFileToS3 = async (file, folder) => {
  if (!file) return null;

  const fileName = `${folder}/${Date.now()}_${file.originalname}`;
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

// Update user profile route with file uploads
userRouter.put(
  "/update-profile",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "orgLogo", maxCount: 1 },
  ]),
  async (req, res) => {
    // Token validation
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
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
      const userId = decoded.userId;

      // Handle file uploads
      const updateData = { ...req.body };

      // Upload avatar if provided
      if (req.files?.avatar?.[0]) {
        const avatarUrl = await uploadFileToS3(req.files.avatar[0], "avatars");
        if (avatarUrl) {
          updateData.avatar = avatarUrl;
          // console.log(avatarUrl);
        }
      }

      // Upload org logo if provided
      if (req.files?.orgLogo?.[0]) {
        const orgLogoUrl = await uploadFileToS3(
          req.files.orgLogo[0],
          "org-logos"
        );
        if (orgLogoUrl) {
          updateData.orgLogo = orgLogoUrl;
        }
      }

      // Update user data including file URLs
      const updatedUser = await User.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-password"); // Exclude password from response

      if (!updatedUser) {
        return res.status(404).json({
          status: 404,
          success: false,
          error: true,
          message: "User not found",
        });
      }

      // Success response
      return res.status(200).json({
        status: 200,
        success: true,
        error: false,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      // Error handling
      return res.status(500).json({
        status: 500,
        success: false,
        error: true,
        message: "Failed to update profile",
        data: error.message,
      });
    }
  }
);

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

userRouter.post("/send-recovery-email", async (req, res) => {
  const { email } = req.body;

  // Validate email format (basic validation)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: 400,
      success: false,
      error: true,
      message: "Invalid email format",
    });
  }

  try {
    // Find the user in the database by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: true,
        message: "User not found",
      });
    }

    const { userId } = user;

    // Send a custom email with a warning message
    await emailController.sendCustomEmail({
      to: email,
      subject: "Password Recovery Instructions - Team Squirrel IP",
      body: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
      <h2 style="color: #333;">Password Recovery</h2>
      <p>Dear User,</p>
      <p>We received a request to reset your password for your account with Team Squirrel IP.</p>
      <p>To reset your password, please click the link below:</p>
      <p>
        <a href="http://localhost:5000?userId=${userId
          .split("")
          .reverse()
          .join(
            ""
          )}" style="color: #007BFF; text-decoration: none; font-weight: bold;">
          Reset My Password
        </a>
      </p>
      <p><strong>Important:</strong> Please do not share your recovery code or this email with anyone. If you did not request this change, please ignore this email or contact our support team immediately.</p>
      <p>Thank you,</p>
      <p><em>Team Squirrel IP</em></p>
    </div>
  `,
    });

    return res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Failed to send email",
      data: error.message,
    });
  }
});

userRouter.put("/update-password", async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({
      status: 400,
      success: false,
      error: true,
      message: "UserId and password are required",
    });
  }

  try {
    // Reverse the userId
    const reversedUserId = userId.split("").reverse().join("");

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the user's password using the reversed userId
    const updatedUser = await User.findOneAndUpdate(
      { userId: reversedUserId },
      { $set: { password: hashedPassword } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: true,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Failed to update password",
      data: error.message,
    });
  }
});

module.exports = userRouter;
