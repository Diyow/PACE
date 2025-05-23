// src/app/api/events/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; //
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; //
import { uploadImageToCloudinary } from '@/lib/cloudinary'; // Import the utility

export async function POST(request) {
  try {
    const formData = await request.formData();
    const eventName = formData.get('eventName');
    const date = formData.get('date');
    const time = formData.get('time');
    const description = formData.get('description');
    const posterFile = formData.get('poster'); // This is the File object

    if (!eventName || !date || !time) {
      return NextResponse.json(
        { error: 'Event name, date, and time are required' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions); //
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let posterUrl = null;
    let cloudinaryPublicId = null;

    if (posterFile && posterFile.size > 0) {
      try {
        // Convert the File object to a Buffer
        const fileBuffer = Buffer.from(await posterFile.arrayBuffer());

        // Upload to Cloudinary
        const uploadResult = await uploadImageToCloudinary(fileBuffer, {
          // You can add more options here, like public_id for a custom name
          // public_id: `event_${eventName.replace(/\s+/g, '_')}_${Date.now()}`,
        });

        posterUrl = uploadResult.secure_url; // Use the secure URL
        cloudinaryPublicId = uploadResult.public_id; // Store public_id if you want to manage/delete later
      } catch (uploadError) {
        console.error('Failed to upload image to Cloudinary:', uploadError);
        // Handle error appropriately - maybe return an error response or proceed without poster
        return NextResponse.json(
          { error: 'Failed to upload event poster.', details: uploadError.message },
          { status: 500 }
        );
      }
    }

    const { db } = await connectToDatabase(); //
    const newEvent = {
      name: eventName,
      date: date,
      time: time,
      description: description || '',
      posterUrl: posterUrl, // URL from Cloudinary
      cloudinaryPublicId: cloudinaryPublicId, // Optional: Store for later management
      organizerId: session.user.id,
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date(),
      seatingLayout: formData.get('seatingLayout') ? JSON.parse(formData.get('seatingLayout')) : [],
      ticketCategories: formData.get('ticketCategories') ? JSON.parse(formData.get('ticketCategories')) : [],
    };

    const result = await db.collection('events').insertOne(newEvent);

    return NextResponse.json({
      message: 'Event created successfully',
      eventId: result.insertedId,
      event: newEvent, // Return the created event including the posterUrl
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    );
  }
}

// GET function remains the same
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizerId');
    const status = searchParams.get('status');

    const { db } = await connectToDatabase(); //

    const query = {};
    if (organizerId) {
      query.organizerId = organizerId;
    }
    if (status) {
      query.status = status;
    }

    const events = await db.collection('events')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}