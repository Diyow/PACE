# PACE - Event Management System

## Project Overview
PACE (Platform for Advanced Community Events) is a comprehensive event management system developed as part of the Software Engineering Principles course (BIT216) at the University. This project demonstrates the application of software engineering principles, methodologies, and best practices in developing a real-world web application.

## ✨ Features

* **User Authentication & Profiles:** Secure registration, login (attendees, organizers, admin) using NextAuth.js, and user profile management.
* **Event Discovery & Browsing:** Users can browse upcoming events, view details, and search/filter by categories, dates, or location.
* **Online Ticket Booking:** Seamless ticket selection, seat selection (if applicable), and booking process.
* **Payment Integration:** Secure payment processing for ticket purchases.
* **My Tickets Section:** Users can view their purchased tickets.
* **Event Creation & Management (For Organizers):** Tools to create new events, set ticket types and pricing, manage event details, and track sales.
* **Customizable Seating Arrangements:** Organizers can define seating layouts for venues.
* **Promotional Codes & Discounts:** Functionality for organizers to create and manage promo codes.
* **Waitlist System:** Users can join a waitlist for sold-out events and get notified if tickets become available.
* **Organizer Dashboard:** Analytics and reporting for event performance, ticket sales, and revenue.
* **Admin Dashboard:** Platform oversight, organizer management, and system-wide reporting.
* **Email Notifications:** Automated emails for booking confirmations, newly registered organizer, waitlist notifications, etc.


## 🛠️ Technologies Used

* **Frontend:** Next.js (React Framework), Tailwind CSS
* **Backend:** Next.js (API Routes), Node.js
* **Database:** MongoDB (with Mongoose ODM)
* **Authentication:** NextAuth.js
* **Image Management:** Cloudinary
* **Emailing:** Nodemailer
* **Deployment:** Vercel
* **Collaboration:** Github

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

* [Node.js](https://nodejs.org/) (version >= 18.x recommended)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* [MongoDB](https://www.mongodb.com/try/download/community)

## 🚀 Getting Started

Follow these steps to get your development environment set up:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Diyow/PACE.git](https://github.com/Diyow/PACE.git)
    cd pace
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env.local
    ```
    Then, update the `.env.local` file with your specific credentials and configurations:

    ```env
    # MongoDB Connection URI
    MONGODB_URI=your_mongodb_connection_string

    # NextAuth Configuration
    NEXTAUTH_URL=http://localhost:3000 # Or your deployment URL
    NEXTAUTH_SECRET= # Generate a strong secret: openssl rand -base64 32

    # Cloudinary Credentials (for image uploads)
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret

    # Email Configuration (e.g., for Nodemailer using an SMTP service)
    EMAIL_HOST=your_smtp_host
    EMAIL_PORT=your_smtp_port # e.g., 587 for TLS, 465 for SSL
    EMAIL_USER=your_smtp_username
    EMAIL_PASSWORD=your_smtp_password
    EMAIL_FROM=noreply@example.com # Default sender email address

    NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
    
    ```
    * **`NEXTAUTH_SECRET`**: This is crucial for securing your sessions. You can generate a suitable secret using the command: `openssl rand -base64 32`.
    * **Cloudinary**: Obtain your credentials from your [Cloudinary Dashboard](https://cloudinary.com/console).
    * **Email**: Configure with your chosen email provider's SMTP details.

4.  **Seed Initial Admin/User Data (Manual Process):**

    **Why Manual?**
    The application UI currently allows admins to register organizers, but it does not have a direct sign-up page for creating the initial admin and attendee account.
    **Password Hashing Process:**
    You will first manually insert user data with a plain text password into MongoDB. Then, you'll run the `hash-passwords.js` script, which will connect to the database, find these unhashed passwords, hash them, and update the user documents directly.

    **Steps:**

    1.  **Connect to your MongoDB instance** using a tool like MongoDB Compass or the `mongo` shell.
    2.  **Navigate to the `PACE_Database` database, and then select the `users` collection.** (This is where the user documents are stored).
    3.  **Manually insert a new document for the admin/attendee user.** You'll need to define fields like `name`, `email`, `role` (e.g., "admin"/"attendee"), and `password`. For the `password` field, enter the desired plain text password.

        *Example User Document Structure (ensure it matches your Mongoose User model):*
        ```json
        {
          "name": "Admin User" / "Attendee User",
          "email": "admin@example.com",
          "password": "YourChosenPlainTextPassword", // The script will hash this
          "role": "admin" / "attendee"
          // Add any other required fields from your User model
        }
        ```
    4.  **Run the Hashing Script:** From your terminal, in the project's root directory, execute the `hash-passwords.js` script.
        ```bash
        node hash-passwords.js
        ```

        This script will connect to MongoDB, find users with unhashed passwords, hash their passwords, and save the changes back to the database.
    5.  **Verification (Optional):** After the script runs, you can check the user's document in MongoDB. The `password` field should now contain a hashed value, confirming the script worked as expected.

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ⚙️ Available Scripts

In the project directory, you can run:

* `npm run dev`: Starts the development server.
* `npm run build`: Builds the application for production.
* `npm run start`: Starts a production server (after building).
* `npm run lint`: Lints the codebase using ESLint.
* `npm run format`: Formats the code using Prettier (if configured).

## 🤝 Contributing
This project is developed as part of a university course. For academic purposes, contributions are limited to course participants.

## 📄 License
This project is created for educational purposes as part of the Software Engineering Principles course (BIT216).


---
