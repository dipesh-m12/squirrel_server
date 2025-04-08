require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer"); // For handling file uploads
const fs = require("fs");
const path = require("path");
const emailController = require("./controllers/emailController");

const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/authRoute");
const userRouter = require("./routes/editprofRoute");
const subsRouter = require("./routes/subsRoute");
const patentRouter = require("./routes/patentRoute");
const intRouter = require("./routes/interactionRoute");

const app = express();

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB connected"))
  .catch(() => console.log("DB Connection Failure"));

app.use(
  cors({
    origin: true, // Replace with your specific origin if needed
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // Limit each IP to 100 requests per `window` (15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

app.get("/", (req, res) => {
  res.send("Squirrel IP , up and running!");
});

app.use("/api/auth", authRouter);
app.use("/api/profile", userRouter);
app.use("/api/subscribe", subsRouter);
app.use("/api/patent", patentRouter);
app.use("/api/interaction", intRouter);

const upload = multer();
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;

// Create an S3 client with v3 SDK
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileName = `files/${Date.now()}_${file.originalname}`; // Unique file name

  try {
    const uploadParams = {
      Bucket: "pdf-folders-bucket",
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Removed ACL since it is not allowed
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${uploadParams.Bucket}.s3.${REGION}.amazonaws.com/${fileName}`;

    res.status(200).json({
      message: "File uploaded successfully",
      fileUrl: fileUrl, // Send back the public URL
    });
  } catch (err) {
    res.status(500).json({ message: `Failed to upload file: ${err.message}` });
  }
});

app.post("/api/email", async (req, res) => {
  try {
    const { to, templateName, templateData, options } = req.body;
    const result = await emailController.sendTemplateEmail(
      to,
      templateName,
      templateData,
      options
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
