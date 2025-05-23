// src/app/api/tickets/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// CREATE - Create a new ticket
export async function POST(request) {
  try {
    const data = await request.json();
    // ticketTypeId from request body will be ignored for DB insertion, always set to null
    const { bookingId, eventId, /* ticketTypeId (ignored) */ status, seatInfo } = data; 
    
    if (!bookingId || !eventId ) {
      return NextResponse.json(
        { error: 'Booking ID and Event ID are required' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Optional: Validate bookingId belongs to the current user if that's a business rule here
    const booking = await db.collection('bookings').findOne({
      _id: new ObjectId(bookingId),
      attendeeId: new ObjectId(session.user.id) 
    });
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied for the current user' },
        { status: 404 } // Or 403 if booking exists but not for user
      );
    }
    
    const ticket = {
      bookingId: new ObjectId(bookingId),
      eventId: new ObjectId(eventId),
      ticketTypeId: null, // Explicitly setting to null as requested
      attendeeId: new ObjectId(session.user.id),
      status: status || 'reserved', 
      seatInfo: seatInfo || null, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('tickets').insertOne(ticket);
    
    return NextResponse.json({
      message: 'Ticket created successfully (with ticketTypeId as null)',
      ticketId: result.insertedId
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ticket:', error);
    if (error.message.includes("Argument passed in must be a single String of 12 bytes or a string of 24 hex characters")) {
        return NextResponse.json({ error: 'Invalid ID format provided for booking or event.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create ticket', details: error.message },
      { status: 500 }
    );
  }
}

// READ - Get all tickets for the current user or by query parameters
// This GET function (from your last provided version) already handles null ticketTypeId
// by attempting to derive category/price from seatInfo and event.seatingLayout.
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions); 
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const eventIdParam = searchParams.get('eventId');
    const bookingIdParam = searchParams.get('bookingId');
    let ticketStatusParam = searchParams.get('status');
    
    const { db } = await connectToDatabase();
    
    const query = { attendeeId: new ObjectId(session.user.id) };
    
    if (eventIdParam) {
      if (!ObjectId.isValid(eventIdParam)) return NextResponse.json({ error: 'Invalid Event ID format' }, { status: 400 });
      query.eventId = new ObjectId(eventIdParam);
    }
    if (bookingIdParam) {
      if (!ObjectId.isValid(bookingIdParam)) return NextResponse.json({ error: 'Invalid Booking ID format' }, { status: 400 });
      query.bookingId = new ObjectId(bookingIdParam);
    }
    
    if (ticketStatusParam) {
      if (ticketStatusParam.toLowerCase() === 'confirmed') {
        query.status = "Confirmed"; 
      } else if (ticketStatusParam.toLowerCase() === 'reserved') {
        query.status = "Reserved"; 
      } else {
        query.status = ticketStatusParam; 
      }
    }
    
    if (['admin', 'organizer'].includes(session.user.role)) {
      if (session.user.role === 'organizer') {
        const organizerEvents = await db.collection('events')
          .find({ organizerId: new ObjectId(session.user.id) }) 
          .project({ _id: 1 })
          .toArray();
        
        const organizerEventIds = organizerEvents.map(event => event._id);

        if (eventIdParam) { 
          if (!organizerEventIds.some(id => id.equals(query.eventId))) {
            return NextResponse.json(
              { error: 'You do not have permission to view tickets for this event' },
              { status: 403 }
            );
          }
          delete query.attendeeId;
        } else {
          query.eventId = { $in: organizerEventIds };
          delete query.attendeeId; 
        }
      } else if (session.user.role === 'admin') {
        delete query.attendeeId; 
      }
    }
    
    const tickets = await db.collection('tickets')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    const ticketsWithDetails = await Promise.all(tickets.map(async (ticket) => {
      const event = await db.collection('events').findOne(
        { _id: ticket.eventId }, 
        { projection: { name: 1, date: 1, time: 1, posterUrl: 1, seatingLayout: 1, organizerId: 1, ticketCategories: 1 } } // Added ticketCategories to event
      );
      
      // Initialize default ticketType, potentially using event's first ticket category price as default
      let defaultPrice = 0;
      if (event && event.ticketCategories && event.ticketCategories.length > 0) {
          defaultPrice = parseFloat(event.ticketCategories[0].price) || 0;
      }
      let ticketType = { category: 'General Admission', price: defaultPrice }; 


      if (ticket.ticketTypeId && ObjectId.isValid(ticket.ticketTypeId.toString())) { 
        const foundTicketType = await db.collection('ticketTypes').findOne(
          { _id: new ObjectId(ticket.ticketTypeId.toString()) }, 
          { projection: { category: 1, price: 1 } }
        );
        if (foundTicketType) {
          ticketType = { // Ensure price is a number here for calculations if needed
              category: foundTicketType.category,
              price: parseFloat(foundTicketType.price) || 0,
              _id: foundTicketType._id // Keep original _id if present
          };
        } else { 
             // Fallback if ticketTypeId is valid but no document found (should ideally not happen)
             // Try deriving from seatInfo
             if(ticket.seatInfo && event?.seatingLayout) { 
                 const parts = ticket.seatInfo.split('-');
                 const sectionNameFromSeat = parts[0];
                 const eventLayout = Array.isArray(event.seatingLayout) ? event.seatingLayout : [];
                 const sectionInLayout = eventLayout.find(s => s.section === sectionNameFromSeat);
                 if (sectionInLayout?.assignedCategoryName) {
                     const categoryBasedTicketType = await db.collection('ticketTypes').findOne(
                         { eventId: ticket.eventId, category: sectionInLayout.assignedCategoryName },
                         { projection: { category: 1, price: 1 } }
                     );
                     if (categoryBasedTicketType) {
                        ticketType = {
                            category: categoryBasedTicketType.category,
                            price: parseFloat(categoryBasedTicketType.price) || defaultPrice,
                            _id: categoryBasedTicketType._id
                        };
                     } else {
                        ticketType.category = sectionInLayout.assignedCategoryName; 
                        // Price remains default or first category price from event
                     }
                 } else {
                    ticketType.category = sectionNameFromSeat; 
                 }
            } else {
                 ticketType.category = "Standard Ticket"; 
            }
        }
      } else if (ticket.seatInfo && event?.seatingLayout) { // ticketTypeId is null, try to use seatInfo
            const parts = ticket.seatInfo.split('-');
            const sectionNameFromSeat = parts[0];
            const eventLayout = Array.isArray(event.seatingLayout) ? event.seatingLayout : [];
            const sectionInLayout = eventLayout.find(s => s.section === sectionNameFromSeat);
            if (sectionInLayout?.assignedCategoryName) {
                 const categoryBasedTicketType = await db.collection('ticketTypes').findOne(
                     { eventId: ticket.eventId, category: sectionInLayout.assignedCategoryName },
                     { projection: { category: 1, price: 1 } }
                 );
                 if (categoryBasedTicketType) {
                    ticketType = {
                        category: categoryBasedTicketType.category,
                        price: parseFloat(categoryBasedTicketType.price) || defaultPrice,
                        _id: categoryBasedTicketType._id
                    };
                 } else {
                    ticketType.category = sectionInLayout.assignedCategoryName;
                 }
            } else {
               ticketType.category = sectionNameFromSeat || "Standard Ticket";
            }
      } // If ticketTypeId is null and no seatInfo/layout, the initial default ticketType is used.


      return {
        ...ticket,
        _id: ticket._id.toString(), 
        eventId: ticket.eventId.toString(),
        attendeeId: ticket.attendeeId.toString(),
        ticketTypeId: ticket.ticketTypeId ? ticket.ticketTypeId.toString() : null,
        event: event ? { 
            ...event, 
            _id: event._id.toString(), 
            organizerId: event.organizerId ? event.organizerId.toString() : null 
        } : { name: 'Unknown Event', date: '', time: '' },
        ticketType: { 
            category: ticketType.category || "Unknown",
            price: parseFloat(ticketType.price || 0).toFixed(2), 
            _id: ticketType._id ? ticketType._id.toString() : null 
        }
      };
    }));
    
    return NextResponse.json(ticketsWithDetails);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error.message },
      { status: 500 }
    );
  }
}