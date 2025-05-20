import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
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
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
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
    
    // Check if the user has permission to view this ticket
    if (session.user.role === 'attendee' && ticket.attendeeId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this ticket' },
        { status: 403 }
      );
    }
    
    if (session.user.role === 'organizer') {
      // Check if the ticket is for an event organized by this user
      const event = await db.collection('events').findOne({
        _id: ticket.eventId,
        organizerId: session.user.id
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'You do not have permission to view this ticket' },
          { status: 403 }
        );
      }
    }
    
    // Fetch related event and ticket type details
    const event = await db.collection('events').findOne(
      { _id: ticket.eventId },
      { projection: { name: 1, date: 1, time: 1 } }
    );
    
    const ticketType = await db.collection('ticketTypes').findOne(
      { _id: ticket.ticketTypeId },
      { projection: { category: 1, price: 1 } }
    );
    
    return NextResponse.json({
      ...ticket,
      event: event || { name: 'Unknown Event' },
      ticketType: ticketType || { category: 'Unknown Category' }
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
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
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { status } = data;
    
    if (!status || !['reserved', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (reserved, confirmed, cancelled)' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Find the ticket
    const ticket = await db.collection('tickets').findOne({
      _id: new ObjectId(ticketId)
    });
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Check if the organizer has permission to update this ticket
    if (session.user.role === 'organizer') {
      const event = await db.collection('events').findOne({
        _id: ticket.eventId,
        organizerId: session.user.id
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'You do not have permission to update this ticket' },
          { status: 403 }
        );
      }
    }
    
    // Update the ticket
    await db.collection('tickets').updateOne(
      { _id: new ObjectId(ticketId) },
      { 
        $set: { 
          status: status,
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
      { error: 'Failed to update ticket' },
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
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Find the ticket
    const ticket = await db.collection('tickets').findOne({
      _id: new ObjectId(ticketId)
    });
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Check if the organizer has permission to delete this ticket
    if (session.user.role === 'organizer') {
      const event = await db.collection('events').findOne({
        _id: ticket.eventId,
        organizerId: session.user.id
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this ticket' },
          { status: 403 }
        );
      }
    }
    
    // Delete the ticket
    await db.collection('tickets').deleteOne({ _id: new ObjectId(ticketId) });
    
    return NextResponse.json({
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}