const express = require("express");
const patentRouter = express.Router();
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const Patent = require("../models/patentModel");
const Wishlist = require("../models/wishlistModel");
const Impression = require("../models/impressionsModel");
const Enquiry = require("../models/enquiryModel");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
const multer = require("multer");

// AWS S3 Configuration
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const upload = multer();

// Route to Handle Patent Submission
patentRouter.post(
  "/create-patent",
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    const {
      firstName,
      lastName,
      mobile,
      email,
      state,
      city,
      coauthors,
      org,
      title,
      grantDate,
      filingDate,
      patentNumber,
      applicationNumber,
      abstract,
      sector,
      usedTech,
      transactionType,
      patentType,
    } = req.body;

    const files = req.files;
    const pdfFile = files?.pdf?.[0];
    const imageFiles = files?.images || [];

    if (!pdfFile) {
      return res.status(400).json({ message: "PDF file is required." });
    }
    if (!imageFiles.length) {
      return res
        .status(400)
        .json({ message: "At least one image is required." });
    }

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

      let userId;
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "squirrelIP"
        );
        userId = decoded.userId;
      } catch (err) {
        return res.status(401).json({
          status: 401,
          success: false,
          error: true,
          message: "Invalid or expired token. Please log in again.",
        });
      }

      // Upload files to S3
      const pdfFileName = `patents/pdf/${Date.now()}_${pdfFile.originalname}`;
      const pdfUploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Key: pdfFileName,
        Body: pdfFile.buffer,
        ContentType: pdfFile.mimetype,
      };
      const pdfUrl = await s3Client
        .send(new PutObjectCommand(pdfUploadParams))
        .then(
          () =>
            `https://${AWS_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${pdfFileName}`
        );

      const imageUrls = await Promise.all(
        imageFiles.map(async (image) => {
          const imageFileName = `patents/images/${Date.now()}_${
            image.originalname
          }`;
          const imageUploadParams = {
            Bucket: AWS_BUCKET_NAME,
            Key: imageFileName,
            Body: image.buffer,
            ContentType: image.mimetype,
          };
          await s3Client.send(new PutObjectCommand(imageUploadParams));
          return `https://${AWS_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${imageFileName}`;
        })
      );

      const newPatent = new Patent({
        userId,
        firstName,
        lastName,
        mobile,
        email,
        state,
        city,
        coauthors: coauthors || "",
        org: org || "",
        title,
        grantDate: new Date(grantDate),
        filingDate: new Date(filingDate),
        patentNumber,
        applicationNumber,
        abstract,
        sector,
        usedTech,
        transactionType,
        patentType,
        pdf: pdfUrl,
        patentImages: imageUrls,
        patentId: uuidv4(),
        verified: false,
      });

      const savedPatent = await newPatent.save();

      return res.status(201).json({
        status: 201,
        success: true,
        error: false,
        message: "Patent submitted successfully.",
        data: { savedPatent, pdfUrl, imageUrls },
      });
    } catch (error) {
      console.error("Error submitting patent:", error);
      return res.status(500).json({
        status: 500,
        success: false,
        error: true,
        message: "Failed to submit patent.",
        data: error.message,
      });
    }
  }
);

patentRouter.post("/add-patent", async (req, res) => {
  const {
    firstName,
    lastName,
    mobile,
    email,
    state,
    city,
    coauthors,
    org,
    title,
    grantDate,
    filingDate,
    patentNumber,
    applicationNumber,
    abstract,
    sector,
    usedTech,
    pdf,
    transactionType,
    patentType,
    id, // Added this field
    verified, // Added this field
    patentImages,
  } = req.body;

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;

    const newPatent = new Patent({
      userId,
      firstName,
      lastName,
      mobile,
      email,
      state,
      city,
      coauthors,
      org,
      title,
      grantDate: new Date(grantDate),
      filingDate: new Date(filingDate),
      patentNumber,
      applicationNumber,
      abstract,
      sector,
      usedTech,
      pdf,
      patentImages,
      patentId: uuidv4(),
      transactionType,
      patentType,
      id, // Set the id field from the frontend
      verified: verified !== undefined ? verified : false, // Set verified, defaulting to false if not provided
    });

    const savedPatent = await newPatent.save();

    return res.status(201).json({
      status: 201,
      success: true,
      error: false,
      message: "Patent added successfully",
      data: savedPatent,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Failed to add patent",
      data: error.message,
    });
  }
});

patentRouter.get("/my-patents", async (req, res) => {
  try {
    // Retrieve the token from the cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: true,
        message: "No token found, please log in again",
      });
    }

    // Verify the token to get the userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;

    // Fetch the patents associated with the userId
    const userPatents = await Patent.find({ userId });

    if (!userPatents || userPatents.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: true,
        message: "No patents found for this user",
      });
    }

    // Return the user's patents
    return res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "Patents retrieved successfully",
      data: userPatents,
    });
  } catch (error) {
    // Handle any errors
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Failed to retrieve patents",
      data: error.message,
    });
  }
});

patentRouter.get("/search-patents", async (req, res) => {
  try {
    const {
      searchText, // Full-text search field (optional)
      listingDate, // Filter by listing date (optional)
      patentType, // Filter by patent type (optional)
      sector, // Filter by sector (optional)
      usedTech, // Filter by used technology (optional)
      transactionType, // Filter by transaction type (optional)
    } = req.query;
    const searchPipeline = [];

    // Add the Atlas Search stage only if searchText is provided
    if (searchText) {
      searchPipeline.push({
        $search: {
          index: "patentSearchIndex", // Your search index name
          text: {
            query: searchText,
            path: ["title", "abstract", "sector", "usedTech"], // Fields to search over
            fuzzy: { maxEdits: 2 }, // Allows fuzzy matching for typos
          },
        },
      });
    }

    // Conditionally add other filters to the pipeline
    if (listingDate) {
      searchPipeline.push({
        $match: {
          listedAt: { $gte: new Date(listingDate) }, // Filters by listing date
        },
      });
    }

    if (patentType) {
      searchPipeline.push({
        $match: { patentType }, // Filters by patent type
      });
    }

    if (sector) {
      searchPipeline.push({
        $match: { sector }, // Filters by sector
      });
    }

    if (usedTech) {
      searchPipeline.push({
        $match: { usedTech }, // Filters by used technology
      });
    }

    if (transactionType) {
      searchPipeline.push({
        $match: { transactionType }, // Filters by transaction type
      });
    }

    // Always sort by most recent `listedAt`
    searchPipeline.push({
      $sort: { listedAt: -1 },
    });

    // Execute the pipeline
    const patents = await Patent.aggregate(searchPipeline).exec();

    return res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "Patents found successfully",
      data: patents,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Error in searching patents",
      data: error.message,
    });
  }
});

patentRouter.post("/get-patents-by-ids", async (req, res) => {
  try {
    const { patentIds } = req.body;

    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: true,
        message: "No token found, please log in again",
      });
    }

    // Verify the token to get the userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;

    // Check if patentIds array is provided
    if (!patentIds || !Array.isArray(patentIds) || patentIds.length === 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: true,
        message: "Invalid patentIds array",
      });
    }

    // Fetch patents matching the patentIds
    const patents = await Patent.find({
      patentId: { $in: patentIds }, // Query to match any patentId in the array
    });

    if (patents.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: true,
        message: "No patents found for the provided patentIds",
      });
    }

    const patentsWithOwnership = patents.map((patent) => ({
      ...patent._doc, // Spread the patent fields
      userOwnPatent: userId === patent.userId, // Add the ownership flag
    }));

    // Return the found patents
    return res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "Patents fetched successfully",
      data: patentsWithOwnership, // Return the array with ownership info
    });
  } catch (error) {
    // Handle any errors
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Error fetching patents",
      data: error.message,
    });
  }
});

patentRouter.get("/get-all-patents", async (req, res) => {
  try {
    // Fetch all patents from the database
    const patents = await Patent.find().sort({ listedAt: -1 }); // Sort by most recent `listedAt`

    // Return all patents to the frontend
    return res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "Patents retrieved successfully",
      data: patents,
    });
  } catch (error) {
    // Handle any errors that occur during the query
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Failed to retrieve patents",
      data: error.message,
    });
  }
});

patentRouter.delete("/delete-patent/:patentId", async (req, res) => {
  try {
    const { patentId } = req.params;

    // Verify token existence
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: true,
        message: "No token found, please log in again",
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "squirrelIP");
    const userId = decoded.userId;

    // Find and delete the patent in one step, ensuring ownership
    const patent = await Patent.findOneAndDelete({ patentId, userId });
    if (!patent) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: true,
        message: "Patent not found or you don't have permission to delete it",
      });
    }

    // Delete related enquiries, wishlists, and impressions
    await Enquiry.deleteMany({ "patentDetails.patentId": patentId });
    await Wishlist.deleteMany({ "patentDetails.patentId": patentId });
    await Impression.deleteMany({ "patentDetails.patentId": patentId });

    return res.status(200).json({
      status: 200,
      success: true,
      error: false,
      message: "Patent deleted successfully",
    });
  } catch (error) {
    // Handle token verification errors specifically
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: true,
        message: "Invalid token, please log in again",
      });
    }

    // Handle other errors
    console.error("Error deleting patent:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      error: true,
      message: "Failed to delete patent",
      data: error.message,
    });
  }
});

module.exports = patentRouter;
