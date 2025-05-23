// src/app/api/tickets/[ticketId]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next'; // CORRECTED IMPORT for App Router
import { authOptions } from '@/lib/auth';

// READ - Get a single ticket by ID
export async function GET(request, { params }) {
  try {
    const ticketId = params.ticketId;
    
    if (!ticketId || !ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions); // Usage is correct
    if (!session || !session.user || !session.user.id) { // Check for session.user.id
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    const ticket = await db.collection('tickets').findOne({
      _id: new ObjectId(ticketId)
    });
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Permission Check: User can only view their own tickets unless they are admin/organizer
    let hasPermission = false;
    if (session.user.role === 'admin') {
        hasPermission = true;
    } else if (ticket.attendeeId.toString() === session.user.id) { // Ensure comparison is string vs string or ObjectId vs ObjectId
        hasPermission = true;
    } else if (session.user.role === 'organizer') {
      const eventForTicket = await db.collection('events').findOne({ 
          _id: ticket.eventId, 
          organizerId: new ObjectId(session.user.id) // Check if event belongs to this organizer
      });
      if (eventForTicket) {
          hasPermission = true;
      }
    }

    if (!hasPermission) {
         return NextResponse.json(
            { error: 'You do not have permission to view this ticket' },
            { status: 403 }
        );
    }
    
    // Fetch related event (project more fields for fallback logic)
    const event = await db.collection('events').findOne(
      { _id: ticket.eventId }, // ticket.eventId is already ObjectId
      { projection: { name: 1, date: 1, time: 1, posterUrl: 1, seatingLayout: 1, ticketCategories: 1, organizerId: 1 } }
    );
    
    // Initialize default ticketType, potentially using event's first ticket category price as default
    let defaultPrice = 0;
    if (event && event.ticketCategories && event.ticketCategories.length > 0) {
        defaultPrice = parseFloat(event.ticketCategories[0].price) || 0;
    }
    let resolvedTicketType = { category: 'General Admission', price: defaultPrice }; // Fallback

    if (ticket.ticketTypeId && ObjectId.isValid(ticket.ticketTypeId.toString())) {
      const foundTicketType = await db.collection('ticketTypes').findOne(
        { _id: new ObjectId(ticket.ticketTypeId.toString()) },
        { projection: { category: 1, price: 1 } }
      );
      if (foundTicketType) {
        resolvedTicketType = { // Ensure price is a number here
            category: foundTicketType.category,
            price: parseFloat(foundTicketType.price) || 0,
            _id: foundTicketType._id 
        };
      } else {
        // ticketTypeId was valid but no document found, try deriving from seatInfo
        if (ticket.seatInfo && event?.seatingLayout) {
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
              resolvedTicketType = {
                category: categoryBasedTicketType.category,
                price: parseFloat(categoryBasedTicketType.price) || defaultPrice,
                _id: categoryBasedTicketType._id
              };
            } else {
              resolvedTicketType.category = sectionInLayout.assignedCategoryName;
            }
          } else {
            resolvedTicketType.category = sectionNameFromSeat;
          }
        } else {
          resolvedTicketType.category = "Standard Ticket"; // Fallback if no other info
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
          resolvedTicketType = {
            category: categoryBasedTicketType.category,
            price: parseFloat(categoryBasedTicketType.price) || defaultPrice,
            _id: categoryBasedTicketType._id
          };
        } else {
          resolvedTicketType.category = sectionInLayout.assignedCategoryName;
        }
      } else {
        resolvedTicketType.category = sectionNameFromSeat || "Standard Ticket";
      }
    } // If ticketTypeId is null and no seatInfo/layout, the initial default resolvedTicketType is used.

    // Ensure all IDs are strings for the client
    const finalTicket = {
        ...ticket,
        _id: ticket._id.toString(),
        eventId: ticket.eventId.toString(),
        attendeeId: ticket.attendeeId.toString(),
        ticketTypeId: ticket.ticketTypeId ? ticket.ticketTypeId.toString() : null,
        event: event ? { 
            ...event, 
            _id: event._id.toString(), 
            organizerId: event.organizerId ? event.organizerId.toString() : null 
        } : { name: 'Unknown Event', date: '', time: '' }, // Provide defaults
        ticketType: {
            category: resolvedTicketType.category || "Unknown",
            price: parseFloat(resolvedTicketType.price || 0).toFixed(2), // Format price
            _id: resolvedTicketType._id ? resolvedTicketType._id.toString() : null
        }
    };
    
    return NextResponse.json(finalTicket);

  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket', details: error.message },
      { status: 500 }
    );
  }
}

// UPDATE - Update a ticket's status
export async function PUT(request, { params }) {
  try {
    const ticketId = params.ticketId;
    
    if (!ticketId || !ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { status } = data;
    
    if (!status || !['reserved', 'confirmed', 'cancelled'].includes(status.toLowerCase())) { // Make status check case-insensitive
      return NextResponse.json(
        { error: 'Valid status is required (reserved, confirmed, cancelled)' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    const ticket = await db.collection('tickets').findOne({
      _id: new ObjectId(ticketId)
    });
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    if (session.user.role === 'organizer') {
      const event = await db.collection('events').findOne({
        _id: ticket.eventId, // ticket.eventId is ObjectId
        organizerId: new ObjectId(session.user.id) // session.user.id is string, convert
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'You do not have permission to update this ticket' },
          { status: 403 }
        );
      }
    }
    
    await db.collection('tickets').updateOne(
      { _id: new ObjectId(ticketId) },
      { 
        $set: { 
          status: status, // Store status as provided (e.g., could be "Confirmed" or "confirmed")
          updatedAt: new Date()
        } 
      }
    );
    
    return NextResponse.json({
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a ticket
export async function DELETE(request, { params }) {
  try {
    const ticketId = params.ticketId;
    
    if (!ticketId || !ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    const ticket = await db.collection('tickets').findOne({
      _id: new ObjectId(ticketId)
    });
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    if (session.user.role === 'organizer') {
      const event = await db.collection('events').findOne({
        _id: ticket.eventId, // ticket.eventId is ObjectId
        organizerId: new ObjectId(session.user.id) // session.user.id is string, convert
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this ticket' },
          { status: 403 }
        );
      }
    }
    
    await db.collection('tickets').deleteOne({ _id: new ObjectId(ticketId) });
    
    return NextResponse.json({
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket', details: error.message },
      { status: 500 }
    );
  }
}