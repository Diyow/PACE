import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// CREATE - Create a new ticket
export async function POST(request) {
  try {
    const data = await request.json();
    const { bookingId, eventId, ticketTypeId, status } = data;
    
    // Validate required fields
    if (!bookingId || !eventId || !ticketTypeId) {
      return NextResponse.json(
        { error: 'Booking ID, Event ID, and Ticket Type ID are required' },
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
    
    // Check if the booking exists
    const booking = await db.collection('bookings').findOne({
      _id: new ObjectId(bookingId)
    });
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Create the ticket
    const ticket = {
      bookingId: new ObjectId(bookingId),
      eventId: new ObjectId(eventId),
      ticketTypeId: new ObjectId(ticketTypeId),
      attendeeId: session.user.id,
      status: status || 'reserved', // reserved, confirmed, cancelled
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('tickets').insertOne(ticket);
    
    return NextResponse.json({
      message: 'Ticket created successfully',
      ticketId: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

// READ - Get all tickets for the current user or by query parameters
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
    const bookingId = searchParams.get('bookingId');
    const status = searchParams.get('status');
    
    const { db } = await connectToDatabase();
    
    // Build the query based on provided parameters
    const query = { attendeeId: session.user.id };
    if (eventId) {
      query.eventId = new ObjectId(eventId);
    }
    if (bookingId) {
      query.bookingId = new ObjectId(bookingId);
    }
    if (status) {
      query.status = status;
    }
    
    // For admin or organizer, allow fetching all tickets
    if (['admin', 'organizer'].includes(session.user.role)) {
      if (session.user.role === 'organizer') {
        // Organizers can only see tickets for their events
        if (eventId) {
          // Check if the event belongs to the organizer
          const event = await db.collection('events').findOne({
            _id: new ObjectId(eventId),
            organizerId: session.user.id
          });
          
          if (!event) {
            return NextResponse.json(
              { error: 'You do not have permission to view tickets for this event' },
              { status: 403 }
            );
          }
        } else {
          // If no eventId provided, get all events by this organizer
          const organizerEvents = await db.collection('events')
            .find({ organizerId: session.user.id })
            .project({ _id: 1 })
            .toArray();
          
          const eventIds = organizerEvents.map(event => event._id);
          query.eventId = { $in: eventIds };
          delete query.attendeeId; // Remove attendee filter for organizers
        }
      } else if (session.user.role === 'admin') {
        // Admins can see all tickets
        delete query.attendeeId; // Remove attendee filter for admins
      }
    }
    
    // Fetch tickets from the database
    const tickets = await db.collection('tickets')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Fetch event and ticket type details for each ticket
    const ticketsWithDetails = await Promise.all(tickets.map(async (ticket) => {
      const event = await db.collection('events').findOne(
        { _id: ticket.eventId },
        { projection: { name: 1, date: 1, time: 1 } }
      );
      
      const ticketType = await db.collection('ticketTypes').findOne(
        { _id: ticket.ticketTypeId },
        { projection: { category: 1, price: 1 } }
      );
      
      return {
        ...ticket,
        event: event || { name: 'Unknown Event' },
        ticketType: ticketType || { category: 'Unknown Category' }
      };
    }));
    
    return NextResponse.json(ticketsWithDetails);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}