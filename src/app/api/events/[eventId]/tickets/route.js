import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// UPDATE - Update ticket and seating information for an event
export async function PUT(request, context) { // Using context as the second argument
  try {
    // Await context.params because the console log shows it's a Promise
    const paramsObject = await context.params; 
    const eventId = paramsObject.eventId; // Access eventId from the resolved object

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    const existingEvent = await db.collection('events').findOne({
      _id: new ObjectId(eventId)
    });
    
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    const organizerIdAsString = typeof existingEvent.organizerId === 'string' 
      ? existingEvent.organizerId 
      : existingEvent.organizerId.toString();

    if (session.user.role !== 'admin' && organizerIdAsString !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this event' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const { seatingLayout, ticketCategories } = data;
    
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
    let errorMessage = 'Failed to update ticket information';
    if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}