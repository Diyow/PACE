import nodemailer from 'nodemailer';

// Create a transporter object
export const createTransporter = async () => {
  // For production, use environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
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
    from: `"PACE Events" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  };
  
  return transporter.sendMail(mailOptions);
};

// Email template for organizer registration
export const getOrganizerRegistrationEmail = (organizer) => {
  return {
    subject: 'Your PACE Events Organizer Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to PACE Events!</h2>
        <p>Hello ${organizer.fullName},</p>
        <p>An administrator has created an organizer account for you on the PACE Events platform.</p>
        <p><strong>Your account details:</strong></p>
        <ul style="list-style-type: none; padding-left: 20px;">
          <li><strong>Username:</strong> ${organizer.username}</li>
          <li><strong>Password:</strong> ${organizer.password}</li>
          <li><strong>Organization:</strong> ${organizer.organizationName}</li>
          <li><strong>Email:</strong> ${organizer.email}</li>
          <li><strong>Phone Number:</strong> ${organizer.phoneNumber}</li>
        </ul>
        <p>You can now log in to your account using your username and the password provided by the administrator.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Login to Your Account
          </a>
        </div>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you,<br>The PACE Events Team</p>
      </div>
    `,
  };
};

export const getBookingConfirmationEmail = (bookingDetails) => {
  // bookingDetails: { bookingId, eventName, eventDate, tickets: [{category, quantity, price}], totalAmount, attendeeName }
  let ticketSummaryHtml = '';
  bookingDetails.tickets.forEach(ticket => {
    ticketSummaryHtml += `<li style="margin-bottom: 5px;">${ticket.quantity}x ${ticket.category} @ $${parseFloat(ticket.price).toFixed(2)} each</li>`;
  });

  return {
    subject: `Your Booking Confirmation for ${bookingDetails.eventName} (ID: ${bookingDetails.bookingId})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2563eb;">Booking Confirmed!</h1>
        </div>
        <p>Hello ${bookingDetails.attendeeName},</p>
        <p>Thank you for your booking! Your tickets for <strong>${bookingDetails.eventName}</strong> on ${bookingDetails.eventDate} are confirmed.</p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin-top: 20px; border: 1px solid #eee;">
          <h3 style="color: #333; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h3>
          <p style="margin-bottom: 5px;"><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
          <ul style="list-style-type: none; padding-left: 0; margin-top: 10px;">
            ${ticketSummaryHtml}
          </ul>
          <hr style="border: none; border-top: 1px dashed #ccc; margin: 15px 0;"/>
          <p style="font-size: 1.1em; font-weight: bold; color: #333; text-align: right;">
            Total Amount: $${parseFloat(bookingDetails.totalAmount).toFixed(2)}
          </p>
        </div>
        
        <p style="margin-top: 25px;">You can view your tickets in the "My Tickets" section on our platform.</p>
        <p style="color: #555; font-size: 0.9em; margin-top: 20px;">
          If you have any questions, please don't hesitate to contact our support team.
        </p>
        <p style="margin-top: 30px; text-align: center; font-size: 0.9em; color: #777;">
          Thank you for using PACE Events!
        </p>
      </div>
    `,
  };
};