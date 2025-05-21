import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// READ - Get a single seat by ID
export async function GET(request, { params }) {
  try {
    const seatId = params.seatId;
    
    if (!seatId || !ObjectId.isValid(seatId)) {
      return NextResponse.json(
        { error: 'Invalid seat ID' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    const seat = await db.collection('seats').findOne({
      _id: new ObjectId(seatId)
    });
    
    if (!seat) {
      return NextResponse.json(
        { error: 'Seat not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(seat);
  } catch (error) {
    console.error('Error fetching seat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seat' },
      { status: 500 }
    );
  }
}

// UPDATE - Update a seat's status
export async function PUT(request, { params }) {
  try {
    const seatId = params.seatId;
    
    if (!seatId || !ObjectId.isValid(seatId)) {
      return NextResponse.json(
        { error: 'Invalid seat ID' },
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
    const { status, section, ticketId } = data;
    
    if (!status || !['available', 'reserved', 'occupied'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (available, reserved, occupied)' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Find the seat
    const seat = await db.collection('seats').findOne({
      _id: new ObjectId(seatId)
    });
    
    if (!seat) {
      return NextResponse.json(
        { error: 'Seat not found' },
        { status: 404 }
      );
    }
    
    // Check if the organizer has permission to update this seat
    if (session.user.role === 'organizer') {
      const event = await db.collection('events').findOne({
        _id: seat.eventId,
        organizerId: session.user.id
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'You do not have permission to update this seat' },
          { status: 403 }
        );
      }
    }
    
    // Update the seat
    const updateData = { 
      status: status,
      updatedAt: new Date()
    };
    
    if (section) {
      updateData.section = section;
    }
    
    if (ticketId) {
      updateData.ticketId = new ObjectId(ticketId);
    } else if (status === 'available') {
      // If seat is available, remove any ticket association
      updateData.$unset = { ticketId: "" };
    }
    
    await db.collection('seats').updateOne(
      { _id: new ObjectId(seatId) },
      { $set: updateData }
    );
    
    return NextResponse.json({
      message: 'Seat updated successfully'
    });
  } catch (error) {
    console.error('Error updating seat:', error);
    return NextResponse.json(
      { error: 'Failed to update seat' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a seat
export async function DELETE(request, { params }) {
  try {
    const seatId = params.seatId;
    
    if (!seatId || !ObjectId.isValid(seatId)) {
      return NextResponse.json(
        { error: 'Invalid seat ID' },
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
    
    // Find the seat
    const seat = await db.collection('seats').findOne({
      _id: new ObjectId(seatId)
    });
    
    if (!seat) {
      return NextResponse.json(
        { error: 'Seat not found' },
        { status: 404 }
      );
    }
    
    // Check if the organizer has permission to delete this seat
    if (session.user.role === 'organizer') {
      const event = await db.collection('events').findOne({
        _id: seat.eventId,
        organizerId: session.user.id
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this seat' },
          { status: 403 }
        );
      }
    }
    
    // Check if the seat is occupied
    if (seat.status === 'occupied') {
      return NextResponse.json(
        { error: 'Cannot delete an occupied seat' },
        { status: 400 }
      );
    }
    
    // Delete the seat
    await db.collection('seats').deleteOne({ _id: new ObjectId(seatId) });
    
    return NextResponse.json({
      message: 'Seat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting seat:', error);
    return NextResponse.json(
      { error: 'Failed to delete seat' },
      { status: 500 }
    );
  }
}