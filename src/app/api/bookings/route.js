// src/app/api/bookings/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { sendEmail, getBookingConfirmationEmail } from '@/utils/email';

// CREATE - Create a new booking
export async function POST(request) {
  try {
    const data = await request.json();
    const { eventId, ticketTypeIds, quantities, paymentStatusOverride, _detailedSelectedSeats } = data; 
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    if (!_detailedSelectedSeats && (!ticketTypeIds || !quantities || ticketTypeIds.length !== quantities.length)) {
        return NextResponse.json({ error: 'Either detailed selected seats or ticket type IDs and quantities are required and must match' }, { status: 400 });
    }
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - User session is invalid or user ID is missing.' }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    const eventObjectId = new ObjectId(eventId); // Use a consistent ObjectId variable
    
    const event = await db.collection('events').findOne({ _id: eventObjectId });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    let totalAmount = 0;
    const ticketDetails = [];

    if (_detailedSelectedSeats && Array.isArray(_detailedSelectedSeats) && _detailedSelectedSeats.length > 0) {
        for (const seat of _detailedSelectedSeats) {
            const seatPrice = parseFloat(seat.price);
            if (isNaN(seatPrice)) {
                 return NextResponse.json({ error: `Invalid price for seat in category ${seat.category}` }, { status: 400 });
            }
            let derivedTicketTypeId = seat.ticketTypeId ? new ObjectId(seat.ticketTypeId) : null;
            if (!derivedTicketTypeId && seat.category) {
                const tt = await db.collection('ticketTypes').findOne({ eventId: eventObjectId, category: seat.category });
                if (tt) {
                    derivedTicketTypeId = tt._id;
                }
            }
            totalAmount += seatPrice;
            ticketDetails.push({
                ticketTypeId: derivedTicketTypeId,
                category: seat.category,
                price: seatPrice,
                quantity: 1,
                seatInfo: seat.seatInfo || `${seat.section}-${seat.row}${seat.seat}`
            });
        }
    } else if (ticketTypeIds && quantities) {
        for (let i = 0; i < ticketTypeIds.length; i++) {
            const ticketTypeIdStr = ticketTypeIds[i];
            const quantity = parseInt(quantities[i]);
            if (quantity <= 0) return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
            if (!ObjectId.isValid(ticketTypeIdStr)) return NextResponse.json({ error: `Invalid TicketType ID format: ${ticketTypeIdStr}` }, { status: 400 });
            const ticketType = await db.collection('ticketTypes').findOne({ _id: new ObjectId(ticketTypeIdStr), eventId: eventObjectId });
            if (!ticketType) return NextResponse.json({ error: `Ticket type with ID ${ticketTypeIdStr} not found` }, { status: 404 });
            totalAmount += parseFloat(ticketType.price) * quantity;
            ticketDetails.push({
                ticketTypeId: new ObjectId(ticketTypeIdStr),
                category: ticketType.category,
                price: parseFloat(ticketType.price),
                quantity: quantity
            });
        }
    } else {
        return NextResponse.json({ error: 'No ticket information provided' }, { status: 400 });
    }

    const booking = {
      eventId: eventObjectId,
      attendeeId: new ObjectId(session.user.id), 
      ticketDetails: ticketDetails, 
      totalAmount: totalAmount, 
      bookingDate: new Date(),
      paymentStatus: paymentStatusOverride || 'pending', 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('bookings').insertOne(booking);
    const bookingId = result.insertedId;
    
    const tickets = [];
    for (const detail of ticketDetails) {
      for (let i = 0; i < detail.quantity; i++) {
        tickets.push({
          bookingId: bookingId,
          eventId: eventObjectId,
          ticketTypeId: detail.ticketTypeId,
          attendeeId: new ObjectId(session.user.id),
          status: (booking.paymentStatus === 'completed') ? 'Confirmed' : 'Reserved', 
          seatInfo: detail.seatInfo || null, 
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    let ticketInsertResult;
    if (tickets.length > 0) {
      ticketInsertResult = await db.collection('tickets').insertMany(tickets);
    }

    if (booking.paymentStatus === 'completed' && _detailedSelectedSeats && Array.isArray(_detailedSelectedSeats) && _detailedSelectedSeats.length > 0) {
      for (const seat of _detailedSelectedSeats) {
        if (seat.section && seat.row && seat.seat !== undefined) {
          const queryCriteria = {
            eventId: eventObjectId,
            section: seat.section,
            row: seat.row, 
            seatNumber: String(seat.seat)
          };
          try {
            const updateResult = await db.collection('seats').updateOne(queryCriteria, { $set: { status: 'occupied', updatedAt: new Date() } });
            // Logging for seat update result can be added here if needed
          } catch (updateError) {
            console.error(`Error during seat update for Event ${eventId}, Seat ${seat.section}-${seat.row}${seat.seat}:`, updateError);
          }
        }
      }
    }
    
    // *** Remove user from waitlist upon successful purchase ***
    if (booking.paymentStatus === 'completed' && session?.user?.id) {
      try {
        const waitlistRemovalResult = await db.collection('waitlist').deleteOne({
          eventId: eventObjectId, 
          attendeeId: new ObjectId(session.user.id) 
        });
        if (waitlistRemovalResult.deletedCount > 0) {
          console.log(`User ${session.user.id} removed from waitlist for event ${eventId} after successful booking.`);
          // Optionally, update the waitlist entry status to 'converted' instead of deleting,
          // await db.collection('waitlist').updateOne(
          //   { eventId: eventObjectId, attendeeId: new ObjectId(session.user.id) },
          //   { $set: { status: 'converted', updatedAt: new Date() } }
          // );
        }
      } catch (waitlistError) {
        console.error(`Error removing user from waitlist after booking for event ${eventId}:`, waitlistError);
      }
    }
    // *** END OF WAITLIST REMOVAL LOGIC ***

    if (bookingId && tickets.length > 0 && booking.paymentStatus === 'completed') {
      // ... (existing email sending logic) ...
      let attendeeEmail = session.user.email;
      let attendeeName = session.user.name || 'Valued Customer';
      if (!attendeeEmail || (session.user.name && !attendeeName)) {
        const attendeeUser = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) });
        attendeeEmail = attendeeEmail || attendeeUser?.email;
        attendeeName = attendeeName || attendeeUser?.fullName || 'Valued Customer';
      }
      if (attendeeEmail) {
        const eventDetailsForEmail = await db.collection('events').findOne({ _id: eventObjectId }, { projection: { name: 1, date: 1, time: 1 } });
        const emailData = {
            bookingId: bookingId.toString(),
            eventName: eventDetailsForEmail.name,
            eventDate: new Date(`${eventDetailsForEmail.date}T${eventDetailsForEmail.time || '00:00:00'}`).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
            tickets: ticketDetails.map(td => ({
                category: td.category, quantity: td.quantity, price: td.price, seatInfo: td.seatInfo
            })),
            totalAmount: totalAmount, attendeeName: attendeeName,
        };
        try {
            const { subject, html } = getBookingConfirmationEmail(emailData);
            await sendEmail({ to: attendeeEmail, subject, html });
        } catch (emailError) {
            console.error('Failed to send booking confirmation email:', emailError);
        }
      }
    }
    
    return NextResponse.json({
      message: 'Booking created successfully',
      bookingId: bookingId.toString(),
      totalAmount: totalAmount,
      ticketsCreated: ticketInsertResult ? ticketInsertResult.insertedCount : 0
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking', details: error.message }, { status: 500 });
  }
}

// GET function (ensure it stringifies ObjectIds for client)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json( { error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    const { db } = await connectToDatabase();
    
    const query = { attendeeId: new ObjectId(session.user.id) }; 
    if (eventId) {
      if (!ObjectId.isValid(eventId)) return NextResponse.json({ error: 'Invalid Event ID format for query' }, { status: 400 });
      query.eventId = new ObjectId(eventId);
    }
    
    if (['admin', 'organizer'].includes(session.user.role)) {
      if (session.user.role === 'organizer') {
        const organizerEvents = await db.collection('events')
            .find({ organizerId: new ObjectId(session.user.id) }) 
            .project({ _id: 1 })
            .toArray();
        const eventIds = organizerEvents.map(event => event._id);
        if (eventId) { 
            if (!eventIds.some(orgEventId => orgEventId.equals(query.eventId))) { 
                 return NextResponse.json({ error: 'You do not have permission to view bookings for this event' }, { status: 403 });
            }
        } else { 
            query.eventId = { $in: eventIds };
        }
        delete query.attendeeId; 
      } else if (session.user.role === 'admin') {
        delete query.attendeeId; 
        if (eventId) {
            // query.eventId is already set
        }
      }
    }
    
    const bookings = await db.collection('bookings').find(query).sort({ createdAt: -1 }).toArray();
    
    const bookingsWithEventDetails = await Promise.all(bookings.map(async (booking) => {
      const event = await db.collection('events').findOne(
        { _id: booking.eventId }, 
        { projection: { name: 1, date: 1, time: 1, posterUrl: 1 } }
      );
      const sanitizedTicketDetails = booking.ticketDetails.map(td => ({
          ...td,
          ticketTypeId: td.ticketTypeId ? td.ticketTypeId.toString() : null
      }));
      return {
        ...booking,
        _id: booking._id.toString(),
        eventId: booking.eventId.toString(),
        attendeeId: booking.attendeeId.toString(),
        ticketDetails: sanitizedTicketDetails,
        event: event ? { ...event, _id: event._id.toString() } : { name: 'Unknown Event', date: '', time: '', posterUrl: null }
      };
    }));
    
    return NextResponse.json(bookingsWithEventDetails);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings', details: error.message }, { status: 500 });
  }
}
