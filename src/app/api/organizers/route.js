import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcrypt';
import { sendEmail, getOrganizerRegistrationEmail } from '@/utils/email';

export async function POST(request) {
  try {
    const data = await request.json();
    const { fullName, email, phoneNumber, organizationName, username, password } = data;
    
    // Validate required fields
    if (!fullName || !email || !phoneNumber || !organizationName || !username || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if username or email already exists
    const existingUser = await db.collection('users').findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with organizer role
    const user = {
      fullName,
      email,
      phoneNumber,
      username,
      password: hashedPassword,
      role: 'organizer',
      organizationName,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(user);
    const newUser = { ...user, _id: result.insertedId };
    
    // Send email notification
    try {
      const { subject, html } = getOrganizerRegistrationEmail({
        fullName,
        username,
        password,
        email,
        phoneNumber,
        organizationName
      });
      
      await sendEmail({
        to: email,
        subject,
        html
      });
    } catch (emailError) {
      // Log the error but don't fail the registration
      console.error('Failed to send registration email:', emailError);
      // You could store this in a queue for retry later
    }
    
    // Return success response without sensitive data
    return NextResponse.json({
      message: 'Organizer registered successfully',
      user: {
        id: newUser._id.toString(),
        fullName: newUser.fullName,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error registering organizer:', error);
    return NextResponse.json(
      { error: 'Failed to register organizer' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const organizers = await db.collection('users')
      .find({ role: 'organizer' })
      .project({
        _id: 1,
        fullName: 1,
        email: 1,
        phoneNumber: 1,
        organizationName: 1,
        status: 1,
        createdAt: 1
      })
      .toArray();
    
    return NextResponse.json(organizers);
  } catch (error) {
    console.error('Error fetching organizers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizers' },
      { status: 500 }
    );
  }
}