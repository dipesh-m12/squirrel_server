const express = require("express");
const intRouter = express.Router();
const Wishlist = require("../models/wishlistModel");
const Impression = require("../models/impressionsModel");
const Enquiry = require("../models/enquiryModel");
const jwt = require("jsonwebtoken");
const emailController = require("../controllers/emailController");

// Wishlist Route: Toggle Wishlist status
intRouter.post("/wishlist", async (req, res) => {
  try {
    const { from, to, patentDetails } = req.body;

    let wishlistEntry = await Wishlist.findOne({
      "from.userId": from.userId,
      "to.userId": to.userId,
      "patentDetails.patentId": patentDetails.patentId,
    });

    if (wishlistEntry) {
      // Toggle the wishlist status
      wishlistEntry.wishlist = !wishlistEntry.wishlist;
    } else {
      // Create new entry with wishlist set to true by default
      wishlistEntry = new Wishlist({
        from,
        to,
        patentDetails,
        wishlist: true, // Default to true if not found
      });
    }

    const savedWishlist = await wishlistEntry.save();

    return res.status(201).json({
      status: 201,
      success: true,
      message: `Wishlist ${
        wishlistEntry.wishlist ? "added" : "removed"
      } successfully`,
      data: savedWishlist,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to process Wishlist entry",
      error: error.message,
    });
  }
});

// Impression Route: Toggle Impression status
intRouter.post("/impression", async (req, res) => {
  try {
    const { from, to, patentDetails } = req.body;

    let impressionEntry = await Impression.findOne({
      "from.userId": from.userId,
      "to.userId": to.userId,
      "patentDetails.patentId": patentDetails.patentId,
    });

    if (impressionEntry) {
      // Toggle the impression status
      impressionEntry.impression = !impressionEntry.impression;
    } else {
      // Create new entry with impression set to true by default
      impressionEntry = new Impression({
        from,
        to,
        patentDetails,
        impression: true, // Default to true if not found
      });
    }

    const savedImpression = await impressionEntry.save();

    return res.status(201).json({
      status: 201,
      success: true,
      message: `Impression ${
        impressionEntry.impression ? "added" : "removed"
      } successfully`,
      data: savedImpression,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to process Impression entry",
      error: error.message,
    });
  }
});

// Enquiry Route: Toggle Enquiry status
intRouter.post("/enquiry", async (req, res) => {
  try {
    const { from, to, patentDetails } = req.body;

    // Check if all necessary fields are provided
    if (!from || !to || !patentDetails) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Missing required fields (from, to, or patentDetails).",
      });
    }

    let enquiryEntry = await Enquiry.findOne({
      "from.userId": from.userId,
      "to.userId": to.userId,
      "patentDetails.patentId": patentDetails.patentId,
    });

    if (enquiryEntry) {
      // Toggle the enquiry status
      enquiryEntry.enquire = enquiryEntry.enquire;
    } else {
      // Create new entry with enquire set to true by default
      enquiryEntry = new Enquiry({
        from,
        to,
        patentDetails,
        enquire: true, // Default to true if not found
      });
    }

    const savedEnquiry = await enquiryEntry.save();

    res.status(201).json({
      status: 201,
      success: true,
      message: `Enquiry ${
        enquiryEntry.enquire ? "added" : "removed"
      } successfully`,
      data: savedEnquiry,
    });
    try {
      // Send the email notification (use the 'enquiryConfirmation' template)
      await emailController.sendTemplateEmail(
        to.email, // Send to the patent owner
        "enquiryConfirmation",
        {
          patentNumber: patentDetails.patentNumber,
          title: patentDetails.title,
          enquirerName: `${from.firstName} ${from.lastName}`,
        }
      );

      await emailController.sendCustomEmail({
        to: "Squirreliptech@gmail.com", // Replace with the maintainer's email
        subject: "New Enquiry Raised Regarding Patent",
        body: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Enquiry Raised Regarding Patent</h2>
      
      <p><strong>Enquirer Details:</strong></p>
      <ul>
        <li><strong>Name:</strong> ${from.firstName} ${from.lastName}</li>
        <li><strong>Email:</strong> ${from.email}</li>
        <li><strong>Mobile:</strong> ${from.mobile}</li>
      </ul>

      <p><strong>Patent Details:</strong></p>
      <ul>
        <li><strong>Title:</strong> ${patentDetails.title}</li>
        <li><strong>Patent Number:</strong> ${patentDetails.patentNumber}</li>
        <li><strong>Application Number:</strong> ${
          patentDetails.applicationNumber
        }</li>
        <li><strong>Used Technology:</strong> ${patentDetails.usedTech}</li>
        <li><strong>Sector:</strong> ${patentDetails.sector}</li>
        <li><strong>Patent ID:</strong> ${patentDetails.patentId}</li>
      </ul>

      <p><strong>Patent Owner Details:</strong></p>
      <ul>
        <li><strong>Name:</strong> ${to.firstName} ${to.lastName}</li>
        <li><strong>Email:</strong> ${to.email}</li>
        <li><strong>Mobile:</strong> ${to.mobile}</li>
      </ul>

      <p><strong>Enquiry Details:</strong></p>
      <ul>
      
        <li><strong>Enquiry Raised On:</strong> ${new Date().toLocaleString()}</li>
      </ul>

      <p><strong>Next Steps:</strong> Please review the enquiry and get in touch with the enquirer if needed. You may also contact the patent owner for further details.</p>
      
      <br/>
      <p>Best regards,</p>
      <p>The Squirrel IP Team</p>
    </div>
  `,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Note: We don't return here as the subscription was still successful
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to process Enquiry entry",
      error: error.message,
    });
  }
});

//get interactions doer side

const getUserIdFromCookie = (req) => {
  return req.cookies.token;
};

intRouter.get("/wishlist", async (req, res) => {
  try {
    const token = getUserIdFromCookie(req);
    if (!token) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User ID not found in cookies",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;
    // Query Wishlist collection to find all wishlisted patents by this user
    const wishlistedItems = await Wishlist.find({
      "from.userId": userId,
      wishlist: true, // Only return items that are wishlisted
    }).select("patentDetails.patentId");

    const patentIds = wishlistedItems.map(
      (item) => item.patentDetails.patentId
    );

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Wishlisted patent IDs fetched successfully",
      data: patentIds,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to fetch Wishlisted patent IDs",
      error: error.message,
    });
  }
});

intRouter.get("/enquiry", async (req, res) => {
  try {
    const token = getUserIdFromCookie(req);

    if (!token) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User ID not found in cookies",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;
    // Query Enquiry collection to find all enquired patents by this user
    const enquiredItems = await Enquiry.find({
      "from.userId": userId,
      enquire: true, // Only return items that have been enquired
    }).select("patentDetails.patentId");

    const patentIds = enquiredItems.map((item) => item.patentDetails.patentId);

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Enquired patent IDs fetched successfully",
      data: patentIds,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to fetch Enquired patent IDs",
      error: error.message,
    });
  }
});

intRouter.get("/impression", async (req, res) => {
  try {
    const token = getUserIdFromCookie(req);

    if (!token) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User ID not found in cookies",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;
    // Query Impression collection to find all patents this user has viewed
    const impressionItems = await Impression.find({
      "from.userId": userId,
      impression: true, // Only return items that have impressions
    }).select("patentDetails.patentId");

    const patentIds = impressionItems.map(
      (item) => item.patentDetails.patentId
    );

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Impression patent IDs fetched successfully",
      data: patentIds,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to fetch Impression patent IDs",
      error: error.message,
    });
  }
});

//receiver side
intRouter.get("/received-wishlist", async (req, res) => {
  try {
    const token = getUserIdFromCookie(req);

    if (!token) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User ID not found in cookies",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;
    // Find all wishlists where the patents belong to the user (receiver)
    const wishlistedItems = await Wishlist.find({
      "to.userId": userId, // Patents that belong to the logged-in user
      wishlist: true, // Only those wishlisted by other users
    }).select("patentDetails.patentId");

    const patentIds = wishlistedItems.map(
      (item) => item.patentDetails.patentId
    );
    console.log(patentIds);
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Patents wishlisted by other users retrieved successfully",
      data: patentIds,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to fetch wishlisted patents by others",
      error: error.message,
    });
  }
});

// Route for getting patents where other users have made enquiries
intRouter.get("/received-enquiry", async (req, res) => {
  try {
    const token = getUserIdFromCookie(req);
    if (!token) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User ID not found in cookies",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;
    // Find all enquiries for patents belonging to the user
    const enquiredItems = await Enquiry.find({
      "to.userId": userId, // Patents that belong to the logged-in user
      enquire: true, // Only those enquired by other users
    }).select("patentDetails.patentId");

    const patentIds = enquiredItems.map((item) => item.patentDetails.patentId);

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Patents enquired by other users retrieved successfully",
      data: patentIds,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to fetch enquired patents by others",
      error: error.message,
    });
  }
});

// Route for getting patents that other users have viewed (impressions)
intRouter.get("/received-impression", async (req, res) => {
  try {
    const token = getUserIdFromCookie(req);
    if (!token) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User ID not found in cookies",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;
    // Find all impressions for patents belonging to the user
    const impressionItems = await Impression.find({
      "to.userId": userId, // Patents that belong to the logged-in user
      impression: true, // Only those with impressions by other users
    }).select("patentDetails.patentId");

    const patentIds = impressionItems.map(
      (item) => item.patentDetails.patentId
    );

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Patents viewed by other users retrieved successfully",
      data: patentIds,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to fetch patents viewed by others",
      error: error.message,
    });
  }
});

module.exports = intRouter;
