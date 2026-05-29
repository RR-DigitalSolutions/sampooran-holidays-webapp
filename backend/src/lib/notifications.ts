import nodemailer from "nodemailer";
import { logger } from "./logger";

// For development, we'll use a mock transporter or Ethereal Email
// In production, users should provide SMTP_HOST, SMTP_USER, etc.
const isDev = process.env.NODE_ENV === "development";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  auth: {
    user: process.env.SMTP_USER || "mock_user",
    pass: process.env.SMTP_PASS || "mock_pass",
  },
});

export async function sendWelcomeEmail(email: string, name: string, role: string) {
  const subject = role === "USER" ? "Welcome to Sampooran Holidays! ✨" : "Welcome, Partner! 🏨";
  const body = `
    <h1>Hello ${name},</h1>
    <p>Welcome to the Sampooran Holidays ecosystem. We are thrilled to have you as a ${role.toLowerCase()}.</p>
    ${role === "USER" ? '<p>Your ₹1,000 signup bonus has been credited to your account!</p>' : '<p>Your vendor dashboard is ready. Start listing your assets today.</p>'}
    <p>Best regards,<br/>The Sampooran Team</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"Sampooran Holidays" <no-reply@sampooran.com>',
      to: email,
      subject,
      html: body,
    });
    logger.info({ messageId: info.messageId, to: email }, "Welcome email sent");
  } catch (error) {
    logger.error({ error, email }, "Failed to send welcome email");
  }
}

export async function notifyVendorOfInquiry(vendorEmail: string, inquiryName: string, message: string) {
  const subject = "New Lead Received! 🚀";
  const html = `
    <h2>You have a new inquiry!</h2>
    <p><b>From:</b> ${inquiryName}</p>
    <p><b>Message:</b> ${message}</p>
    <p><a href="http://localhost:3000/dashboard">View in Vendor Dashboard</a></p>
  `;

  try {
    await transporter.sendMail({
      from: '"Sampooran Leads" <leads@sampooran.com>',
      to: vendorEmail,
      subject,
      html,
    });
    logger.info({ to: vendorEmail }, "Vendor inquiry notification sent");
  } catch (error) {
    logger.error({ error, vendorEmail }, "Failed to notify vendor of inquiry");
  }
}

export async function notifyVendorOfApproval(vendorEmail: string, assetName: string) {
  const subject = "Listing Published! 🎉";
  const html = `
    <h2>Great news!</h2>
    <p>Your listing <b>"${assetName}"</b> has been reviewed and approved by our team.</p>
    <p>It is now live on the Sampooran Holidays platform.</p>
    <p><a href="http://localhost:3000/hotels">View Live Discovery Page</a></p>
  `;

  try {
    await transporter.sendMail({
      from: '"Sampooran CMS" <cms@sampooran.com>',
      to: vendorEmail,
      subject,
      html,
    });
  } catch (error) {
    logger.error({ error, vendorEmail }, "Failed to notify vendor of approval");
  }
}

// SMS Simulation (Can be replaced with Twilio later)
export async function sendSMSAlert(phone: string, text: string) {
  logger.info({ phone, text }, "SMS Alert Triggered (Simulated)");
  // Integrate Twilio here...
}
