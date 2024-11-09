const express = require("express");
const subsRouter = express.Router();
const Subscription = require("../models/subscriptionModel"); // Adjust the path as needed
const emailController = require("../controllers/emailController");
// Route to store user details and email
subsRouter.post("/", async (req, res) => {
  const { firstname, lastname, orgname, mobile, message, email } = req.body;

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

  // Basic validation for required fields
  if (!firstname || !lastname || !orgname || !mobile || !message) {
    return res.status(400).json({
      status: 400,
      success: false,
      error: true,
      message: "All fields are required",
    });
  }

  try {
    // Create a new entry with all the provided details
    const newEntry = new Subscription({
      firstname,
      lastname,
      orgname,
      mobile,
      message,
      email,
    });

    // Save the entry to the database
    const savedEntry = await newEntry.save();

    // Send confirmation email
    try {
      await emailController.sendTemplateEmail(
        email,
        "subscriptionConfirmation", // Corrected template name
        {
          userName: `${firstname} ${lastname}`,
          email: {
            plan: "Standard Subscription", // Customize as needed
            organization: orgname,
            name: `${firstname} ${lastname}`,
          },
        }
      );

      // Send notification email to admin
      await emailController.sendCustomEmail({
        to: "Squirreliptech@gmail.com",
        subject: "New Subscription Request",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Subscription Request</h2>
            <p>${firstname} ${lastname} has submitted a new request.</p>
            <p>Contact Email: ${email}</p>
            <p>Message:</p>
            <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
            <h3>Additional Details:</h3>
            <ul>
              <li>Organization: ${orgname}</li>
              <li>Mobile: ${mobile}</li>
            </ul>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Note: We don't return here as the subscription was still successful
    }

    // Respond with success
    return res.status(201).json({
      status: 201,
      success: true,
      error: false,
      message: "Subscription successful",
      data: savedEntry,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate email error
      return res.status(409).json({
        status: 409,
        success: false,
        error: true,
        message: "Email already subscribed",
      });
    }

    // Handle any other errors
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Failed to subscribe",
      data: error.message,
    });
  }
});

module.exports = subsRouter;
