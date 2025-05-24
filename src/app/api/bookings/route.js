// src/app/api/bookings/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { sendEmail, getBookingConfirmationEmail } from '@/utils/email';

export async function POST(request) {
  console.log("[API/Bookings] Received POST request");
  try {
    const data = await request.json();
    console.log("[API/Bookings] Request data:", JSON.stringify(data, null, 2));

    const { 
        eventId, 
        paymentStatusOverride, 
        _detailedSelectedSeats,
        totalAmount: clientGrossTotalAmount, // This is the original total amount BEFORE discount from payment page
        appliedPromoCode,
        discountAppliedAmount 
    } = data; 
    
    if (!eventId) {
      console.error("[API/Bookings] Error: Event ID is required");
      return NextResponse.json({ error: 'Event ID is required', details: "eventId was not provided in the request body." }, { status: 400 });
    }
    if (!ObjectId.isValid(eventId)) {
        console.error("[API/Bookings] Error: Invalid Event ID format", eventId);
        return NextResponse.json({ error: 'Invalid Event ID format', details: `Received eventId: ${eventId}` }, { status: 400 });
    }

    const hasDetailedSeats = _detailedSelectedSeats && Array.isArray(_detailedSelectedSeats) && _detailedSelectedSeats.length > 0;
    
    if (!hasDetailedSeats) {
        console.error("[API/Bookings] Error: _detailedSelectedSeats is required.");
        return NextResponse.json({ error: '_detailedSelectedSeats is required for booking.', details: "Missing selected seat data." }, { status: 400 });
    }
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      console.error("[API/Bookings] Error: Unauthorized - User session is invalid or user ID is missing.");
      return NextResponse.json({ error: 'Unauthorized - User session is invalid or user ID is missing.', details: "No valid session." }, { status: 401 });
    }
    console.log("[API/Bookings] Session user ID:", session.user.id);
    
    const { db } = await connectToDatabase();
    const eventObjectId = new ObjectId(eventId);
    
    const event = await db.collection('events').findOne({ _id: eventObjectId });
    if (!event) {
      console.error(`[API/Bookings] Error: Event not found for ID: ${eventId}`);
      return NextResponse.json({ error: 'Event not found', details: `Event with ID ${eventId} does not exist.` }, { status: 404 });
    }
    console.log("[API/Bookings] Found event:", event.name);
    
    let calculatedGrossTotal = 0;
    const ticketDetails = []; 

    if (hasDetailedSeats) {
        console.log("[API/Bookings] Processing _detailedSelectedSeats:", _detailedSelectedSeats);
        for (const seat of _detailedSelectedSeats) {
            if (!seat.price || isNaN(parseFloat(seat.price))) {
                console.error(`[API/Bookings] Error: Invalid price for seat in category ${seat.category}. Price: ${seat.price}`);
                return NextResponse.json({ error: `Invalid price for seat in category ${seat.category}`, details: `Seat data: ${JSON.stringify(seat)}` }, { status: 400 });
            }
            const seatPrice = parseFloat(seat.price);
            calculatedGrossTotal += seatPrice;
            
            let derivedTicketTypeId = null;
            if (seat.ticketTypeId && ObjectId.isValid(seat.ticketTypeId)) {
                derivedTicketTypeId = new ObjectId(seat.ticketTypeId);
            } else if (seat.ticketTypeId) {
                 console.warn(`[API/Bookings] seat.ticketTypeId '${seat.ticketTypeId}' is present but invalid. Will try to derive by category name if possible.`);
            }
            
            let seatCategoryName = seat.category;

            if (!derivedTicketTypeId && seatCategoryName) {
                const matchingCategoryFromEvent = event.ticketCategories?.find(tc => tc.category === seatCategoryName);
                if (matchingCategoryFromEvent && matchingCategoryFromEvent._id && ObjectId.isValid(matchingCategoryFromEvent._id.toString())) {
                    derivedTicketTypeId = new ObjectId(matchingCategoryFromEvent._id.toString());
                } else {
                    console.warn(`[API/Bookings] Warning: Could not derive ticketTypeId for seat category: ${seatCategoryName} from event.ticketCategories.`);
                }
            } else if (!seatCategoryName && derivedTicketTypeId) {
                const matchingCategoryFromEvent = event.ticketCategories?.find(tc => tc._id.equals(derivedTicketTypeId));
                if (matchingCategoryFromEvent) seatCategoryName = matchingCategoryFromEvent.category;
            }
            if (!seatCategoryName) seatCategoryName = "General"; 

            ticketDetails.push({
                ticketTypeId: derivedTicketTypeId,
                category: seatCategoryName,
                price: seatPrice, // Original price of this ticket type/seat
                quantity: 1, 
                seatInfo: seat.seatInfo || `${seat.section}-${seat.row}${seat.seat}`
            });
        }
    }
    
    if (Math.abs(calculatedGrossTotal - (clientGrossTotalAmount || 0)) > 0.01) {
        console.warn(`[API/Bookings] Discrepancy in gross total. Client sent: ${clientGrossTotalAmount}, Server calculated: ${calculatedGrossTotal}. Using server calculated.`);
    }
    const finalGrossAmount = calculatedGrossTotal;
    const finalDiscountAmount = discountAppliedAmount && !isNaN(parseFloat(discountAppliedAmount)) ? parseFloat(discountAppliedAmount) : 0;
    const finalNetAmount = Math.max(0, finalGrossAmount - finalDiscountAmount); // Ensure net amount is not negative

    console.log(`[API/Bookings] Gross: ${finalGrossAmount}, Discount: ${finalDiscountAmount}, Net: ${finalNetAmount}`);
    console.log("[API/Bookings] Constructed ticketDetails:", JSON.stringify(ticketDetails, null, 2));

    const booking = {
      eventId: eventObjectId,
      attendeeId: new ObjectId(session.user.id), 
      ticketDetails: ticketDetails, 
      grossAmount: finalGrossAmount,
      discountAppliedAmount: finalDiscountAmount,
      promoCodeUsed: appliedPromoCode || null,
      totalAmount: finalNetAmount, // This is the NET amount paid
      bookingDate: new Date(),
      paymentStatus: paymentStatusOverride || 'pending', 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('bookings').insertOne(booking);
    const bookingId = result.insertedId;
    console.log("[API/Bookings] Booking created with ID:", bookingId.toString());
    
    const ticketsToInsert = [];
    for (const detail of ticketDetails) {
      for (let i = 0; i < detail.quantity; i++) {
        ticketsToInsert.push({
          bookingId: bookingId,
          eventId: eventObjectId,
          ticketTypeId: detail.ticketTypeId,
          category: detail.category, 
          attendeeId: new ObjectId(session.user.id),
          status: (booking.paymentStatus === 'completed') ? 'Confirmed' : 'Reserved', 
          seatInfo: detail.seatInfo || null, 
          pricePaid: detail.price, // Store original price of this ticket
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    let ticketInsertResult;
    if (ticketsToInsert.length > 0) {
      ticketInsertResult = await db.collection('tickets').insertMany(ticketsToInsert);
      console.log(`[API/Bookings] Inserted ${ticketInsertResult.insertedCount} tickets. Sample ticket:`, ticketsToInsert[0]);
    }

    if (booking.paymentStatus === 'completed' && hasDetailedSeats) {
      console.log("[API/Bookings] Updating seat statuses to 'occupied'.");
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
            console.log(`[API/Bookings] Seat update for ${seat.section}-${seat.row}${seat.seat}: Matched ${updateResult.matchedCount}, Modified ${updateResult.modifiedCount}`);
          } catch (updateError) {
            console.error(`[API/Bookings] Error during seat update for Event ${eventId}, Seat ${seat.section}-${seat.row}${seat.seat}:`, updateError);
          }
        } else {
            console.warn("[API/Bookings] Seat object missing section, row, or seat number for status update:", seat);
        }
      }
    }
    
    if (booking.paymentStatus === 'completed' && session?.user?.id) {
      try {
        const waitlistRemovalResult = await db.collection('waitlist').deleteOne({
          eventId: eventObjectId, 
          attendeeId: new ObjectId(session.user.id) 
        });
        if (waitlistRemovalResult.deletedCount > 0) {
          console.log(`[API/Bookings] User ${session.user.id} removed from waitlist for event ${eventId}.`);
        }
      } catch (waitlistError) {
        console.error(`[API/Bookings] Error removing user from waitlist for event ${eventId}:`, waitlistError);
      }
    }

    if (bookingId && ticketsToInsert.length > 0 && booking.paymentStatus === 'completed') {
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
            totalAmount: booking.totalAmount, // Use the net amount from the booking document
            attendeeName: attendeeName,
        };
        try {
            console.log("[API/Bookings] Attempting to send booking confirmation email to:", attendeeEmail);
            const { subject, html } = getBookingConfirmationEmail(emailData);
            await sendEmail({ to: attendeeEmail, subject, html });
            console.log("[API/Bookings] Booking confirmation email sent successfully.");
        } catch (emailError) {
            console.error('[API/Bookings] Failed to send booking confirmation email:', emailError);
        }
      } else {
        console.warn("[API/Bookings] Attendee email not found, skipping confirmation email.");
      }
    }
    
    return NextResponse.json({
      message: 'Booking created successfully',
      bookingId: bookingId.toString(),
      totalAmount: booking.totalAmount, 
      ticketsCreated: ticketInsertResult ? ticketInsertResult.insertedCount : 0
    }, { status: 201 });

  } catch (error) {
    console.error('[API/Bookings] CRITICAL ERROR in POST handler:', error);
    return NextResponse.json({ 
        error: 'Failed to create booking due to an internal server error.', 
        details: error.message || "An unexpected error occurred." 
    }, { status: 500 });
  }
}

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
        // Make sure all necessary fields are stringified if they are ObjectIds
        grossAmount: booking.grossAmount,
        discountAppliedAmount: booking.discountAppliedAmount,
        promoCodeUsed: booking.promoCodeUsed,
        totalAmount: booking.totalAmount, // This is net
        ticketDetails: sanitizedTicketDetails,
        event: event ? { ...event, _id: event._id.toString() } : { name: 'Unknown Event', date: '', time: '', posterUrl: null }
      };
    }));
    
    return NextResponse.json(bookingsWithEventDetails);
  } catch (error) {
    console.error('[API/Bookings] Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings', details: error.message }, { status: 500 });
  }
}
