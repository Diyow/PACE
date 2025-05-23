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

export async function GET(request, context) {
  try {
    const paramsObject = await context.params;
    const eventId = paramsObject.eventId;

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId)
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // --- Fetch Organizer Details ---
    let organizerName = 'PACE Events Platform'; 
    if (event.organizerId && ObjectId.isValid(event.organizerId.toString())) { // Ensure organizerId is valid before querying
      const organizer = await db.collection('users').findOne(
        { _id: new ObjectId(event.organizerId.toString()) },
        { projection: { fullName: 1, organizationName: 1 } } 
      );
      if (organizer) {
        organizerName = organizer.organizationName || organizer.fullName || organizerName;
      }
    }
    event.organizerName = organizerName;

    // --- Calculate Ticket Statistics ---
    let totalCapacity = 0;
    if (event.seatingLayout && Array.isArray(event.seatingLayout)) {
      event.seatingLayout.forEach(section => {
        if (section.rows && typeof section.rows === 'object') {
          Object.values(section.rows).forEach(rowSeatsArray => {
            if (Array.isArray(rowSeatsArray)) {
              totalCapacity += rowSeatsArray.length;
            }
          });
        }
      });
    }
    event.totalCapacity = totalCapacity;

    const ticketsPurchased = await db.collection('tickets').countDocuments({
      eventId: new ObjectId(eventId),
      status: 'Confirmed' // ***** MODIFIED LINE: Changed from 'confirmed' to 'Confirmed' *****
    });
    event.ticketsPurchased = ticketsPurchased;
    event.ticketsAvailable = Math.max(0, totalCapacity - ticketsPurchased); 

    // Convert ObjectIds to strings for client-side compatibility for the main event object
    const sanitizedEvent = {
        ...event,
        _id: event._id.toString(),
        organizerId: event.organizerId ? event.organizerId.toString() : null,
        // Other ObjectId fields in the event object if any should also be converted
        // seatingLayout and ticketCategories might contain ObjectIds if they are references,
        // but typically they are embedded arrays of objects or primitive values.
        // If they do contain ObjectIds that client needs as strings, map over them here.
        // For example, if ticketCategories had _id fields from a ticketTypes collection:
        ticketCategories: event.ticketCategories ? event.ticketCategories.map(tc => ({
            ...tc,
            _id: tc._id ? tc._id.toString() : undefined // If ticket categories have their own _ids
        })) : [],
        promoCodeIds: event.promoCodeIds ? event.promoCodeIds.map(id => id.toString()) : [],
    };


    return NextResponse.json(sanitizedEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event', details: error.message },
      { status: 500 }
    );
  }
}

// PUT and DELETE functions remain the same as previously provided ...
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
    const existingEvent = await db.collection('events').findOne({ _id: new ObjectId(eventId) });

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

    // Basic event fields
    if (formData.has('eventName')) updateFields.name = formData.get('eventName');
    if (formData.has('date')) updateFields.date = formData.get('date');
    if (formData.has('time')) updateFields.time = formData.get('time');
    if (formData.has('description')) updateFields.description = formData.get('description');
    if (formData.has('status')) updateFields.status = formData.get('status');
    if (formData.has('organizerId') && ObjectId.isValid(formData.get('organizerId'))) { // If admin changes organizer
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
        console.error('Cloudinary: Failed to upload new event poster for update:', uploadError);
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
            // Ensure rows data is structured as expected by other parts of the system
            // Example: if rows should be { A: [{number:1},...], B: ... }
            let processedRows = {};
            if (typeof sl.rows === 'object' && sl.rows !== null) {
                Object.entries(sl.rows).forEach(([rowKey, seatsArray]) => {
                    if (Array.isArray(seatsArray)) {
                        processedRows[rowKey] = seatsArray.map(seat => (typeof seat === 'object' ? seat : { number: seat, status: 'available' }));
                    } else {
                         console.warn(`Row ${rowKey} in section ${sl.section} is not an array.`);
                         processedRows[rowKey] = []; // Default to empty array if format is incorrect
                    }
                });
            }

            return {
              section: sl.section,
              rows: processedRows, // Use processed rows
              style: sl.style,
              assignedCategoryName: finalAssignedCategoryName
            };
          });
        } else { throw new Error("seatingLayout form data is not an array string."); }
      } catch (e) { 
        console.error("Error processing seatingLayout in PUT:", e);
        return NextResponse.json({ error: 'Invalid format for seatingLayout. Must be a JSON array string.' }, { status: 400 });
      }
    }

    if (formData.has('ticketCategories')) {
      try {
        const ticketCategoriesString = formData.get('ticketCategories');
        let parsedTicketCategories = JSON.parse(ticketCategoriesString);
        if (Array.isArray(parsedTicketCategories)) {
          updateFields.ticketCategories = parsedTicketCategories.map(tc => ({
            category: tc.category,
            price: parseFloat(tc.price)
            // _id: tc._id ? new ObjectId(tc._id) : new ObjectId() // Handle _id if you are managing ticketCategories as separate docs
          }));

          if (isDefaultCategoryReferencedBySeatingLayout) {
            const defaultExists = updateFields.ticketCategories.some(
              tc => tc.category.toLowerCase() === DEFAULT_TICKET_CATEGORY_NAME.toLowerCase()
            );
            if (!defaultExists) {
              updateFields.ticketCategories.push({
                category: DEFAULT_TICKET_CATEGORY_NAME,
                price: parseFloat(DEFAULT_TICKET_PRICE) 
              });
            }
          }
        } else { throw new Error("ticketCategories form data is not an array string."); }
      } catch (e) { 
        console.error("Error processing ticketCategories in PUT:", e);
        return NextResponse.json({ error: 'Invalid format for ticketCategories. Must be a JSON array string.' }, { status: 400 });
      }
    } else if (isDefaultCategoryReferencedBySeatingLayout && !updateFields.ticketCategories && existingEvent.ticketCategories) {
        // If no new ticket categories are provided, but default is referenced,
        // ensure default exists in the existing categories or add it.
        const defaultExistsInExisting = existingEvent.ticketCategories.some(
            tc => tc.category.toLowerCase() === DEFAULT_TICKET_CATEGORY_NAME.toLowerCase()
        );
        if (!defaultExistsInExisting) {
            updateFields.ticketCategories = [
                ...existingEvent.ticketCategories,
                { category: DEFAULT_TICKET_CATEGORY_NAME, price: parseFloat(DEFAULT_TICKET_PRICE) }
            ];
        }
    } else if (isDefaultCategoryReferencedBySeatingLayout && !updateFields.ticketCategories && !existingEvent.ticketCategories) {
         updateFields.ticketCategories = [{
            category: DEFAULT_TICKET_CATEGORY_NAME,
            price: parseFloat(DEFAULT_TICKET_PRICE)
        }];
    }


    const finalPromoCodeObjectIds = []; 
    if (formData.has('promoCodes')) {
      const promoCodesString = formData.get('promoCodes');
      let submittedPromoCodesArray = [];
      try {
        submittedPromoCodesArray = JSON.parse(promoCodesString);
        if (!Array.isArray(submittedPromoCodesArray)) {
          throw new Error("Promo codes data from FormData is not an array string.");
        }
      } catch (e) {
        console.error("Error parsing promoCodes for update:", e);
        return NextResponse.json({ error: 'Invalid format for promoCodes. Must be a JSON array string.' }, { status: 400 });
      }

      const existingDbPromoCodes = await db.collection('promoCodes').find({ eventId: new ObjectId(eventId) }).toArray();
      const existingDbCodesMap = new Map(existingDbPromoCodes.map(pc => [pc._id.toString(), pc]));
      const processedSubmittedIds = new Set(); 

      for (const submittedPc of submittedPromoCodesArray) {
        const codeStr = (submittedPc.code || '').toUpperCase();
        if (!codeStr) continue;

        const pcData = {
          eventId: new ObjectId(eventId), code: codeStr,
          discountType: submittedPc.discountType, discountValue: parseFloat(submittedPc.discountValue),
          maxUses: submittedPc.maxUses ? parseInt(submittedPc.maxUses) : null,
          expiryDate: submittedPc.expiryDate ? new Date(submittedPc.expiryDate) : null,
          updatedAt: new Date(),
        };
        let promoObjectId;

        if (submittedPc._id && ObjectId.isValid(submittedPc._id)) { 
          const existingDbVersion = existingDbCodesMap.get(submittedPc._id.toString());
          if (existingDbVersion) {
            pcData.currentUses = existingDbVersion.currentUses; 
            if (submittedPc.hasOwnProperty('currentUses') && parseInt(submittedPc.currentUses) !== existingDbVersion.currentUses) {
                 pcData.currentUses = parseInt(submittedPc.currentUses);
            }
            if (existingDbVersion.code !== codeStr) { // If code string is being changed
                const conflictByNewCode = await db.collection('promoCodes').findOne({ eventId: new ObjectId(eventId), code: codeStr, _id: { $ne: existingDbVersion._id } });
                if (conflictByNewCode) {
                    console.warn(`Promo code update for _id ${submittedPc._id} to code "${codeStr}" conflicts with another existing code. Keeping original code "${existingDbVersion.code}".`);
                    pcData.code = existingDbVersion.code; // Revert to original code to avoid conflict
                }
            }
            await db.collection('promoCodes').updateOne({ _id: existingDbVersion._id }, { $set: pcData });
            promoObjectId = existingDbVersion._id;
          } else { // Submitted _id not found in DB for this event, treat as new if code doesn'
            const existingByCode = await db.collection('promoCodes').findOne({ eventId: new ObjectId(eventId), code: codeStr });
             if (existingByCode) { // Code string already exists, update that one instead
                pcData.currentUses = existingByCode.currentUses;
                 if (submittedPc.hasOwnProperty('currentUses') && parseInt(submittedPc.currentUses) !== existingByCode.currentUses) {pcData.currentUses = parseInt(submittedPc.currentUses);}
                await db.collection('promoCodes').updateOne({ _id: existingByCode._id }, { $set: pcData });
                promoObjectId = existingByCode._id;
             } else { // Neither _id nor code string exists, create new
                pcData.createdAt = new Date(); pcData.currentUses = 0;
                const insertResult = await db.collection('promoCodes').insertOne(pcData);
                promoObjectId = insertResult.insertedId;
             }
          }
        } else { // No _id submitted, check by code string
          const existingByCode = await db.collection('promoCodes').findOne({ eventId: new ObjectId(eventId), code: codeStr });
          if (existingByCode) {
            pcData.currentUses = existingByCode.currentUses;
             if (submittedPc.hasOwnProperty('currentUses') && parseInt(submittedPc.currentUses) !== existingByCode.currentUses) {pcData.currentUses = parseInt(submittedPc.currentUses);}
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

      // Delete promo codes from DB that were not in the submitted list
      for (const dbPc of existingDbPromoCodes) {
        if (!processedSubmittedIds.has(dbPc._id.toString())) {
          await db.collection('promoCodes').deleteOne({ _id: dbPc._id });
        }
      }
      updateFields.promoCodeIds = finalPromoCodeObjectIds; // Update event with the final list of associated promo code ObjectIds
    } else if (formData.has('promoCodes') && formData.get('promoCodes') === '[]') { // Explicitly empty array means clear all
        await db.collection('promoCodes').deleteMany({ eventId: new ObjectId(eventId) });
        updateFields.promoCodeIds = [];
    }
    // If 'promoCodes' is not in formData at all, existing promoCodeIds on event are untouched (unless modified by other logic)


    if (Object.keys(updateFields).length > 1 || (Object.keys(updateFields).length === 1 && updateFields.updatedAt) ) { 
        const updateResult = await db.collection('events').updateOne(
          { _id: new ObjectId(eventId) },
          { $set: updateFields }
        );

        if (updateResult.matchedCount === 0) {
            return NextResponse.json({ error: 'Event not found for update (race condition or ID issue)' }, { status: 404 });
        }
        // if (updateResult.modifiedCount === 0 && Object.keys(updateFields).length > 1 && !formData.has('removePoster')) { 
        //     // The removePoster logic might not count as a modification if fields were already null
        //     console.warn(`Event ${eventId} PUT request resulted in no document modifications besides updatedAt.`);
        // }

        // *** Synchronize 'seats' collection if seatingLayout was updated ***
        if (updateFields.seatingLayout && Array.isArray(updateFields.seatingLayout)) {
            try {
                await db.collection('seats').deleteMany({ eventId: new ObjectId(eventId) });
                console.log(`Cleared existing seat documents for event ${eventId} during update.`);
            } catch (deletionError) {
                console.error(`Error clearing existing seats for event ${eventId}:`, deletionError);
            }

            const seatsToCreateInCollection = [];
            for (const section of updateFields.seatingLayout) {
                if (section.rows && typeof section.rows === 'object') {
                for (const rowKey in section.rows) {
                    if (Array.isArray(section.rows[rowKey])) {
                    for (const seatObj of section.rows[rowKey]) {
                        seatsToCreateInCollection.push({
                        eventId: new ObjectId(eventId),
                        section: section.section,
                        row: rowKey,
                        seatNumber: String(seatObj.number),
                        status: 'available', 
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
                console.log(`Re-created ${seatsToCreateInCollection.length} seat documents for event ${eventId} after layout update.`);
                } catch (seatCreationError) {
                console.error(`Error re-creating seat documents for event ${eventId}:`, seatCreationError);
                }
            }
        }
        // *** END OF SEAT SYNCHRONIZATION ***

    } else {
        console.log(`No fields to update for event ${eventId} besides updatedAt (or only poster removal).`);
    }

    const updatedEventFromDb = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
    // Sanitize event for response
    const sanitizedUpdatedEvent = updatedEventFromDb ? {
        ...updatedEventFromDb,
        _id: updatedEventFromDb._id.toString(),
        organizerId: updatedEventFromDb.organizerId ? updatedEventFromDb.organizerId.toString() : null,
        promoCodeIds: updatedEventFromDb.promoCodeIds ? updatedEventFromDb.promoCodeIds.map(id => id.toString()) : [],
         ticketCategories: updatedEventFromDb.ticketCategories ? updatedEventFromDb.ticketCategories.map(tc => ({
            ...tc,
            _id: tc._id ? tc._id.toString() : undefined
        })) : [],
    } : null;


    return NextResponse.json({
      message: 'Event updated successfully',
      event: sanitizedUpdatedEvent
    });

  } catch (error) {
    console.error('Error updating event:', error);
    let errorMessage = 'Failed to update event';
    if (error instanceof Error) { 
        errorMessage = error.message || errorMessage;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    return NextResponse.json(
      { error: 'Failed to update event', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const paramsObject = await context.params; 
    const eventId = paramsObject.eventId;

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const existingEvent = await db.collection('events').findOne({ _id: new ObjectId(eventId) });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const organizerIdAsString = existingEvent.organizerId.toString();
    if (session.user.role !== 'admin' && organizerIdAsString !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission to delete this event' }, { status: 403 });
    }

    if (existingEvent.cloudinaryPublicId) {
      try { await cloudinary.uploader.destroy(existingEvent.cloudinaryPublicId); } catch (e) { console.warn("Cloudinary: Failed to delete poster during event deletion:", e.message); }
    }
    
    // Delete associated data
    await db.collection('promoCodes').deleteMany({ eventId: new ObjectId(eventId) });
    await db.collection('ticketTypes').deleteMany({ eventId: new ObjectId(eventId) });
    await db.collection('bookings').deleteMany({ eventId: new ObjectId(eventId) });
    await db.collection('tickets').deleteMany({ eventId: new ObjectId(eventId) });
    await db.collection('waitlist').deleteMany({ eventId: new ObjectId(eventId) });
    await db.collection('seats').deleteMany({ eventId: new ObjectId(eventId) }); // Also delete seats from the 'seats' collection

    const deleteResult = await db.collection('events').deleteOne({ _id: new ObjectId(eventId) });

    if (deleteResult.deletedCount === 0) {
        return NextResponse.json({ error: 'Event not found for deletion or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', details: error.message },
      { status: 500 }
    );
  }
}