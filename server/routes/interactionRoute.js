const express = require("express");
const intRouter = express.Router();
const Wishlist = require("../models/wishlistModel");
const Impression = require("../models/impressionsModel");
const Enquiry = require("../models/enquiryModel");
const jwt = require("jsonwebtoken");

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

    return res.status(201).json({
      status: 201,
      success: true,
      message: `Enquiry ${
        enquiryEntry.enquire ? "added" : "removed"
      } successfully`,
      data: savedEnquiry,
    });
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
