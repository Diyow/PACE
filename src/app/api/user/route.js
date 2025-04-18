import { NextResponse } from 'next/server';
 import { cookies } from 'next/headers';
 import mongoose from 'mongoose';
 import User from '../../models/User'; // Adjust the path to your User model

 export async function GET(req) {
  try {
  await mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  });

  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth');

  if (!authCookie) {
  return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
  const session = JSON.parse(authCookie.value);
  if (!session || !session.userId) {
  return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const user = await User.findById(session.userId).select('-password'); // Exclude the password field

  if (!user) {
  return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  return NextResponse.json({ role: user.role, username: user.username, userId: user._id.toString() });

  } catch (error) {
  console.error('Error parsing session cookie:', error);
  return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  } catch (error) {
  console.error('Error in /api/user:', error);
  return new NextResponse(JSON.stringify({ message: 'Server error' }), { status: 500 });
  } finally {
  await mongoose.disconnect();
  }
 }