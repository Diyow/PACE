import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Ensure this path is correct
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs'; // For password hashing and comparison

// GET current user's profile
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 0 } } // Exclude password from being sent to client
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Sanitize user object before sending
    const { _id, ...userData } = user;
    return NextResponse.json({ ...userData, id: _id.toString() });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile', details: error.message }, { status: 500 });
  }
}

// PUT - Update current user's profile
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const userId = new ObjectId(session.user.id);
    const data = await request.json();

    const { fullName, email, phoneNumber, organizationName } = data;

    // Basic validation
    if (!fullName || !email) {
        return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 });
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
        return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    // Check if the new email is already taken by another user
    if (email) {
      const existingUserWithEmail = await db.collection('users').findOne({
        email: email,
        _id: { $ne: userId } // Exclude the current user
      });
      if (existingUserWithEmail) {
        return NextResponse.json({ error: 'Email is already in use by another account.' }, { status: 409 }); // 409 Conflict
      }
    }

    const updateFields = {
      updatedAt: new Date(),
    };
    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email; // Username is not typically changed by user, so omitted
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber; // Allow empty string for phone

    // Only allow organizationName update if user is an organizer
    const currentUser = await db.collection('users').findOne({ _id: userId });
    if (currentUser && currentUser.role === 'organizer' && organizationName !== undefined) {
        updateFields.organizationName = organizationName;
    }


    const result = await db.collection('users').updateOne(
      { _id: userId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found for update' }, { status: 404 });
    }
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
      return NextResponse.json({ message: 'No changes detected or applied.', user: { fullName, email, phoneNumber, organizationName } });
    }
    
    // Fetch the updated user data to return (excluding password)
    const updatedUser = await db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );

    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500 });
  }
}

// DELETE - Delete current user's account
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    const { password } = await request.json(); // Expect current password for confirmation

    if (!password) {
      return NextResponse.json({ error: 'Password confirmation is required to delete account.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection('users').findOne({ _id: userId });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Incorrect password. Account deletion failed.' }, { status: 403 }); // Forbidden
    }

    // Consequence Management (similar to organizer deletion, but for any user type)
    // If the user is an organizer, delete their events and associated data.
    if (user.role === 'organizer') {
      const eventsByOrganizer = await db.collection('events').find({ organizerId: userId }).toArray();
      for (const event of eventsByOrganizer) {
        // Simplified cascade deletion logic (adapt from organizer deletion if needed)
        // This should ideally be a shared service or more robust transaction.
        if (event.cloudinaryPublicId) {
          console.log(`TODO: Implement Cloudinary deletion for public_id: ${event.cloudinaryPublicId} during account deletion`);
        }
        await db.collection('promoCodes').deleteMany({ eventId: event._id });
        await db.collection('ticketTypes').deleteMany({ eventId: event._id });
        await db.collection('bookings').deleteMany({ eventId: event._id });
        await db.collection('tickets').deleteMany({ eventId: event._id });
        await db.collection('waitlist').deleteMany({ eventId: event._id });
        await db.collection('seats').deleteMany({ eventId: event._id });
        await db.collection('events').deleteOne({ _id: event._id });
        console.log(`Deleted event ${event._id} and associated data for organizer ${userId} during account deletion.`);
      }
    }

    // If the user is an attendee, consider what happens to their bookings/tickets.
    // Option 1: Anonymize or mark bookings (e.g., attendeeId: null, status: 'cancelled_user_deleted')
    // Option 2: Delete their bookings and tickets (this is simpler for now)
    // This might affect event analytics if tickets are outright deleted.
    await db.collection('bookings').deleteMany({ attendeeId: userId });
    await db.collection('tickets').deleteMany({ attendeeId: userId });
    await db.collection('waitlist').deleteMany({ attendeeId: userId }); // Also remove from waitlists


    // Delete the user
    const deleteResult = await db.collection('users').deleteOne({ _id: userId });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found or already deleted during the process.' }, { status: 404 });
    }

    // It's good practice to also invalidate the session / sign the user out here,
    // but NextAuth handles session invalidation on the client-side after signOut() is called.

    return NextResponse.json({ message: 'Account deleted successfully. You will be signed out.' });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account', details: error.message }, { status: 500 });
  }
}
