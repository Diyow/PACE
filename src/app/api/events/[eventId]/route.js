import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// READ - Get a single event by ID
export async function GET(request, { params }) {
  try {
    const eventId = params.eventId;
    
    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId)
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// UPDATE - Update an event by ID
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
    
    // Parse the form data from the request
    const formData = await request.formData();
    
    // Extract updated event details
    const eventName = formData.get('eventName');
    const date = formData.get('date');
    const time = formData.get('time');
    const description = formData.get('description');
    const status = formData.get('status');
    
    // Validate required fields
    if (!eventName || !date || !time) {
      return NextResponse.json(
        { error: 'Event name, date, and time are required' },
        { status: 400 }
      );
    }
    
    // Handle poster file if provided
    let posterUrl = existingEvent.posterUrl;
    const poster = formData.get('poster');
    if (poster && poster.size > 0) {
      // In a real implementation, you would upload the file to a storage service
      // and store the URL. For this example, we'll just update the placeholder.
      posterUrl = '/images/event-posters/' + Date.now() + '-' + poster.name;
    }
    
    // Create the updated event object
    const updatedEvent = {
      name: eventName,
      date: date,
      time: time,
      description: description || '',
      posterUrl: posterUrl,
      status: status || existingEvent.status,
      updatedAt: new Date(),
    };
    
    // Update the event in the database
    await db.collection('events').updateOne(
      { _id: new ObjectId(eventId) },
      { $set: updatedEvent }
    );
    
    return NextResponse.json({
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an event by ID
export async function DELETE(request, { params }) {
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
        { error: 'You do not have permission to delete this event' },
        { status: 403 }
      );
    }
    
    // Delete the event from the database
    await db.collection('events').deleteOne({
      _id: new ObjectId(eventId)
    });
    
    return NextResponse.json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}