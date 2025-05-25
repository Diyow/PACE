// src/app/api/events/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const eventName = formData.get('eventName');
    const date = formData.get('date');
    const time = formData.get('time');
    const description = formData.get('description');
    const posterFile = formData.get('poster');

    const ticketCategoriesString = formData.get('ticketCategories');
    const seatingLayoutString = formData.get('seatingLayout'); // This is the event's seating layout
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

    let seatingLayoutForEvent = []; // This is the event's overall seating structure
    if (seatingLayoutString) {
      try {
        const parsed = JSON.parse(seatingLayoutString);
        if (Array.isArray(parsed)) {
          // This layout describes sections, their rows, and seat numbers within those rows
          seatingLayoutForEvent = parsed.map(sl => ({
            section: sl.section,
            rows: sl.rows, // e.g., { A: [{number:1}, {number:2}], B: [{number:1}]}
            style: sl.style,
            assignedCategoryName: sl.assignedCategoryName || null 
          }));
        }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid format for seatingLayout.' }, { status: 400 });
      }
    }
    
    const eventDateTimeStr = `${date}T${time}:00`;
    const eventDateObj = new Date(eventDateTimeStr);
    const nowForStatus = new Date();
    const initialStatus = eventDateObj >= nowForStatus ? 'upcoming' : 'past';

    const newEventDocument = {
      name: eventName,
      date: date,
      time: time,
      description: description || '',
      posterUrl: posterUrl,
      cloudinaryPublicId: cloudinaryPublicId,
      organizerId: new ObjectId(session.user.id), // Ensure organizerId is ObjectId
      status: initialStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketCategories: ticketCategoriesForEvent, 
      seatingLayout: seatingLayoutForEvent, // Save the seating layout definition to the event
      promoCodeIds: [], 
    };

    const eventCreationResult = await db.collection('events').insertOne(newEventDocument);
    const createdEventId = eventCreationResult.insertedId;

    // *** ADDED: Create individual seat documents in 'seats' collection ***
    if (seatingLayoutForEvent && Array.isArray(seatingLayoutForEvent)) {
      const seatsToCreateInCollection = [];
      for (const sectionLayout of seatingLayoutForEvent) {
        if (sectionLayout.rows && typeof sectionLayout.rows === 'object') {
          for (const rowKey in sectionLayout.rows) { // e.g., rowKey is 'A', 'B'
            if (Array.isArray(sectionLayout.rows[rowKey])) {
              for (const seatObj of sectionLayout.rows[rowKey]) { // seatObj is like { number: 1, status: 'available' }
                seatsToCreateInCollection.push({
                  eventId: createdEventId,
                  section: sectionLayout.section, // Name of the section
                  row: rowKey, // Row identifier (e.g., "A")
                  seatNumber: String(seatObj.number), // Ensure seatNumber is consistently string or number based on usage
                  status: 'available', // Initial status
                  // ticketTypeId: null, // Can be linked later if needed, or derived from assignedCategoryName
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
              }
            }
          }
        }
      }
      if (seatsToCreateInCollection.length > 0) {
        try {
          await db.collection('seats').insertMany(seatsToCreateInCollection, { ordered: false });
          console.log(`Created ${seatsToCreateInCollection.length} seat documents for new event ${createdEventId}`);
        } catch (seatCreationError) {
          console.error(`Error creating seat documents for new event ${createdEventId}:`, seatCreationError);
          // Optionally, you might want to roll back event creation or log this for manual intervention
        }
      }
    }
    // *** END OF ADDED LOGIC FOR SEAT CREATION ***

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

// GET function remains the same
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizerIdParam = searchParams.get('organizerId'); // Renamed to avoid conflict
    const requestedStatus = searchParams.get('status');

    const { db } = await connectToDatabase();
    const query = {};

    if (organizerIdParam) {
      if (!ObjectId.isValid(organizerIdParam)) {
         return NextResponse.json({ error: 'Invalid Organizer ID format' }, { status: 400 });
      }
      query.organizerId = new ObjectId(organizerIdParam);
    }
    
    if (requestedStatus) {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const currentDateString = `${year}-${month}-${day}`;

      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeString = `${hours}:${minutes}`;

      if (requestedStatus === 'upcoming') {
        query.$or = [
          { date: { $gt: currentDateString } },
          { 
            date: currentDateString,
            time: { $gte: currentTimeString } 
          }
        ];
      } else if (requestedStatus === 'past') {
        query.$or = [
          { date: { $lt: currentDateString } },
          { 
            date: currentDateString,
            time: { $lt: currentTimeString } 
          }
        ];
      }
    }
    
    let sortCriteria = { date: -1, time: -1, createdAt: -1 }; 
    if (requestedStatus === 'upcoming') {
        sortCriteria = { date: 1, time: 1, createdAt: 1 };
    }

    const events = await db.collection('events')
      .find(query)
      .sort(sortCriteria) 
      .toArray();

    const sanitizedEvents = await Promise.all(events.map(async (event) => {
        const totalTicketsSold = await db.collection('tickets').countDocuments({
            eventId: event._id,
            status: 'Confirmed'
        });

        const revenueResult = await db.collection('bookings').aggregate([
            { $match: { eventId: event._id, paymentStatus: 'completed' } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]).toArray();
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        return {
            ...event,
            _id: event._id.toString(),
            organizerId: event.organizerId ? event.organizerId.toString() : null,
            promoCodeIds: event.promoCodeIds ? event.promoCodeIds.map(id => id.toString()) : [],

            totalTicketsSold: totalTicketsSold,
            totalRevenue: totalRevenue,

        };
    }));


    return NextResponse.json(sanitizedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message },
      { status: 500 }
    );
  }
}
