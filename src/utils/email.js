// src/utils/email.js
import nodemailer from 'nodemailer';

// Create a transporter object
export const createTransporter = async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  return transporter;
};

// Send email function
export const sendEmail = async ({ to, subject, html }) => {
  const transporter = await createTransporter();
  const mailOptions = {
    from: `"PACE Events" <${process.env.EMAIL_FROM || 'noreply@example.com'}>`,
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
};

// Email template for organizer registration
export const getOrganizerRegistrationEmail = (organizer) => {
  return {
    subject: 'Welcome to PACE Events - Your Organizer Account is Ready!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #2563eb; font-size: 24px;">Welcome to PACE Events!</h1>
        </div>
        <p style="font-size: 16px; color: #333;">Hello ${organizer.fullName},</p>
        <p style="font-size: 16px; color: #333;">We're excited to have you on board! An administrator has created an event organizer account for you on the PACE Events platform.</p>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin-top: 20px; border: 1px solid #e0e0e0;">
          <h3 style="color: #2563eb; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 18px;">Your Account Details:</h3>
          <ul style="list-style-type: none; padding-left: 0; font-size: 15px; color: #555;">
            <li style="margin-bottom: 10px;"><strong>Username:</strong> ${organizer.username}</li>
            <li style="margin-bottom: 10px;"><strong>Default Password:</strong> ${organizer.password}</li>
            <li style="margin-bottom: 10px;"><strong>Organization:</strong> ${organizer.organizationName}</li>
            <li style="margin-bottom: 10px;"><strong>Email:</strong> ${organizer.email}</li>
            <li><strong>Phone Number:</strong> ${organizer.phoneNumber}</li>
          </ul>
        </div>

        <p style="font-size: 16px; color: #333; margin-top: 25px;">
          You can log in to your account using your username and the default password provided above.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
            Log In to Your Account
          </a>
        </div>

        <div style="padding: 15px; background-color: #ffffe0; border: 1px solid #fadf98; border-radius: 5px; font-size: 15px; color: #5d5743; margin-top: 20px;">
          <strong style="color: #d97706;">Important:</strong> For your security, please change your password immediately after your first login. You can do this from your profile settings.
        </div>
        
        <p style="font-size: 16px; color: #333; margin-top: 25px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p style="font-size: 16px; color: #333; margin-top: 20px;">Best regards,<br>The PACE Events Team</p>
      </div>
    `,
  };
};

export const getBookingConfirmationEmail = (bookingDetails) => {
  let ticketSummaryHtml = '';
  bookingDetails.tickets.forEach(ticket => {
    ticketSummaryHtml += `<li style="margin-bottom: 5px;">${ticket.quantity}x ${ticket.category}${ticket.seatInfo ? ` (Seat: ${ticket.seatInfo})` : ''} @ $${parseFloat(ticket.price).toFixed(2)} each</li>`;
  });
  return {
    subject: `Your Booking Confirmation for ${bookingDetails.eventName} (ID: ${bookingDetails.bookingId})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;"><h1 style="color: #2563eb;">Booking Confirmed!</h1></div>
        <p>Hello ${bookingDetails.attendeeName},</p>
        <p>Thank you for your booking! Your tickets for <strong>${bookingDetails.eventName}</strong> on ${bookingDetails.eventDate} are confirmed.</p>
        <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin-top: 20px; border: 1px solid #eee;">
          <h3 style="color: #333; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h3>
          <p style="margin-bottom: 5px;"><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
          <ul style="list-style-type: none; padding-left: 0; margin-top: 10px;">${ticketSummaryHtml}</ul>
          <hr style="border: none; border-top: 1px dashed #ccc; margin: 15px 0;"/>
          <p style="font-size: 1.1em; font-weight: bold; color: #333; text-align: right;">Total Amount: $${parseFloat(bookingDetails.totalAmount).toFixed(2)}</p>
        </div>
        <p style="margin-top: 25px;">You can view your tickets in the "My Tickets" section on our platform: <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/#my-tickets">View My Tickets</a></p>
        <p style="color: #555; font-size: 0.9em; margin-top: 20px;">If you have any questions, please contact our support team.</p>
        <p style="margin-top: 30px; text-align: center; font-size: 0.9em; color: #777;">Thank you for using PACE Events!</p>
      </div>
    `,
  };
};

// --- WAITLIST EMAIL TEMPLATES ---
export const getWaitlistJoinedEmail = (details) => {
  // details: { attendeeName, attendeeEmail, eventName, eventDate, eventId }
  return {
    subject: `You're on the waitlist for ${details.eventName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">Waitlist Confirmation</h2>
        <p>Hello ${details.attendeeName || 'Event Enthusiast'},</p>
        <p>You have successfully joined the waitlist for the event: <strong>${details.eventName}</strong>, scheduled for ${details.eventDate}.</p>
        <p>We will notify you at <strong>${details.attendeeEmail}</strong> if tickets become available.</p>
        <p>Please note that joining the waitlist does not guarantee a ticket. If tickets become available, they are often offered on a first-come, first-served basis or for a limited time.</p>
        <p>You can manage your waitlist entries and view event details on our platform:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${details.eventId}" style="background-color: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Event
          </a>
        </div>
        <p>Thank you,<br>The PACE Events Team</p>
      </div>
    `,
  };
};

export const getWaitlistTicketAvailableEmail = (details) => {
  // details: { attendeeName, attendeeEmail, eventName, eventDate, eventId }
  const bookingLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${details.eventId}`;
  return {
    subject: `Tickets now available for ${details.eventName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #10b981; text-align: center;">Good News, ${details.attendeeName || 'Event Enthusiast'}!</h2>
        <p>Great news! Some tickets have just become available for the event you're waitlisted for:</p>
        <p><strong>Event:</strong> ${details.eventName}</p>
        <p><strong>Date:</strong> ${details.eventDate}</p>
        <p>This is your chance to secure your spot! Please note that these tickets are limited and available on a first-come, first-served basis for waitlisted members, or for a limited time (e.g., 24-48 hours).</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingLink}" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Book Your Tickets Now
          </a>
        </div>
        <p>If you've already made other plans or are no longer interested, you can ignore this email or leave the waitlist via your account.</p>
        <p>Thank you,<br>The PACE Events Team</p>
      </div>
    `,
  };
};

export const getWaitlistNoTicketsEmail = (details) => {
  // details: { attendeeName, attendeeEmail, eventName, eventDate }
  return {
    subject: `Update on your waitlist status for ${details.eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4b5563; text-align: center;">Waitlist Update for ${details.eventName}</h2>
        <p>Hello ${details.attendeeName || 'Event Enthusiast'},</p>
        <p>This is an update regarding your waitlist status for the event: <strong>${details.eventName}</strong> on ${details.eventDate}.</p>
        <p>Unfortunately, as the event date is approaching, it seems unlikely that additional tickets will become available through the waitlist at this time.</p>
        <p>We understand this might be disappointing, and we appreciate your interest. We encourage you to check out other exciting events on our platform.</p>
        <p>If anything changes, or for future events, we hope to see you there!</p>
        <p>Thank you,<br>The PACE Events Team</p>
      </div>
    `,
  };
};