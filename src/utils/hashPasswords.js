import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

async function hashExistingPasswords() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find all users with unhashed passwords
    const users = await usersCollection.find({}).toArray();

    for (const user of users) {
      // Skip if password is already hashed (bcrypt hashes start with $2a$)
      if (user.password.startsWith('$2a$')) {
        console.log(`Password for user ${user.username} is already hashed`);
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Update the user with the hashed password
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );

      console.log(`Password hashed for user ${user.username}`);
    }

    console.log('Password hashing completed');
    client.close();
  } catch (error) {
    console.error('Error hashing passwords:', error);
  }
}

// Run the function
hashExistingPasswords(); 