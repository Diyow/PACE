// src/app/api/waitlist/notify/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmail, getWaitlistTicketAvailableEmail } from '@/utils/email';

const NOTIFY_BATCH_SIZE = 5; // Number of waitlisted users to notify at once

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'organizer'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await request.json();
    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Valid Event ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const eventObjectId = new ObjectId(eventId);

    const event = await db.collection('events').findOne({ _id: eventObjectId });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Organizer check
    if (session.user.role === 'organizer' && event.organizerId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'You do not have permission to manage notifications for this event' }, { status: 403 });
    }
    
    // Check actual available seats from the 'seats' collection
    const availableSeatsCount = await db.collection('seats').countDocuments({
        eventId: eventObjectId,
        status: 'available'
    });

    if (availableSeatsCount === 0) {
        return NextResponse.json({ message: 'No seats currently available for this event. Cannot notify waitlist.' }, { status: 400 });
    }

    // Determine how many users to notify (up to available seats or batch size)
    const limit = Math.min(availableSeatsCount, NOTIFY_BATCH_SIZE);

    const waitlistedUsers = await db.collection('waitlist').find({
      eventId: eventObjectId,
      status: 'waiting' // Only notify those who are still waiting
    }).sort({ joinedAt: 1 }).limit(limit).toArray();

    if (waitlistedUsers.length === 0) {
      return NextResponse.json({ message: 'No users currently on the waitlist or awaiting notification for this event.' }, { status: 200 });
    }

    let notifiedCount = 0;
    const notificationPromises = [];

    for (const user of waitlistedUsers) {
      const bookingLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${eventId}`;
      
      notificationPromises.push(
        sendEmail(getWaitlistTicketAvailableEmail({
          attendeeName: user.attendeeName || 'Event Enthusiast',
          attendeeEmail: user.attendeeEmail,
          eventName: event.name,
          eventDate: new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
          eventId: eventId, // Pass eventId for the link
        })).then(async () => {
          await db.collection('waitlist').updateOne(
            { _id: user._id },
            { $set: { status: 'notified', notifiedAt: new Date(), updatedAt: new Date() } }
            // Consider adding offerExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // e.g., 48 hours
          );
          notifiedCount++;
        }).catch(emailError => {
          console.error(`Failed to send waitlist notification to ${user.attendeeEmail} for event ${eventId}:`, emailError);
        })
      );
    }

    await Promise.all(notificationPromises); // Wait for all emails and DB updates

    return NextResponse.json({ message: `Successfully sent notifications to ${notifiedCount} waitlisted users.` });

  } catch (error) {
    console.error('Error processing waitlist notifications:', error);
    return NextResponse.json({ error: 'Failed to process waitlist notifications', details: error.message }, { status: 500 });
  }
}
