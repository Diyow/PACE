// src/app/api/organizers/[organizerId]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions }
from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const { organizerId } = params;

    if (!organizerId || !ObjectId.isValid(organizerId)) {
      return NextResponse.json({ error: 'Invalid Organizer ID' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    // Ensure only an admin can delete an organizer
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const userObjectId = new ObjectId(organizerId);

    // Optional: Check if the user is indeed an organizer
    const organizerToDelete = await db.collection('users').findOne({ _id: userObjectId, role: 'organizer' });
    if (!organizerToDelete) {
      return NextResponse.json({ error: 'Organizer not found or user is not an organizer' }, { status: 404 });
    }

    // Consequence Management:
    // Decide what to do with events created by this organizer.
    // Option 1: Delete their events (and associated data like tickets, bookings)
    // Option 2: Mark events as 'unassigned' or reassign to a default admin/organizer
    // Option 3: Prevent deletion if organizer has active/upcoming events

    // For now, let's implement Option 1: Delete associated events
    // This requires caution and might need more sophisticated handling in a real app.
    const eventsByOrganizer = await db.collection('events').find({ organizerId: userObjectId }).toArray();

    for (const event of eventsByOrganizer) {
      // Re-use or adapt event deletion logic if you have it in /api/events/[eventId]/route.js
      // This is a simplified cascade deletion for brevity.
      // In a real app, you might call the event deletion endpoint or a shared service function.
      if (event.cloudinaryPublicId) {
        try {
          // Assuming you have cloudinary configured and imported as v2
          // import { v2 as cloudinary } from 'cloudinary'; // Would need setup here or in a helper
          // await cloudinary.uploader.destroy(event.cloudinaryPublicId);
          console.log(`TODO: Implement Cloudinary deletion for public_id: ${event.cloudinaryPublicId}`);
        } catch (e) {
          console.warn("Cloudinary delete error during organizer deletion:", e.message);
        }
      }
      await db.collection('promoCodes').deleteMany({ eventId: event._id });
      await db.collection('ticketTypes').deleteMany({ eventId: event._id });
      await db.collection('bookings').deleteMany({ eventId: event._id });
      await db.collection('tickets').deleteMany({ eventId: event._id });
      await db.collection('waitlist').deleteMany({ eventId: event._id });
      await db.collection('seats').deleteMany({ eventId: event._id });
      await db.collection('events').deleteOne({ _id: event._id });
      console.log(`Deleted event ${event._id} and associated data for organizer ${organizerId}`);
    }


    // Delete the organizer user
    const deleteResult = await db.collection('users').deleteOne({ _id: userObjectId });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Organizer not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Organizer and their associated events deleted successfully' });

  } catch (error) {
    console.error('Error deleting organizer:', error);
    return NextResponse.json({ error: 'Failed to delete organizer', details: error.message }, { status: 500 });
  }
}