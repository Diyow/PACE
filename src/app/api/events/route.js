import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb'; // Required for creating ObjectIds for linking

export async function POST(request) {
  try {
    const formData = await request.formData();
    const eventName = formData.get('eventName');
    const date = formData.get('date');
    const time = formData.get('time');
    const description = formData.get('description');
    const posterFile = formData.get('poster');

    // Fields sent as JSON strings from create-event/page.js
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
          folder: 'event_posters', // Optional: organize in Cloudinary
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

    // 1. Prepare embedded data by parsing JSON strings from FormData
    let ticketCategoriesForEvent = [];
    if (ticketCategoriesString) {
      try {
        const parsed = JSON.parse(ticketCategoriesString);
        if (Array.isArray(parsed)) {
          // Ensure structure {category, price}
          ticketCategoriesForEvent = parsed.map(tc => ({
            category: tc.category, // Assuming frontend sends {category, price}
            price: parseFloat(tc.price)
          }));
        } else {
          console.warn("ticketCategories was not an array string:", ticketCategoriesString);
        }
      } catch (e) {
        console.error("Error parsing ticketCategories for create:", e);
        return NextResponse.json({ error: 'Invalid format for ticketCategories. Must be a JSON array string.' }, { status: 400 });
      }
    }

    let seatingLayoutForEvent = [];
    if (seatingLayoutString) {
      try {
        const parsed = JSON.parse(seatingLayoutString);
        if (Array.isArray(parsed)) {
          // Ensure structure {section, rows, style, assignedCategoryName}
          seatingLayoutForEvent = parsed.map(sl => ({
            section: sl.section,
            rows: sl.rows,
            style: sl.style,
            assignedCategoryName: sl.assignedCategoryName || null
          }));
        } else {
          console.warn("seatingLayout was not an array string:", seatingLayoutString);
        }
      } catch (e) {
        console.error("Error parsing seatingLayout for create:", e);
        return NextResponse.json({ error: 'Invalid format for seatingLayout. Must be a JSON array string.' }, { status: 400 });
      }
    }

    // 2. Create the main event document with embedded data
    const newEventDocument = {
      name: eventName,
      date: date,
      time: time,
      description: description || '',
      posterUrl: posterUrl,
      cloudinaryPublicId: cloudinaryPublicId,
      organizerId: session.user.id, // Use the string ID from the session
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketCategories: ticketCategoriesForEvent, // Embed directly
      seatingLayout: seatingLayoutForEvent,       // Embed directly
      promoCodeIds: [], // To store ObjectIds of created promo codes
    };

    const eventCreationResult = await db.collection('events').insertOne(newEventDocument);
    const createdEventId = eventCreationResult.insertedId;

    // 3. Create promo codes in their separate collection and link them
    const parsedPromoCodes = promoCodesString ? JSON.parse(promoCodesString) : [];
    const createdPromoCodeObjectIds = [];

    if (Array.isArray(parsedPromoCodes) && parsedPromoCodes.length > 0) {
      for (const pc of parsedPromoCodes) {
        const promoCodeDoc = {
          eventId: createdEventId, // Link to the new event using its ObjectId
          code: (pc.code || '').toUpperCase(),
          discountType: pc.discountType,
          discountValue: parseFloat(pc.discountValue),
          maxUses: pc.maxUses ? parseInt(pc.maxUses) : null,
          currentUses: 0,
          expiryDate: pc.expiryDate ? new Date(pc.expiryDate) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        if (promoCodeDoc.code) { // Ensure code is not empty
          const pcResult = await db.collection('promoCodes').insertOne(promoCodeDoc);
          createdPromoCodeObjectIds.push(pcResult.insertedId); // Store ObjectId
        }
      }
      // Update the event document with the IDs of the created promo codes
      if (createdPromoCodeObjectIds.length > 0) {
        await db.collection('events').updateOne(
          { _id: createdEventId },
          { $set: { promoCodeIds: createdPromoCodeObjectIds, updatedAt: new Date() } }
        );
      }
    }
    
    // Fetch the fully assembled event to return
    const finalEvent = await db.collection('events').findOne({ _id: createdEventId });

    return NextResponse.json({
      message: 'Event created successfully',
      eventId: createdEventId,
      event: finalEvent, // Contains embedded ticketCategories, seatingLayout, and promoCodeIds
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
    const status = searchParams.get('status'); // e.g., 'upcoming', 'past'

    const { db } = await connectToDatabase();

    const query = {};
    if (organizerId) {
      // Assuming organizerId in the 'events' collection is stored as the string user ID from the session
      query.organizerId = organizerId;
    }
    if (status) {
      query.status = status;
    }

    const events = await db.collection('events')
      .find(query)
      .sort({ date: -1, time: -1, createdAt: -1 }) // Sort by event date, then time, then creation
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