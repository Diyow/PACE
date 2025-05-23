import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// CREATE - Create a new seat or multiple seats
export async function POST(request) {
  try {
    const data = await request.json();
    const { eventId, seatNumbers, section, status } = data;
    
    // Validate required fields
    if (!eventId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Event ID and seat numbers array are required' },
        { status: 400 }
      );
    }
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if the event exists and belongs to the organizer
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId),
      ...(session.user.role === 'organizer' ? { organizerId: session.user.id } : {})
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or you do not have permission to add seats to this event' },
        { status: 404 }
      );
    }
    
    // Check if any of the seats already exist
    const existingSeats = await db.collection('seats')
      .find({
        eventId: new ObjectId(eventId),
        seatNumber: { $in: seatNumbers }
      })
      .toArray();
    
    if (existingSeats.length > 0) {
      const existingSeatNumbers = existingSeats.map(seat => seat.seatNumber);
      return NextResponse.json(
        { error: `Seats ${existingSeatNumbers.join(', ')} already exist for this event` },
        { status: 400 }
      );
    }
    
    // Create the seats
    const seats = seatNumbers.map(seatNumber => ({
      eventId: new ObjectId(eventId),
      seatNumber: seatNumber,
      section: section || 'General',
      status: status || 'available', // available, reserved, occupied
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const result = await db.collection('seats').insertMany(seats);
    
    return NextResponse.json({
      message: 'Seats created successfully',
      count: result.insertedCount
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating seats:', error);
    return NextResponse.json(
      { error: 'Failed to create seats' },
      { status: 500 }
    );
  }
}

// READ - Get all seats for an event
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const section = searchParams.get('section');
    const status = searchParams.get('status');
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Build the query based on provided parameters
    const query = { eventId: new ObjectId(eventId) };
    if (section) {
      query.section = section;
    }
    if (status) {
      query.status = status;
    }
    
    // Fetch seats from the database
    const seats = await db.collection('seats')
      .find(query)
      .sort({ section: 1, seatNumber: 1 })
      .toArray();
    
    return NextResponse.json(seats);
  } catch (error) {
    console.error('Error fetching seats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seats' },
      { status: 500 }
    );
  }
}