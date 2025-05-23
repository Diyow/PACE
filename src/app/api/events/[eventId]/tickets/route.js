// src/app/api/events/[eventId]/tickets/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request, context) {
  try {
    const paramsObject = await context.params; 
    const eventId = paramsObject.eventId;

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
    
    const organizerIdAsString = existingEvent.organizerId.toString();

    if (session.user.role !== 'admin' && organizerIdAsString !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this event' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const { seatingLayout, ticketCategories } = data; // seatingLayout is the event's seating structure
    
    // Update the event document first
    await db.collection('events').updateOne(
      { _id: new ObjectId(eventId) },
      { $set: {
        seatingLayout, // Save the new layout definition to the event
        ticketCategories,
        updatedAt: new Date()
      }}
    );

    // *** ADDED: Synchronize 'seats' collection with the new seatingLayout ***
    if (seatingLayout && Array.isArray(seatingLayout)) {
      // 1. Clear existing seats for this event
      try {
        const deletionResult = await db.collection('seats').deleteMany({ eventId: new ObjectId(eventId) });
        console.log(`Cleared ${deletionResult.deletedCount} existing seat documents for event ${eventId} before update.`);
      } catch (deletionError) {
        console.error(`Error clearing existing seats for event ${eventId}:`, deletionError);
        // Consider if this should be a hard error or just a warning
      }

      // 2. Create new seat documents based on the updated seatingLayout
      const seatsToCreateInCollection = [];
      for (const sectionLayout of seatingLayout) { // sectionLayout is from the request data
        if (sectionLayout.rows && typeof sectionLayout.rows === 'object') {
          for (const rowKey in sectionLayout.rows) {
            if (Array.isArray(sectionLayout.rows[rowKey])) {
              for (const seatObj of sectionLayout.rows[rowKey]) {
                seatsToCreateInCollection.push({
                  eventId: new ObjectId(eventId),
                  section: sectionLayout.section,
                  row: rowKey,
                  seatNumber: String(seatObj.number), 
                  status: 'available',
                  createdAt: new Date(), // Or preserve if merging logic was more complex
                  updatedAt: new Date()
                });
              }
            }
          }
        }
      }
      if (seatsToCreateInCollection.length > 0) {
        try {
          await db.collection('seats').insertMany(seatsToCreateInCollection, { ordered: false });
          console.log(`Re-created ${seatsToCreateInCollection.length} seat documents for event ${eventId} after layout update.`);
        } catch (seatCreationError) {
          console.error(`Error re-creating seat documents for event ${eventId}:`, seatCreationError);
        }
      }
    }
    // *** END OF ADDED LOGIC FOR SEAT SYNCHRONIZATION ***
    
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