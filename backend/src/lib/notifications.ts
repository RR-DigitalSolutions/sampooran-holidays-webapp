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

export async function notifyVendorOfVerification(vendorEmail: string, vendorName: string) {
  const subject = "Vendor Account Verified! ✅";
  const html = `
    <h2>Congratulations ${vendorName}!</h2>
    <p>Your vendor account has been successfully verified by our team.</p>
    <p>You can now start receiving bookings and listing your properties.</p>
    <p><a href="https://sampooranholidays.com/partner/dashboard">Go to Partner Dashboard</a></p>
  `;

  try {
    await transporter.sendMail({
      from: '"Sampooran CMS" <cms@sampooran.com>',
      to: vendorEmail,
      subject,
      html,
    });
  } catch (error) {
    logger.error({ error, vendorEmail }, "Failed to notify vendor of verification");
  }
}

// SMS Simulation (Can be replaced with Twilio later)
export async function sendSMSAlert(phone: string, text: string) {
  logger.info({ phone, text }, "SMS Alert Triggered (Simulated)");
  // Integrate Twilio here...
}

// ── Hotel Booking Confirmation Email ─────────────────────────────────────────
export async function sendHotelBookingConfirmation(params: {
  guestEmail: string; guestName: string; bookingId: number;
  hotelName: string; roomName: string; checkIn: string; checkOut: string;
  guests: number; totalAmount: number; paymentMethod: string; status: string;
}) {
  const isInstant = params.status === "CONFIRMED";
  const subject = isInstant
    ? `Booking Confirmed — ${params.hotelName} | Sampooran Holidays`
    : `Booking Request Received — ${params.hotelName} | Sampooran Holidays`;
  const checkInFmt = new Date(params.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const checkOutFmt = new Date(params.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#0B1F4E;padding:24px;text-align:center;">
      <h1 style="color:#F5A623;margin:0;font-size:20px;">Sampooran Holidays</h1>
    </div>
    <div style="background:${isInstant ? "#dcfce7" : "#fef9c3"};padding:14px 24px;text-align:center;">
      <strong style="color:${isInstant ? "#15803d" : "#854d0e"};font-size:15px;">
        ${isInstant ? "✅ Booking Confirmed!" : "⏳ Booking Request Sent!"}
      </strong>
    </div>
    <div style="padding:24px;">
      <h2 style="color:#0B1F4E;margin:0 0 16px;">${params.hotelName}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Booking Ref</td><td style="text-align:right;font-weight:bold;font-family:monospace;">#${String(params.bookingId).padStart(6, "0")}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Room</td><td style="text-align:right;font-weight:600;">${params.roomName}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Check-in</td><td style="text-align:right;font-weight:600;">${checkInFmt}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Check-out</td><td style="text-align:right;font-weight:600;">${checkOutFmt}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Guests</td><td style="text-align:right;font-weight:600;">${params.guests}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Payment</td><td style="text-align:right;font-weight:600;">${params.paymentMethod === "ONLINE" ? "Paid Online" : "Pay at Hotel"}</td></tr>
        <tr><td style="padding:10px 0;font-weight:bold;font-size:15px;">Total</td><td style="text-align:right;font-weight:bold;color:#F5A623;font-size:15px;">₹${params.totalAmount.toLocaleString()}</td></tr>
      </table>
      <div style="text-align:center;margin-top:20px;">
        <a href="https://sampooranholidays.com/my-hotel-bookings" style="background:#0B1F4E;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">View My Bookings</a>
      </div>
    </div>
    <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">Help: +91 85955 13009 | info@sampooranholidays.com</p>
    </div>
  </div>`;
  try {
    const info = await transporter.sendMail({
      from: '"Sampooran Holidays" <bookings@sampooranholidays.com>',
      to: params.guestEmail,
      subject,
      html,
    });
    logger.info({ messageId: info.messageId, bookingId: params.bookingId }, "Hotel booking email sent");
  } catch (error) {
    logger.error({ error, to: params.guestEmail }, "Failed to send hotel booking email");
  }
}

// ── Vendor New Booking Notification ──────────────────────────────────────────
export async function notifyVendorOfHotelBooking(params: {
  vendorEmail: string; hotelName: string; bookingId: number;
  guestName: string; checkIn: string; guests: number; totalAmount: number; status: string;
}) {
  const checkInFmt = new Date(params.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const subject = `New ${params.status === "CONFIRMED" ? "Confirmed" : "Pending"} Booking — ${params.hotelName}`;
  const html = `<h2>New Booking for ${params.hotelName}</h2>
    <p><b>Ref:</b> #${String(params.bookingId).padStart(6, "0")}</p>
    <p><b>Guest:</b> ${params.guestName}</p>
    <p><b>Check-in:</b> ${checkInFmt}</p>
    <p><b>Guests:</b> ${params.guests}</p>
    <p><b>Amount:</b> ₹${params.totalAmount.toLocaleString()}</p>
    <p><b>Status:</b> ${params.status}</p>
    <p><a href="https://sampooranholidays.com/partner/properties">Manage in Partner Dashboard</a></p>`;
  try {
    await transporter.sendMail({
      from: '"Sampooran Bookings" <bookings@sampooranholidays.com>',
      to: params.vendorEmail,
      subject,
      html,
    });
    logger.info({ to: params.vendorEmail, bookingId: params.bookingId }, "Vendor booking notification sent");
  } catch (error) {
    logger.error({ error, to: params.vendorEmail }, "Failed to notify vendor of hotel booking");
  }
}
