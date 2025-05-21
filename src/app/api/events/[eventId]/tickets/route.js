import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// UPDATE - Update ticket and seating information for an event
export async function PUT(request, { params }) {
  try {
    const eventId = params.eventId;
    
    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }
    
    // Get the current user session to verify ownership
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if the event exists and belongs to the current user
    const existingEvent = await db.collection('events').findOne({
      _id: new ObjectId(eventId)
    });
    
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is the organizer of the event
    if (existingEvent.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this event' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const data = await request.json();
    const { seatingLayout, ticketCategories } = data;
    
    // Update only the ticket and seating information
    await db.collection('events').updateOne(
      { _id: new ObjectId(eventId) },
      { $set: {
        seatingLayout,
        ticketCategories,
        updatedAt: new Date()
      }}
    );
    
    return NextResponse.json({
      message: 'Ticket and seating information updated successfully'
    });
  } catch (error) {
    console.error('Error updating ticket information:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket information' },
      { status: 500 }
    );
  }
}