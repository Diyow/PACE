// src/app/api/events/[eventId]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

const DEFAULT_TICKET_CATEGORY_NAME = "Regular";
const DEFAULT_TICKET_PRICE = "10.00";
const WAITLIST_CAPACITY = 20; // Define static waitlist capacity here or fetch from event settings

export async function GET(request, context) {
  try {
    const paramsObject = await context.params;
    const eventId = paramsObject.eventId;

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const eventObjectId = new ObjectId(eventId);
    const event = await db.collection('events').findOne({ _id: eventObjectId });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let organizerName = 'PACE Events Platform'; 
    if (event.organizerId && ObjectId.isValid(event.organizerId.toString())) {
      const organizer = await db.collection('users').findOne(
        { _id: new ObjectId(event.organizerId.toString()) },
        { projection: { fullName: 1, organizationName: 1 } } 
      );
      if (organizer) {
        organizerName = organizer.organizationName || organizer.fullName || organizerName;
      }
    }
    
    let totalCapacityFromLayout = 0;
    if (event.seatingLayout && Array.isArray(event.seatingLayout)) {
      event.seatingLayout.forEach(section => {
        if (section.rows && typeof section.rows === 'object') {
          Object.values(section.rows).forEach(rowSeatsArray => {
            if (Array.isArray(rowSeatsArray)) {
              totalCapacityFromLayout += rowSeatsArray.length;
            }
          });
        }
      });
    }

    const availableSeatsInSeatsCollection = await db.collection('seats').countDocuments({
      eventId: eventObjectId,
      status: 'available'
    });
    const occupiedSeatsInSeatsCollection = await db.collection('seats').countDocuments({
      eventId: eventObjectId,
      status: 'occupied'
    });
    
    // Get current waitlist size
    const currentWaitlistSize = await db.collection('waitlist').countDocuments({ eventId: eventObjectId });

    const sanitizedEvent = {
        ...event,
        _id: event._id.toString(),
        organizerId: event.organizerId ? event.organizerId.toString() : null,
        organizerName: organizerName,
        totalCapacity: totalCapacityFromLayout,
        ticketsAvailable: availableSeatsInSeatsCollection,
        ticketsPurchased: occupiedSeatsInSeatsCollection, // Represents taken spots
        currentWaitlistSize: currentWaitlistSize,
        waitlistCapacity: WAITLIST_CAPACITY, // Send capacity to frontend
        ticketCategories: event.ticketCategories ? event.ticketCategories.map(tc => ({
            ...tc,
            _id: tc._id ? tc._id.toString() : undefined 
        })) : [],
        promoCodeIds: event.promoCodeIds ? event.promoCodeIds.map(id => id.toString()) : [],
    };

    return NextResponse.json(sanitizedEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Failed to fetch event', details: error.message }, { status: 500 });
  }
}

// PUT and DELETE functions (ensure they are complete and correct as per your previous versions)
// ... (Your existing PUT and DELETE functions for this route)
export async function PUT(request, context) {
  try {
    const paramsObject = await context.params; 
    const eventId = paramsObject.eventId;

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized or user ID missing from session' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const eventObjectId = new ObjectId(eventId);
    const existingEvent = await db.collection('events').findOne({ _id: eventObjectId });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const organizerIdAsString = existingEvent.organizerId.toString();
    if (session.user.role !== 'admin' && organizerIdAsString !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission to update this event' }, { status: 403 });
    }

    const formData = await request.formData();
    const updateFields = { updatedAt: new Date() };
    let isDefaultCategoryReferencedBySeatingLayout = false;

    if (formData.has('eventName')) updateFields.name = formData.get('eventName');
    if (formData.has('date')) updateFields.date = formData.get('date');
    if (formData.has('time')) updateFields.time = formData.get('time');
    if (formData.has('description')) updateFields.description = formData.get('description');
    if (formData.has('status')) updateFields.status = formData.get('status');
    if (formData.has('organizerId') && ObjectId.isValid(formData.get('organizerId'))) { 
        if (session.user.role === 'admin') {
             updateFields.organizerId = new ObjectId(formData.get('organizerId'));
        }
    }

    const newPosterFile = formData.get('poster');
    const removePosterFlag = formData.get('removePoster') === 'true';
    if (removePosterFlag) {
      if (existingEvent.cloudinaryPublicId) {
        try { await cloudinary.uploader.destroy(existingEvent.cloudinaryPublicId); } catch (e) { console.warn("Cloudinary: Failed to delete old poster during removal:", e.message); }
      }
      updateFields.posterUrl = null;
      updateFields.cloudinaryPublicId = null;
    } else if (newPosterFile && typeof newPosterFile.arrayBuffer === 'function' && newPosterFile.size > 0) {
      if (existingEvent.cloudinaryPublicId) { 
        try { await cloudinary.uploader.destroy(existingEvent.cloudinaryPublicId); } catch (e) { console.warn("Cloudinary: Failed to delete old poster during replacement:", e.message); }
      }
      try {
        const fileBuffer = Buffer.from(await newPosterFile.arrayBuffer());
        const uploadResult = await uploadImageToCloudinary(fileBuffer, { folder: 'event_posters' });
        updateFields.posterUrl = uploadResult.secure_url;
        updateFields.cloudinaryPublicId = uploadResult.public_id;
      } catch (uploadError) {
        return NextResponse.json( { error: 'Failed to upload new event poster.', details: uploadError.message }, { status: 500 });
      }
    }
    
    if (formData.has('seatingLayout')) {
      try {
        const seatingLayoutString = formData.get('seatingLayout');
        const parsedSeatingLayout = JSON.parse(seatingLayoutString);
        if (Array.isArray(parsedSeatingLayout)) {
          updateFields.seatingLayout = parsedSeatingLayout.map(sl => {
            let finalAssignedCategoryName = sl.assignedCategoryName;
            if (!finalAssignedCategoryName || finalAssignedCategoryName === '') {
              finalAssignedCategoryName = DEFAULT_TICKET_CATEGORY_NAME;
              isDefaultCategoryReferencedBySeatingLayout = true;
            }
            let processedRows = {};
            if (typeof sl.rows === 'object' && sl.rows !== null) {
                Object.entries(sl.rows).forEach(([rowKey, seatsArray]) => {
                    if (Array.isArray(seatsArray)) {
                        processedRows[rowKey] = seatsArray.map(seat => (typeof seat === 'object' ? seat : { number: seat, status: 'available' }));
                    } else {
                         processedRows[rowKey] = []; 
                    }
                });
            }
            return {
              section: sl.section, rows: processedRows, style: sl.style, assignedCategoryName: finalAssignedCategoryName
            };
          });
        } else { throw new Error("seatingLayout form data is not an array string."); }
      } catch (e) { 
        return NextResponse.json({ error: 'Invalid format for seatingLayout. Must be a JSON array string.' }, { status: 400 });
      }
    }

    if (formData.has('ticketCategories')) {
      try {
        const ticketCategoriesString = formData.get('ticketCategories');
        let parsedTicketCategories = JSON.parse(ticketCategoriesString);
        if (Array.isArray(parsedTicketCategories)) {
          updateFields.ticketCategories = parsedTicketCategories.map(tc => ({ category: tc.category, price: parseFloat(tc.price) }));
          if (isDefaultCategoryReferencedBySeatingLayout) {
            const defaultExists = updateFields.ticketCategories.some(tc => tc.category.toLowerCase() === DEFAULT_TICKET_CATEGORY_NAME.toLowerCase());
            if (!defaultExists) {
              updateFields.ticketCategories.push({ category: DEFAULT_TICKET_CATEGORY_NAME, price: parseFloat(DEFAULT_TICKET_PRICE) });
            }
          }
        } else { throw new Error("ticketCategories form data is not an array string."); }
      } catch (e) { 
        return NextResponse.json({ error: 'Invalid format for ticketCategories. Must be a JSON array string.' }, { status: 400 });
      }
    } else if (isDefaultCategoryReferencedBySeatingLayout && !updateFields.ticketCategories && existingEvent.ticketCategories) {
        const defaultExistsInExisting = existingEvent.ticketCategories.some(tc => tc.category.toLowerCase() === DEFAULT_TICKET_CATEGORY_NAME.toLowerCase());
        if (!defaultExistsInExisting) {
            updateFields.ticketCategories = [ ...existingEvent.ticketCategories, { category: DEFAULT_TICKET_CATEGORY_NAME, price: parseFloat(DEFAULT_TICKET_PRICE) }];
        }
    } else if (isDefaultCategoryReferencedBySeatingLayout && !updateFields.ticketCategories && !existingEvent.ticketCategories) {
         updateFields.ticketCategories = [{ category: DEFAULT_TICKET_CATEGORY_NAME, price: parseFloat(DEFAULT_TICKET_PRICE) }];
    }

    const finalPromoCodeObjectIds = []; 
    if (formData.has('promoCodes')) {
      const promoCodesString = formData.get('promoCodes');
      let submittedPromoCodesArray = [];
      try {
        submittedPromoCodesArray = JSON.parse(promoCodesString);
        if (!Array.isArray(submittedPromoCodesArray)) throw new Error("Promo codes data is not an array string.");
      } catch (e) {
        return NextResponse.json({ error: 'Invalid format for promoCodes.' }, { status: 400 });
      }
      const existingDbPromoCodes = await db.collection('promoCodes').find({ eventId: eventObjectId }).toArray();
      const processedSubmittedIds = new Set(); 
      for (const submittedPc of submittedPromoCodesArray) {
        const codeStr = (submittedPc.code || '').toUpperCase();
        if (!codeStr) continue;
        const pcData = {
          eventId: eventObjectId, code: codeStr,
          discountType: submittedPc.discountType, discountValue: parseFloat(submittedPc.discountValue),
          maxUses: submittedPc.maxUses ? parseInt(submittedPc.maxUses) : null,
          expiryDate: submittedPc.expiryDate ? new Date(submittedPc.expiryDate) : null,
          updatedAt: new Date(),
        };
        let promoObjectId;
        if (submittedPc._id && ObjectId.isValid(submittedPc._id)) { 
          const existingDbVersion = existingDbPromoCodes.find(p => p._id.toString() === submittedPc._id);
          if (existingDbVersion) {
            pcData.currentUses = existingDbVersion.currentUses; 
            if (submittedPc.hasOwnProperty('currentUses')) pcData.currentUses = parseInt(submittedPc.currentUses);
            if (existingDbVersion.code !== codeStr) {
                const conflictByNewCode = await db.collection('promoCodes').findOne({ eventId: eventObjectId, code: codeStr, _id: { $ne: existingDbVersion._id } });
                if (conflictByNewCode) pcData.code = existingDbVersion.code;
            }
            await db.collection('promoCodes').updateOne({ _id: existingDbVersion._id }, { $set: pcData });
            promoObjectId = existingDbVersion._id;
          } else { 
            const existingByCode = await db.collection('promoCodes').findOne({ eventId: eventObjectId, code: codeStr });
             if (existingByCode) { 
                pcData.currentUses = existingByCode.currentUses;
                if (submittedPc.hasOwnProperty('currentUses')) pcData.currentUses = parseInt(submittedPc.currentUses);
                await db.collection('promoCodes').updateOne({ _id: existingByCode._id }, { $set: pcData });
                promoObjectId = existingByCode._id;
             } else { 
                pcData.createdAt = new Date(); pcData.currentUses = 0;
                const insertResult = await db.collection('promoCodes').insertOne(pcData);
                promoObjectId = insertResult.insertedId;
             }
          }
        } else { 
          const existingByCode = await db.collection('promoCodes').findOne({ eventId: eventObjectId, code: codeStr });
          if (existingByCode) {
            pcData.currentUses = existingByCode.currentUses;
            if (submittedPc.hasOwnProperty('currentUses')) pcData.currentUses = parseInt(submittedPc.currentUses);
            await db.collection('promoCodes').updateOne({ _id: existingByCode._id }, { $set: pcData });
            promoObjectId = existingByCode._id;
          } else { 
            pcData.createdAt = new Date(); pcData.currentUses = 0;
            const insertResult = await db.collection('promoCodes').insertOne(pcData);
            promoObjectId = insertResult.insertedId;
          }
        }
        if(promoObjectId) {
            finalPromoCodeObjectIds.push(promoObjectId);
            processedSubmittedIds.add(promoObjectId.toString());
        }
      }
      for (const dbPc of existingDbPromoCodes) {
        if (!processedSubmittedIds.has(dbPc._id.toString())) {
          await db.collection('promoCodes').deleteOne({ _id: dbPc._id });
        }
      }
      updateFields.promoCodeIds = finalPromoCodeObjectIds;
    } else if (formData.has('promoCodes') && formData.get('promoCodes') === '[]') {
        await db.collection('promoCodes').deleteMany({ eventId: eventObjectId });
        updateFields.promoCodeIds = [];
    }

    if (Object.keys(updateFields).length > 1 || (Object.keys(updateFields).length === 1 && updateFields.updatedAt) ) { 
        const updateResult = await db.collection('events').updateOne({ _id: eventObjectId }, { $set: updateFields });
        if (updateResult.matchedCount === 0) return NextResponse.json({ error: 'Event not found for update' }, { status: 404 });
        
        if (updateFields.seatingLayout && Array.isArray(updateFields.seatingLayout)) {
            try { await db.collection('seats').deleteMany({ eventId: eventObjectId }); } catch (e) { console.error("Error clearing seats:", e); }
            const seatsToCreate = [];
            for (const section of updateFields.seatingLayout) {
                if (section.rows && typeof section.rows === 'object') {
                for (const rowKey in section.rows) {
                    if (Array.isArray(section.rows[rowKey])) {
                    for (const seatObj of section.rows[rowKey]) {
                        seatsToCreate.push({
                        eventId: eventObjectId, section: section.section, row: rowKey,
                        seatNumber: String(seatObj.number), status: 'available', 
                        createdAt: new Date(), updatedAt: new Date()
                        });
                    } } } }
            }
            if (seatsToCreate.length > 0) {
                try { await db.collection('seats').insertMany(seatsToCreate, { ordered: false }); } 
                catch (e) { console.error("Error re-creating seats:", e); }
            }
        }
    }
    const updatedEventFromDb = await db.collection('events').findOne({ _id: eventObjectId });
    const sanitizedUpdatedEvent = updatedEventFromDb ? {
        ...updatedEventFromDb, _id: updatedEventFromDb._id.toString(),
        organizerId: updatedEventFromDb.organizerId ? updatedEventFromDb.organizerId.toString() : null,
        promoCodeIds: updatedEventFromDb.promoCodeIds ? updatedEventFromDb.promoCodeIds.map(id => id.toString()) : [],
         ticketCategories: updatedEventFromDb.ticketCategories ? updatedEventFromDb.ticketCategories.map(tc => ({ ...tc, _id: tc._id ? tc._id.toString() : undefined })) : [],
    } : null;
    return NextResponse.json({ message: 'Event updated successfully', event: sanitizedUpdatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const paramsObject = await context.params; 
    const eventId = paramsObject.eventId;
    if (!eventId || !ObjectId.isValid(eventId)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { db } = await connectToDatabase();
    const eventObjectId = new ObjectId(eventId);
    const existingEvent = await db.collection('events').findOne({ _id: eventObjectId });
    if (!existingEvent) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    const organizerIdAsString = existingEvent.organizerId.toString();
    if (session.user.role !== 'admin' && organizerIdAsString !== session.user.id) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    if (existingEvent.cloudinaryPublicId) {
      try { await cloudinary.uploader.destroy(existingEvent.cloudinaryPublicId); } catch (e) { console.warn("Cloudinary delete error:", e.message); }
    }
    await db.collection('promoCodes').deleteMany({ eventId: eventObjectId });
    await db.collection('ticketTypes').deleteMany({ eventId: eventObjectId }); 
    await db.collection('bookings').deleteMany({ eventId: eventObjectId });
    await db.collection('tickets').deleteMany({ eventId: eventObjectId });
    await db.collection('waitlist').deleteMany({ eventId: eventObjectId });
    await db.collection('seats').deleteMany({ eventId: eventObjectId }); 
    const deleteResult = await db.collection('events').deleteOne({ _id: eventObjectId });
    if (deleteResult.deletedCount === 0) return NextResponse.json({ error: 'Event not found for deletion' }, { status: 404 });
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event', details: error.message }, { status: 500 });
  }
}
