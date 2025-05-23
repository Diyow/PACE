import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// READ - Get a single event by ID
export async function GET(request, context) { // Changed to context
  try {
    const paramsObject = await context.params; // Await context.params
    const eventId = paramsObject.eventId;
    
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
export async function PUT(request, context) { // Changed to context
  try {
    const paramsObject = await context.params; // Await context.params (This is line 46 now contextually)
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
    
    const organizerIdAsString = typeof existingEvent.organizerId === 'string'
        ? existingEvent.organizerId
        : existingEvent.organizerId.toString();

    if (session.user.role !== 'admin' && organizerIdAsString !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this event' },
        { status: 403 }
      );
    }
    
    const formData = await request.formData();
    
    const eventName = formData.get('eventName');
    const date = formData.get('date');
    const time = formData.get('time');
    const description = formData.get('description');
    const status = formData.get('status');
    
    const seatingLayoutString = formData.get('seatingLayout');
    const ticketCategoriesString = formData.get('ticketCategories');

    const seatingLayout = seatingLayoutString ? JSON.parse(seatingLayoutString) : existingEvent.seatingLayout || [];
    const ticketCategories = ticketCategoriesString ? JSON.parse(ticketCategoriesString) : existingEvent.ticketCategories || [];
    
    if (!eventName || !date || !time) {
      return NextResponse.json(
        { error: 'Event name, date, and time are required' },
        { status: 400 }
      );
    }
    
    let posterUrl = existingEvent.posterUrl;
    const posterFile = formData.get('poster'); // Use a different variable name for the file
    if (posterFile && posterFile.size > 0) {
      // Ensure posterFile.name is defined if you use it
      const fileName = typeof posterFile.name === 'string' ? posterFile.name : 'event-poster';
      posterUrl = '/images/event-posters/' + Date.now() + '-' + fileName;
    }
    
    const updatedEvent = {
      name: eventName,
      date: date,
      time: time,
      description: description || '',
      posterUrl: posterUrl,
      status: status || existingEvent.status,
      updatedAt: new Date(),
      seatingLayout: seatingLayout,
      ticketCategories: ticketCategories,
    };
    
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
      { error: 'Failed to update event: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete an event by ID
export async function DELETE(request, context) { // Changed to context
  try {
    const paramsObject = await context.params; // Await context.params
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
    
    const organizerIdAsString = typeof existingEvent.organizerId === 'string'
        ? existingEvent.organizerId
        : existingEvent.organizerId.toString();

    if (session.user.role !== 'admin' && organizerIdAsString !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this event' },
        { status: 403 }
      );
    }
    
    await db.collection('events').deleteOne({
      _id: new ObjectId(eventId)
    });
    
    return NextResponse.json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event: ' + error.message },
      { status: 500 }
    );
  }
}