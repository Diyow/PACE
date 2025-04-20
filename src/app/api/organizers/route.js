import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const { fullName, email, phoneNumber, organizationName, username, password } = await req.json()

    const { db } = await connectToDatabase()

    // Check if username or email already exists
    const existingUser = await db.collection('users').findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user document
    const user = {
      fullName,
      email,
      phoneNumber,
      organizationName,
      username,
      password: hashedPassword,
      role: 'organizer',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Insert the user into the database
    await db.collection('users').insertOne(user)

    return NextResponse.json(
      { message: 'Organizer registered successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register organizer' },
      { status: 500 }
    )
  }
} 