const express = require("express");
const authRouter = express.Router();
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");

authRouter.post("/register", async (req, res) => {
  const {
    firstName,
    lastName,
    mobile,
    email,
    country,
    state,
    city,
    pincode,
    password,
    orgLogo,
    orgName,
    orgType,
    orgEmail,
    orgContact,
    jobTitle,
    orgLocation,
    username,
    linkedIn,
    facebook,
    twitter,
    avatar,
  } = req.body;

  // console.log("Received registration request:", req.body);

  // Generate userId using uuidv4
  const userId = uuidv4();

  // Hash the password
  const saltRounds = 10; // You can adjust the salt rounds as needed
  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, saltRounds);
    // console.log(1);
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Password hashing failed",
      data: error.message,
    });
  }

  // Create a new user object
  // console.log(2);
  const newUser = new User({
    firstName,
    lastName,
    mobile,
    email,
    country,
    state,
    city,
    pincode,
    password: hashedPassword, // Use the hashed password
    orgLogo,
    orgName,
    orgType,
    orgEmail,
    orgContact,
    jobTitle,
    orgLocation,
    username,
    linkedIn,
    facebook,
    twitter,
    avatar,
    userId,
  });

  // console.log(3);
  try {
    // Save the new user to the database
    const savedUser = await newUser.save();
    // Create a JWT token
    const token = jwt.sign(
      { userId: savedUser.userId },
      process.env.JWT_SECRET || "squirrelIP",
      { expiresIn: "10y" }
    );

    // Set the cookie with the JWT token
    res.cookie("token", token, { httpOnly: false, secure: false }); // secure: true in production

    // Respond with success
    return res.status(201).json({
      status: 201,
      success: true,
      error: false,
      message: "User registered successfully",
      data: savedUser,
    });
  } catch (error) {
    // Handle any errors
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Registration failed",
      data: error.message,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: true,
        message: "Invalid email or password",
      });
    }

    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: true,
        message: "Invalid email or password",
      });
    }

    // Create a JWT token
    const token = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET || "squirrelIP",
      { expiresIn: "10y" }
    );

    // Set the cookie with the JWT token
    res.cookie("token", token, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      partitioned: true,
      maxAge: 6 * 24 * 60 * 60 * 1000,
    }); // secure: true in production

    // Respond with success
    return res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "Login successful",
      data: user,
    });
  } catch (error) {
    // Handle any errors
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Login failed",
      data: error.message,
    });
  }
});

authRouter.get("/auto-login", async (req, res) => {
  // Retrieve the token from the cookie
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: true,
        message: "No token found, please log in again",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");

    // Retrieve the userId from the decoded token
    const userId = decoded.userId;

    // Find the user in the database, excluding the password field
    const user = await User.findOne({ userId }); //.select("-password")
    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: true,
        message: "User not found",
      });
    }

    // Respond with the user's data
    return res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "Auto-login successful",
      data: user,
    });
  } catch (error) {
    return res.status(401).json({
      status: 401,
      success: false,
      error: true,
      message: "Invalid token, please log in again",
    });
  }
});

authRouter.post("/logout", (req, res) => {
  // Clear the cookie
  res.clearCookie("token", { path: "/" }); // Ensure the path matches what was set
  return res.status(200).json({
    status: 200,
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = authRouter;
