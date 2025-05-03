import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendEmail, getOrganizerRegistrationEmail } from '@/utils/email';

export async function POST(request) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { fullName, email, phoneNumber, organizationName, username, password } = data;
    
    // Validate required fields
    if (!fullName || !email || !phoneNumber || !organizationName || !username || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Check if username or email already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
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
    const newUser = await db.user.create({
      data: {
        fullName,
        email,
        phoneNumber,
        username,
        password: hashedPassword,
        role: 'organizer',
        organizer: {
          create: {
            organizationName
          }
        }
      }
    });
    
    // Send email notification
    try {
      const { subject, html } = getOrganizerRegistrationEmail({
        fullName,
        username,
        email,
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
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      }
    });
    
  } catch (error) {
    console.error('Error registering organizer:', error);
    return NextResponse.json(
      { error: 'Failed to register organizer' },
      { status: 500 }
    );
  }
}