import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// CREATE - Create a new ticket type
export async function POST(request) {
  try {
    const data = await request.json();
    const { eventId, category, price, maxTicketsPerCategory } = data;
    
    // Validate required fields
    if (!eventId || !category || !price) {
      return NextResponse.json(
        { error: 'Event ID, category, and price are required' },
        { status: 400 }
      );
    }
    
    // Get the current user session to verify organizer role
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
      organizerId: session.user.role === 'admin' ? undefined : session.user.id
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or you do not have permission to add ticket types to this event' },
        { status: 404 }
      );
    }
    
    // Create the ticket type
    const ticketType = {
      eventId: new ObjectId(eventId),
      category,
      price: parseFloat(price),
      maxTicketsPerCategory: maxTicketsPerCategory ? parseInt(maxTicketsPerCategory) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('ticketTypes').insertOne(ticketType);
    
    return NextResponse.json({
      message: 'Ticket type created successfully',
      ticketTypeId: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket type:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket type' },
      { status: 500 }
    );
  }
}

// READ - Get all ticket types for an event
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    const ticketTypes = await db.collection('ticketTypes')
      .find({ eventId: new ObjectId(eventId) })
      .sort({ price: 1 })
      .toArray();
    
    return NextResponse.json(ticketTypes);
  } catch (error) {
    console.error('Error fetching ticket types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket types' },
      { status: 500 }
    );
  }
}