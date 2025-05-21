import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// CREATE - Create a new event
export async function POST(request) {
  try {
    // Parse the form data from the request
    const formData = await request.formData();
    
    // Extract event details
    const eventName = formData.get('eventName');
    const date = formData.get('date');
    const time = formData.get('time');
    const description = formData.get('description');
    
    // Validate required fields
    if (!eventName || !date || !time) {
      return NextResponse.json(
        { error: 'Event name, date, and time are required' },
        { status: 400 }
      );
    }
    
    // Get the current user session to identify the organizer
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Handle poster file if provided
    let posterUrl = null;
    const poster = formData.get('poster');
    if (poster && poster.size > 0) {
      // In a real implementation, you would upload the file to a storage service
      // and store the URL. For this example, we'll just store a placeholder.
      posterUrl = '/images/event-posters/' + Date.now() + '-' + poster.name;
    }
    
    // Create the event object
    const newEvent = {
      name: eventName,
      date: date,
      time: time,
      description: description || '',
      posterUrl: posterUrl,
      organizerId: session.user.id,
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add seating layout and ticket categories
      seatingLayout: formData.get('seatingLayout') ? JSON.parse(formData.get('seatingLayout')) : [],
      ticketCategories: formData.get('ticketCategories') ? JSON.parse(formData.get('ticketCategories')) : [],
    };
    
    // Insert the event into the database
    const result = await db.collection('events').insertOne(newEvent);
    
    return NextResponse.json({
      message: 'Event created successfully',
      eventId: result.insertedId,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// READ - Get all events or filter by query parameters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizerId');
    const status = searchParams.get('status');
    
    const { db } = await connectToDatabase();
    
    // Build the query based on provided parameters
    const query = {};
    if (organizerId) {
      query.organizerId = organizerId;
    }
    if (status) {
      query.status = status;
    }
    
    // Fetch events from the database
    const events = await db.collection('events')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}