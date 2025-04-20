// app/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'organizer', 'attendee'], default: 'attendee' },
  // Add any other user-related fields you need here
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;