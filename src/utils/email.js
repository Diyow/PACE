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
          <li><strong>Organization:</strong> ${organizer.organizationName}</li>
          <li><strong>Email:</strong> ${organizer.email}</li>
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