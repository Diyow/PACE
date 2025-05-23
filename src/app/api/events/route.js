// src/app/api/events/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';

// POST function remains the same ...
export async function POST(request) {
  try {
    const formData = await request.formData();
    const eventName = formData.get('eventName');
    const date = formData.get('date'); // Expected format: YYYY-MM-DD
    const time = formData.get('time'); // Expected format: HH:MM
    const description = formData.get('description');
    const posterFile = formData.get('poster');

    const ticketCategoriesString = formData.get('ticketCategories');
    const seatingLayoutString = formData.get('seatingLayout');
    const promoCodesString = formData.get('promoCodes');

    if (!eventName || !date || !time) {
      return NextResponse.json(
        { error: 'Event name, date, and time are required' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized or user ID missing from session' },
        { status: 401 }
      );
    }

    let posterUrl = null;
    let cloudinaryPublicId = null;

    if (posterFile && typeof posterFile.arrayBuffer === 'function' && posterFile.size > 0) {
      try {
        const fileBuffer = Buffer.from(await posterFile.arrayBuffer());
        const uploadResult = await uploadImageToCloudinary(fileBuffer, {
          folder: 'event_posters',
        });
        posterUrl = uploadResult.secure_url;
        cloudinaryPublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error('Cloudinary Upload Error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload event poster.', details: uploadError.message },
          { status: 500 }
        );
      }
    }

    const { db } = await connectToDatabase();

    let ticketCategoriesForEvent = [];
    if (ticketCategoriesString) {
      try {
        const parsed = JSON.parse(ticketCategoriesString);
        if (Array.isArray(parsed)) {
          ticketCategoriesForEvent = parsed.map(tc => ({
            category: tc.category, 
            price: parseFloat(tc.price)
          }));
        }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid format for ticketCategories.' }, { status: 400 });
      }
    }

    let seatingLayoutForEvent = [];
    if (seatingLayoutString) {
      try {
        const parsed = JSON.parse(seatingLayoutString);
        if (Array.isArray(parsed)) {
          seatingLayoutForEvent = parsed.map(sl => ({
            section: sl.section,
            rows: sl.rows,
            style: sl.style,
            assignedCategoryName: sl.assignedCategoryName || null
          }));
        }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid format for seatingLayout.' }, { status: 400 });
      }
    }
    
    // Determine initial status based on date/time
    // This is important if an event is created for a past date/time, though usually not the case.
    // For dynamic status filtering in GET, this stored status might be less critical
    // but it's good practice to set it reasonably.
    const eventDateTimeStr = `${date}T${time}:00`; // Assuming local time of server or consistent timezone
    const eventDateObj = new Date(eventDateTimeStr);
    const nowForStatus = new Date();
    const initialStatus = eventDateObj >= nowForStatus ? 'upcoming' : 'past';


    const newEventDocument = {
      name: eventName,
      date: date, // Store as YYYY-MM-DD string
      time: time, // Store as HH:MM string
      description: description || '',
      posterUrl: posterUrl,
      cloudinaryPublicId: cloudinaryPublicId,
      organizerId: session.user.id, 
      status: initialStatus, // Set initial status
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketCategories: ticketCategoriesForEvent, 
      seatingLayout: seatingLayoutForEvent,       
      promoCodeIds: [], 
    };

    const eventCreationResult = await db.collection('events').insertOne(newEventDocument);
    const createdEventId = eventCreationResult.insertedId;

    const parsedPromoCodes = promoCodesString ? JSON.parse(promoCodesString) : [];
    const createdPromoCodeObjectIds = [];

    if (Array.isArray(parsedPromoCodes) && parsedPromoCodes.length > 0) {
      for (const pc of parsedPromoCodes) {
        const promoCodeDoc = {
          eventId: createdEventId, 
          code: (pc.code || '').toUpperCase(),
          discountType: pc.discountType,
          discountValue: parseFloat(pc.discountValue),
          maxUses: pc.maxUses ? parseInt(pc.maxUses) : null,
          currentUses: 0,
          expiryDate: pc.expiryDate ? new Date(pc.expiryDate) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        if (promoCodeDoc.code) { 
          const pcResult = await db.collection('promoCodes').insertOne(promoCodeDoc);
          createdPromoCodeObjectIds.push(pcResult.insertedId); 
        }
      }
      if (createdPromoCodeObjectIds.length > 0) {
        await db.collection('events').updateOne(
          { _id: createdEventId },
          { $set: { promoCodeIds: createdPromoCodeObjectIds, updatedAt: new Date() } }
        );
      }
    }
    
    const finalEvent = await db.collection('events').findOne({ _id: createdEventId });

    return NextResponse.json({
      message: 'Event created successfully',
      eventId: createdEventId,
      event: finalEvent,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    );
  }
}


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizerId');
    const requestedStatus = searchParams.get('status'); // 'upcoming' or 'past'

    const { db } = await connectToDatabase();
    const query = {};

    if (organizerId) {
      query.organizerId = organizerId;
    }

    // Dynamic status filtering based on current date/time
    if (requestedStatus) {
      const now = new Date();
      
      // Get current date and time as strings in YYYY-MM-DD and HH:MM format
      // This assumes server's local timezone. For more robustness, handle timezones explicitly or use UTC.
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0'); // JS months are 0-indexed
      const day = now.getDate().toString().padStart(2, '0');
      const currentDateString = `${year}-${month}-${day}`;

      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeString = `${hours}:${minutes}`;

      if (requestedStatus === 'upcoming') {
        // Events are upcoming if:
        // - Their date is greater than today's date, OR
        // - Their date is today AND their time is greater than or equal to the current time.
        query.$or = [
          { date: { $gt: currentDateString } },
          { 
            date: currentDateString,
            time: { $gte: currentTimeString } 
          }
        ];
      } else if (requestedStatus === 'past') {
        // Events are past if:
        // - Their date is less than today's date, OR
        // - Their date is today AND their time is less than the current time.
        query.$or = [
          { date: { $lt: currentDateString } },
          { 
            date: currentDateString,
            time: { $lt: currentTimeString } 
          }
        ];
      }
    }
    
    // Adjust sorting based on status
    let sortCriteria = { date: -1, time: -1, createdAt: -1 }; // Default (good for past)
    if (requestedStatus === 'upcoming') {
        sortCriteria = { date: 1, time: 1, createdAt: 1 }; // Soonest upcoming first
    }


    const events = await db.collection('events')
      .find(query)
      .sort(sortCriteria) 
      .toArray();

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message },
      { status: 500 }
    );
  }
}