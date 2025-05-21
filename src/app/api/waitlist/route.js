import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// CREATE - Add a user to the waitlist for an event
export async function POST(request) {
  try {
    const data = await request.json();
    const { eventId, ticketTypeId } = data;
    
    // Validate required fields
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if the event exists
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId)
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check if user is already on the waitlist for this event
    const existingWaitlist = await db.collection('waitlist').findOne({
      eventId: new ObjectId(eventId),
      attendeeId: session.user.id
    });
    
    if (existingWaitlist) {
      return NextResponse.json(
        { error: 'You are already on the waitlist for this event' },
        { status: 400 }
      );
    }
    
    // Create the waitlist entry
    const waitlistEntry = {
      eventId: new ObjectId(eventId),
      ticketTypeId: ticketTypeId ? new ObjectId(ticketTypeId) : null,
      attendeeId: session.user.id,
      status: 'waiting', // waiting, notified, converted
      joinedAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('waitlist').insertOne(waitlistEntry);
    
    return NextResponse.json({
      message: 'Added to waitlist successfully',
      waitlistId: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to waitlist' },
      { status: 500 }
    );
  }
}

// READ - Get waitlist entries for an event or for the current user
export async function GET(request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    const { db } = await connectToDatabase();
    
    // Build the query based on provided parameters
    const query = {};
    
    // Regular users can only see their own waitlist entries
    if (session.user.role === 'user') {
      query.attendeeId = session.user.id;
      if (eventId) {
        query.eventId = new ObjectId(eventId);
      }
    }
    // Organizers can see waitlist entries for their events
    else if (session.user.role === 'organizer') {
      if (eventId) {
        // Check if the event belongs to the organizer
        const event = await db.collection('events').findOne({
          _id: new ObjectId(eventId),
          organizerId: session.user.id
        });
        
        if (!event) {
          return NextResponse.json(
            { error: 'You do not have permission to view waitlist for this event' },
            { status: 403 }
          );
        }
        query.eventId = new ObjectId(eventId);
      } else {
        // If no eventId provided, get all events by this organizer
        const organizerEvents = await db.collection('events')
          .find({ organizerId: session.user.id })
          .project({ _id: 1 })
          .toArray();
        
        const eventIds = organizerEvents.map(event => event._id);
        query.eventId = { $in: eventIds };
      }
    }
    // Admins can see all waitlist entries or filter by eventId
    else if (session.user.role === 'admin') {
      if (eventId) {
        query.eventId = new ObjectId(eventId);
      }
    }
    
    // Fetch waitlist entries from the database
    const waitlistEntries = await db.collection('waitlist')
      .find(query)
      .sort({ joinedAt: 1 }) // Sort by join date (first come, first served)
      .toArray();
    
    // Fetch additional details for each waitlist entry
    const waitlistWithDetails = await Promise.all(waitlistEntries.map(async (entry) => {
      const event = await db.collection('events').findOne(
        { _id: entry.eventId },
        { projection: { name: 1, date: 1, time: 1 } }
      );
      
      const attendee = await db.collection('users').findOne(
        { _id: new ObjectId(entry.attendeeId) },
        { projection: { fullName: 1, email: 1 } }
      );
      
      return {
        ...entry,
        event: event || { name: 'Unknown Event' },
        attendee: attendee || { fullName: 'Unknown User' }
      };
    }));
    
    return NextResponse.json(waitlistWithDetails);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}