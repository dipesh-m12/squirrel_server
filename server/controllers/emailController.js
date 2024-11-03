// controllers/emailController.js

const nodemailer = require("nodemailer");

// Configure transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Email templates
const emailTemplates = {
  welcome: (userName) => ({
    subject: "Welcome to Squirrel IP!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Squirrel IP!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for joining Squirrel IP. We're excited to have you on board!</p>
        <p>Start exploring our platform to manage and protect your intellectual property.</p>
        <br/>
        <p>Best regards,</p>
        <p>The Squirrel IP Team</p>
      </div>
    `,
  }),

  passwordReset: (resetLink) => ({
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetLink}" style="color: #007bff;">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <br/>
        <p>Best regards,</p>
        <p>The Squirrel IP Team</p>
      </div>
    `,
  }),

  patentSubmission: (patentDetails) => ({
    subject: "Patent Submission Confirmation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Patent Submission Received</h2>
        <p>Your patent submission has been received:</p>
        <ul>
          <li>Title: ${patentDetails.title}</li>
          <li>Reference Number: ${patentDetails.referenceNumber}</li>
          <li>Submission Date: ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>We will review your submission and get back to you soon.</p>
        <br/>
        <p>Best regards,</p>
        <p>The Squirrel IP Team</p>
      </div>
    `,
  }),

  subscriptionConfirmation: (subscriptionDetails) => ({
    subject: "Subscription Confirmation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Registration Confirmed</h2>
        <p>Thank you for submitting your request, we will get back to you shortly</p>
        <br/>
        <p>Best regards,</p>
        <p>The Squirrel IP Team</p>
      </div>
    `,
  }),
};

// Validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const emailController = {
  /**
   * Send email using a predefined template
   * @param {string} to - Recipient email
   * @param {string} templateName - Name of the template to use
   * @param {Object} templateData - Data to populate the template
   * @param {Object} options - Additional email options (cc, bcc, attachments)
   */
  sendTemplateEmail: async (to, templateName, templateData, options = {}) => {
    try {
      if (!validateEmail(to)) {
        throw new Error("Invalid email address");
      }

      if (!emailTemplates[templateName]) {
        throw new Error("Invalid template name");
      }

      const template = emailTemplates[templateName](templateData.userName);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: template.subject,
        html: template.html,
        text: template.html.replace(/<[^>]*>/g, ""),
        ...options,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  },

  /**
   * Send custom email without template
   * @param {Object} emailData - Email data including to, subject, and body
   * @param {Object} options - Additional email options
   */
  sendCustomEmail: async (emailData, options = {}) => {
    try {
      const { to, subject, body } = emailData;

      if (!validateEmail(to)) {
        throw new Error("Invalid email address");
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ""),
        ...options,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  },
};

module.exports = emailController;
