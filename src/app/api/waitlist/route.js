// src/app/api/waitlist/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { sendEmail, getWaitlistJoinedEmail } from '@/utils/email'; // Assuming getWaitlistJoinedEmail is for POST

const WAITLIST_CAPACITY = 20;

// POST function (ensure it's complete from previous versions)
export async function POST(request) {
  try {
    const data = await request.json();
    const { eventId, ticketTypeId, email: providedEmail, name: providedName } = data;

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Valid Event ID is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const { db } = await connectToDatabase();
    let attendeeId = null;
    let attendeeEmail = providedEmail;
    let attendeeName = providedName || 'Guest';

    if (session?.user?.id) {
      attendeeId = new ObjectId(session.user.id);
      const user = await db.collection('users').findOne(
        { _id: attendeeId },
        { projection: { email: 1, fullName: 1, username: 1 } }
      );
      if (user) {
        attendeeEmail = user.email || providedEmail;
        attendeeName = user.fullName || user.username || session.user.name || providedName || 'Guest';
      }
    }

    if (!attendeeEmail) {
      return NextResponse.json({ error: 'Email is required to join the waitlist.' }, { status: 400 });
    }
    if (!/\S+@\S+\.\S+/.test(attendeeEmail)) {
        return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const currentWaitlistSize = await db.collection('waitlist').countDocuments({ eventId: new ObjectId(eventId) });
    if (currentWaitlistSize >= WAITLIST_CAPACITY) {
      return NextResponse.json(
        { error: 'Sorry, the waitlist for this event is currently full. Please try again later.' },
        { status: 409 }
      );
    }

    const existingWaitlistQuery = { eventId: new ObjectId(eventId) };
    if (attendeeId) {
      existingWaitlistQuery.attendeeId = attendeeId;
    } else {
      existingWaitlistQuery.attendeeEmail = attendeeEmail;
    }
    const existingWaitlist = await db.collection('waitlist').findOne(existingWaitlistQuery);
    if (existingWaitlist) {
      return NextResponse.json({ error: 'You (or this email) are already on the waitlist for this event.' }, { status: 400 });
    }

    const waitlistEntry = {
      eventId: new ObjectId(eventId),
      ticketTypeId: ticketTypeId && ObjectId.isValid(ticketTypeId) ? new ObjectId(ticketTypeId) : null,
      attendeeId: attendeeId,
      attendeeEmail: attendeeEmail,
      attendeeName: attendeeName,
      status: 'waiting', 
      joinedAt: new Date(),
      notifiedAt: null, 
      offerExpiresAt: null, 
      updatedAt: new Date()
    };
    const result = await db.collection('waitlist').insertOne(waitlistEntry);

    try {
      await sendEmail(getWaitlistJoinedEmail({
        attendeeName: waitlistEntry.attendeeName,
        attendeeEmail: waitlistEntry.attendeeEmail,
        eventName: event.name,
        eventDate: new Date(event.date).toLocaleDateString(),
        eventId: eventId,
      }));
    } catch (emailError) {
      console.error("Failed to send waitlist joined confirmation email:", emailError);
    }

    return NextResponse.json({
      message: 'Successfully joined the waitlist! A confirmation email has been sent.',
      waitlistId: result.insertedId.toString(),
      entry: { /* ... (entry details if needed by frontend) ... */ }
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json({ error: 'Failed to add to waitlist', details: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const checkCurrentUserStatus = searchParams.get('checkStatus') === 'true';

    const { db } = await connectToDatabase();
    let query = {};

    // Scenario 1: Check if the current logged-in user is on the waitlist for a specific event
    if (checkCurrentUserStatus) {
      if (!eventId || !ObjectId.isValid(eventId)) {
        return NextResponse.json({ error: 'Valid Event ID is required for status check.' }, { status: 400 });
      }
      if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ isOnWaitlist: false }); // Not authenticated, so not on waitlist by ID
      }
      query = { 
        eventId: new ObjectId(eventId), 
        attendeeId: new ObjectId(session.user.id) 
      };
      const waitlistEntry = await db.collection('waitlist').findOne(query);
      if (waitlistEntry) {
        return NextResponse.json({ 
          isOnWaitlist: true, 
          entry: {
            _id: waitlistEntry._id.toString(),
            eventId: waitlistEntry.eventId.toString(),
            attendeeId: waitlistEntry.attendeeId.toString(),
            attendeeEmail: waitlistEntry.attendeeEmail,
            attendeeName: waitlistEntry.attendeeName,
            status: waitlistEntry.status,
            joinedAt: waitlistEntry.joinedAt,
            ticketTypeId: waitlistEntry.ticketTypeId ? waitlistEntry.ticketTypeId.toString() : null,
          }
        });
      } else {
        return NextResponse.json({ isOnWaitlist: false });
      }
    }

    // For all subsequent list-fetching scenarios, a session is required
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: Session required to list waitlist entries.' }, { status: 401 });
    }

    // Case 2: User fetching all THEIR waitlist entries (no eventId in query from WaitlistSection.js)
    if (!eventId && session.user.role === 'user') {
      query = { attendeeId: new ObjectId(session.user.id) };
    } 
    // Case 3: Organizer/Admin fetching for a specific event (eventId is present, checkStatus is not true)
    else if (eventId && ObjectId.isValid(eventId) && ['organizer', 'admin'].includes(session.user.role)) {
      const eventObjectId = new ObjectId(eventId);
      if (session.user.role === 'organizer') {
        const event = await db.collection('events').findOne({ _id: eventObjectId, organizerId: new ObjectId(session.user.id) });
        if (!event) return NextResponse.json({ error: 'Forbidden: Event not found or not owned by organizer.' }, { status: 403 });
      }
      query = { eventId: eventObjectId };
    }
    // Case 4: Organizer fetching for ALL their events (no eventId)
    else if (!eventId && session.user.role === 'organizer') {
        const organizerEvents = await db.collection('events').find({ organizerId: new ObjectId(session.user.id) }).project({ _id: 1 }).toArray();
        const eventIds = organizerEvents.map(e => e._id);
        query = { eventId: { $in: eventIds } };
    }
    // Case 5: Admin fetching ALL waitlist entries (no eventId)
    else if (!eventId && session.user.role === 'admin') {
      // query remains empty {} to fetch all, or you might want to add pagination/limits
    }
    // Fallback for unhandled cases or insufficient permissions
    else {
       // If it reaches here, it means parameters didn't match expected scenarios for list fetching
       // e.g. user role with eventId but no checkStatus=true
       if(session.user.role === 'user' && eventId) {
           return NextResponse.json({ error: 'Forbidden: Users should use checkStatus for specific event waitlist status.' }, { status: 403 });
       }
      return NextResponse.json({ error: 'Invalid parameters or insufficient permissions for listing waitlist.' }, { status: 400 });
    }

    const waitlistEntries = await db.collection('waitlist').find(query).sort({ joinedAt: 1 }).toArray();
    const waitlistWithDetails = await Promise.all(waitlistEntries.map(async (entry) => {
      const eventDetails = await db.collection('events').findOne({ _id: entry.eventId }, { projection: { name: 1, date: 1, time: 1, posterUrl: 1 } });
      let attendeeDetails = null;
      if (entry.attendeeId) { 
        attendeeDetails = await db.collection('users').findOne({ _id: entry.attendeeId }, { projection: { fullName: 1, email: 1, username: 1 } });
      }
      return {
        ...entry,
        _id: entry._id.toString(),
        eventId: entry.eventId.toString(),
        attendeeId: entry.attendeeId ? entry.attendeeId.toString() : null,
        ticketTypeId: entry.ticketTypeId ? entry.ticketTypeId.toString() : null,
        event: eventDetails ? { ...eventDetails, _id: eventDetails._id.toString(), posterUrl: eventDetails.posterUrl } : { name: 'Unknown Event' },
        attendee: attendeeDetails ? { ...attendeeDetails, _id: attendeeDetails._id.toString() } : { fullName: entry.attendeeName || 'Guest', email: entry.attendeeEmail }
      };
    }));
    return NextResponse.json(waitlistWithDetails);

  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json( { error: 'Failed to fetch waitlist', details: error.message }, { status: 500 });
  }
}

// DELETE function (ensure it's complete from previous versions)
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Valid Event ID is required in query parameters.' }, { status: 400 });
    }
    const { db } = await connectToDatabase();
    const query = {
      eventId: new ObjectId(eventId),
      attendeeId: new ObjectId(session.user.id) 
    };
    const result = await db.collection('waitlist').deleteOne(query);
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'You were not found on the waitlist for this event, or the entry was already removed.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Successfully left the waitlist.' });
  } catch (error) {
    console.error('Error leaving waitlist:', error);
    return NextResponse.json({ error: 'Failed to leave waitlist', details: error.message }, { status: 500 });
  }
}