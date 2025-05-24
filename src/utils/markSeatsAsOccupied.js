// Filename: src/utils/markSeatsAsOccupied.js

// Import the MongoDB client and ObjectId
const { MongoClient, ObjectId } = require('mongodb');

// --- Configuration ---
// The script will now rely on these being set in the environment
// when the script is executed.
const MONGODB_URI = process.env.MONGODB_URI;
// The database name is often part of the MONGODB_URI.
// If not, you'd also need process.env.DATABASE_NAME and pass it to client.db(DATABASE_NAME).
// For simplicity, this version assumes the database is in the URI.

const TARGET_EVENT_ID = "6830b6df61a83ee41a41f103"; // The eventId you want to update
// --- End Configuration ---

async function updateSeatStatuses() {
  if (!MONGODB_URI) {
    console.error("ERROR: MongoDB URI is not set in the environment.");
    console.error("Please set the MONGODB_URI environment variable before running the script.");
    console.error("Example (Linux/macOS): export MONGODB_URI=\"your_mongodb_uri\"");
    console.error("Example (Windows CMD): set MONGODB_URI=\"your_mongodb_uri\"");
    console.error("Example (Windows PowerShell): $env:MONGODB_URI=\"your_mongodb_uri\"");
    console.error("Alternatively, ensure your .env.local is loaded if running with a tool like 'dotenv/config'.");
    return;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Successfully connected to MongoDB server.");

    // client.db() will use the database specified in your MONGODB_URI.
    // If your MONGODB_URI does not specify a database, you'll need to pass it here:
    // const db = client.db(process.env.DATABASE_NAME);
    // And ensure DATABASE_NAME is also set in your environment.
    const db = client.db(); 
    console.log(`Using database: ${db.databaseName}`); // Log the database name being used

    const seatsCollection = db.collection('seats');
    const filter = { "eventId": new ObjectId(TARGET_EVENT_ID) };
    const updateDoc = {
      $set: {
        "status": "occupied",
        "updatedAt": new Date()
      }
    };

    console.log(`Attempting to update seats for eventId: ${TARGET_EVENT_ID} in database ${db.databaseName}...`);
    const result = await seatsCollection.updateMany(filter, updateDoc);

    console.log("Update operation completed.");
    console.log(`Documents matched: ${result.matchedCount}`);
    console.log(`Documents modified: ${result.modifiedCount}`);

    if (result.matchedCount === 0) {
      console.warn(`Warning: No seats found for eventId "${TARGET_EVENT_ID}" in database "${db.databaseName}". Ensure seat documents exist for this event.`);
    } else if (result.modifiedCount > 0) {
      console.log(`Successfully marked ${result.modifiedCount} seats as "occupied" for eventId "${TARGET_EVENT_ID}".`);
    } else {
      console.log(`Seats for eventId "${TARGET_EVENT_ID}" were found but none were modified (they might have already been "occupied").`);
    }

  } catch (err) {
    console.error("An error occurred:", err);
    if (err.message && err.message.includes('database name must be string')) {
        console.error("Hint: Ensure your MONGODB_URI includes the database name, e.g., mongodb+srv://.../yourDatabaseName?retryWrites=true");
    }
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

updateSeatStatuses();
