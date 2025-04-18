import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Joi from 'joi';
import { serialize } from 'cookie';

// 1. Define the User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'organizer', 'attendee'], default: 'attendee' },
  // ... other fields
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// 2. Validation Schema for Login
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export async function POST(req) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const { error, value } = loginSchema.validate(await req.json());

    if (error) {
      return NextResponse.json({ message: error.details[0].message }, { status: 400 });
    }

    const { username, password } = value;

    // 3. Find the user by username
    const user = await User.findOne({ username });

    // 4. Verify Password (Plain Text Comparison - FOR DEVELOPMENT ONLY!)
    if (user) {
      if (password === user.password) { //  <---  Plain text comparison
        // 5. Create a simple session
        const session = { userId: user._id.toString(), role: user.role };
        const sessionStr = JSON.stringify(session);

        // 6. Set the HTTP-only cookie
        const cookie = serialize('auth', sessionStr, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });

        return NextResponse.json({ message: 'Login successful' }, {
          status: 200,
          headers: { 'Set-Cookie': cookie },
        });
      } else {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  } finally {
    await mongoose.disconnect();
  }
}