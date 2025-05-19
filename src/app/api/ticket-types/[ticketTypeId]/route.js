import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// READ - Get a single ticket type by ID
export async function GET(request, { params }) {
  try {
    const ticketTypeId = params.ticketTypeId;
    
    if (!ticketTypeId || !ObjectId.isValid(ticketTypeId)) {
      return NextResponse.json(
        { error: 'Invalid ticket type ID' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    const ticketType = await db.collection('ticketTypes').findOne({
      _id: new ObjectId(ticketTypeId)
    });
    
    if (!ticketType) {
      return NextResponse.json(
        { error: 'Ticket type not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(ticketType);
  } catch (error) {
    console.error('Error fetching ticket type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket type' },
      { status: 500 }
    );
  }
}

// UPDATE - Update a ticket type
export async function PUT(request, { params }) {
  try {
    const ticketTypeId = params.ticketTypeId;
    
    if (!ticketTypeId || !ObjectId.isValid(ticketTypeId)) {
      return NextResponse.json(
        { error: 'Invalid ticket type ID' },
        { status: 400 }
      );
    }
    
    // Get the current user session to verify ownership
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Get the ticket type to check event ownership
    const ticketType = await db.collection('ticketTypes').findOne({
      _id: new ObjectId(ticketTypeId)
    });
    
    if (!ticketType) {
      return NextResponse.json(
        { error: 'Ticket type not found' },
        { status: 404 }
      );
    }
    
    // Check if the event belongs to the organizer (if not admin)
    if (session.user.role !== 'admin') {
      const event = await db.collection('events').findOne({
        _id: ticketType.eventId,
        organizerId: session.user.id
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'You do not have permission to update this ticket type' },
          { status: 403 }
        );
      }
    }
    
    const data = await request.json();
    const { category, price, maxTicketsPerCategory } = data;
    
    // Validate required fields
    if (!category || !price) {
      return NextResponse.json(
        { error: 'Category and price are required' },
        { status: 400 }
      );
    }
    
    // Update the ticket type
    const updateResult = await db.collection('ticketTypes').updateOne(
      { _id: new ObjectId(ticketTypeId) },
      {
        $set: {
          category,
          price: parseFloat(price),
          maxTicketsPerCategory: maxTicketsPerCategory ? parseInt(maxTicketsPerCategory) : null,
          updatedAt: new Date()
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Ticket type not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Ticket type updated successfully'
    });
  } catch (error) {
    console.error('Error updating ticket type:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket type' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a ticket type
export async function DELETE(request, { params }) {
  try {
    const ticketTypeId = params.ticketTypeId;
    
    if (!ticketTypeId || !ObjectId.isValid(ticketTypeId)) {
      return NextResponse.json(
        { error: 'Invalid ticket type ID' },
        { status: 400 }
      );
    }
    
    // Get the current user session to verify ownership
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Get the ticket type to check event ownership
    const ticketType = await db.collection('ticketTypes').findOne({
      _id: new ObjectId(ticketTypeId)
    });
    
    if (!ticketType) {
      return NextResponse.json(
        { error: 'Ticket type not found' },
        { status: 404 }
      );
    }
    
    // Check if the event belongs to the organizer (if not admin)
    if (session.user.role !== 'admin') {
      const event = await db.collection('events').findOne({
        _id: ticketType.eventId,
        organizerId: session.user.id
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this ticket type' },
          { status: 403 }
        );
      }
    }
    
    // Check if there are any tickets sold for this ticket type
    const ticketsCount = await db.collection('tickets').countDocuments({
      ticketTypeId: new ObjectId(ticketTypeId)
    });
    
    if (ticketsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ticket type with sold tickets' },
        { status: 400 }
      );
    }
    
    // Delete the ticket type
    const deleteResult = await db.collection('ticketTypes').deleteOne({
      _id: new ObjectId(ticketTypeId)
    });
    
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Ticket type not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Ticket type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket type:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket type' },
      { status: 500 }
    );
  }
}