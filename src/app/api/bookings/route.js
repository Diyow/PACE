import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// CREATE - Create a new booking
export async function POST(request) {
  try {
    const data = await request.json();
    const { eventId, ticketTypeIds, quantities } = data;
    
    // Validate required fields
    if (!eventId || !ticketTypeIds || !quantities || ticketTypeIds.length !== quantities.length) {
      return NextResponse.json(
        { error: 'Event ID, ticket type IDs, and quantities are required and must match' },
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
    
    // Validate ticket types and calculate total amount
    let totalAmount = 0;
    const ticketDetails = [];
    
    for (let i = 0; i < ticketTypeIds.length; i++) {
      const ticketTypeId = ticketTypeIds[i];
      const quantity = parseInt(quantities[i]);
      
      if (quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be greater than 0' },
          { status: 400 }
        );
      }
      
      const ticketType = await db.collection('ticketTypes').findOne({
        _id: new ObjectId(ticketTypeId),
        eventId: new ObjectId(eventId)
      });
      
      if (!ticketType) {
        return NextResponse.json(
          { error: `Ticket type with ID ${ticketTypeId} not found for this event` },
          { status: 404 }
        );
      }
      
      totalAmount += ticketType.price * quantity;
      
      ticketDetails.push({
        ticketTypeId: new ObjectId(ticketTypeId),
        category: ticketType.category,
        price: ticketType.price,
        quantity: quantity
      });
    }
    
    // Create the booking
    const booking = {
      eventId: new ObjectId(eventId),
      attendeeId: session.user.id,
      ticketDetails: ticketDetails,
      totalAmount: totalAmount,
      bookingDate: new Date(),
      paymentStatus: 'pending', // pending, completed, cancelled
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('bookings').insertOne(booking);
    
    // Create tickets for the booking
    const tickets = [];
    for (const detail of ticketDetails) {
      for (let i = 0; i < detail.quantity; i++) {
        tickets.push({
          bookingId: result.insertedId,
          eventId: new ObjectId(eventId),
          ticketTypeId: detail.ticketTypeId,
          attendeeId: session.user.id,
          status: 'reserved', // reserved, confirmed, cancelled
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    if (tickets.length > 0) {
      await db.collection('tickets').insertMany(tickets);
    }
    
    return NextResponse.json({
      message: 'Booking created successfully',
      bookingId: result.insertedId,
      totalAmount: totalAmount
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

// READ - Get all bookings for the current user
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
    const query = { attendeeId: session.user.id };
    if (eventId) {
      query.eventId = new ObjectId(eventId);
    }
    
    // For admin or organizer, allow fetching all bookings
    if (['admin', 'organizer'].includes(session.user.role)) {
      if (session.user.role === 'organizer') {
        // Organizers can only see bookings for their events
        if (eventId) {
          // Check if the event belongs to the organizer
          const event = await db.collection('events').findOne({
            _id: new ObjectId(eventId),
            organizerId: session.user.id
          });
          
          if (!event) {
            return NextResponse.json(
              { error: 'You do not have permission to view bookings for this event' },
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
        }
      } else if (session.user.role === 'admin') {
        // Admins can see all bookings or filter by eventId
        if (eventId) {
          query.eventId = new ObjectId(eventId);
        } else {
          // If no filters, remove the attendeeId filter for admins
          delete query.attendeeId;
        }
      }
    }
    
    // Fetch bookings from the database
    const bookings = await db.collection('bookings')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Fetch event details for each booking
    const bookingsWithEventDetails = await Promise.all(bookings.map(async (booking) => {
      const event = await db.collection('events').findOne(
        { _id: booking.eventId },
        { projection: { name: 1, date: 1, time: 1 } }
      );
      
      return {
        ...booking,
        event: event || { name: 'Unknown Event' }
      };
    }));
    
    return NextResponse.json(bookingsWithEventDetails);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}