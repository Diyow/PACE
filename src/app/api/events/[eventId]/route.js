// src/app/api/events/[eventId]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

const DEFAULT_TICKET_CATEGORY_NAME = "Regular";
const DEFAULT_TICKET_PRICE = "10.00"; // Ensure this is consistent if used

// GET and DELETE functions remain the same as previously provided ...
export async function GET(request, context) {
  try {
    const paramsObject = await context.params; // Correctly await context.params
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
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    const paramsObject = await context.params; // Correctly await context.params
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

    // Basic event details
    if (formData.has('eventName')) {
        updateFields.name = formData.get('eventName'); // 'name' is the DB field
    }
    if (formData.has('date')) updateFields.date = formData.get('date');
    if (formData.has('time')) updateFields.time = formData.get('time');
    if (formData.has('description')) updateFields.description = formData.get('description');
    if (formData.has('status')) updateFields.status = formData.get('status');

    // Poster handling (same as previous correct version)
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
    
    // SeatingLayout: Default unassigned to "Regular"
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
            return {
              section: sl.section,
              rows: sl.rows,
              style: sl.style,
              assignedCategoryName: finalAssignedCategoryName
            };
          });
        } else { throw new Error("seatingLayout form data is not an array string."); }
      } catch (e) { return NextResponse.json({ error: 'Invalid format for seatingLayout. Must be a JSON array string.' }, { status: 400 });}
    }

    // TicketCategories: Ensure "Regular" exists if referenced by seating
    if (formData.has('ticketCategories')) {
      try {
        const ticketCategoriesString = formData.get('ticketCategories');
        let parsedTicketCategories = JSON.parse(ticketCategoriesString);
        if (Array.isArray(parsedTicketCategories)) {
          updateFields.ticketCategories = parsedTicketCategories.map(tc => ({
            category: tc.category,
            price: parseFloat(tc.price)
          }));

          if (isDefaultCategoryReferencedBySeatingLayout) {
            const defaultExists = updateFields.ticketCategories.some(
              tc => tc.category.toLowerCase() === DEFAULT_TICKET_CATEGORY_NAME.toLowerCase()
            );
            if (!defaultExists) {
              updateFields.ticketCategories.push({
                category: DEFAULT_TICKET_CATEGORY_NAME,
                price: parseFloat(DEFAULT_TICKET_PRICE) // Ensure you have a default price
              });
            }
          }
        } else { throw new Error("ticketCategories form data is not an array string."); }
      } catch (e) { return NextResponse.json({ error: 'Invalid format for ticketCategories. Must be a JSON array string.' }, { status: 400 });}
    } else if (isDefaultCategoryReferencedBySeatingLayout) {
        // If no ticket categories were sent but default is needed for seating
        updateFields.ticketCategories = [{
            category: DEFAULT_TICKET_CATEGORY_NAME,
            price: parseFloat(DEFAULT_TICKET_PRICE)
        }];
    }


    // --- PROMO CODE SYNCHRONIZATION LOGIC (Using the robust version from prior responses) ---
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

        if (submittedPc._id) { 
          const existingDbVersion = existingDbCodesMap.get(submittedPc._id.toString());
          if (existingDbVersion) {
            pcData.currentUses = existingDbVersion.currentUses; 
            if (submittedPc.hasOwnProperty('currentUses') && parseInt(submittedPc.currentUses) !== existingDbVersion.currentUses) {
                 pcData.currentUses = parseInt(submittedPc.currentUses);
            }
            if (existingDbVersion.code !== codeStr) {
                const conflict = existingDbPromoCodes.find(p => p.code === codeStr && p._id.toString() !== submittedPc._id.toString());
                if (conflict) {
                    console.warn(`Promo code update for _id ${submittedPc._id} to code "${codeStr}" conflicts. Keeping original.`);
                    finalPromoCodeObjectIds.push(existingDbVersion._id); 
                    processedSubmittedIds.add(existingDbVersion._id.toString());
                    continue;
                }
            }
            await db.collection('promoCodes').updateOne({ _id: existingDbVersion._id }, { $set: pcData });
            promoObjectId = existingDbVersion._id;
          } else {
            console.warn(`Promo code with _id ${submittedPc._id} submitted but not found. Attempting to treat as new based on code string.`);
            // Fallback: try to find by code string if ID match failed, or create if not found by code string
             const existingByCode = existingDbPromoCodes.find(p => p.code === codeStr);
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
        } else { 
          const existingByCode = existingDbPromoCodes.find(p => p.code === codeStr);
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

      for (const dbPc of existingDbPromoCodes) {
        if (!processedSubmittedIds.has(dbPc._id.toString())) {
          await db.collection('promoCodes').deleteOne({ _id: dbPc._id });
        }
      }
      updateFields.promoCodeIds = finalPromoCodeObjectIds;
    } 
    // If formData does not have 'promoCodes', promoCodeIds in updateFields will not be set,
    // meaning the event's promoCodeIds array remains unchanged from what's in existingEvent.
    // This is intentional: if the client doesn't send the field, we assume no change to this aspect.
    // If client sends an empty array, all promo codes for the event will be deleted.

    // Perform the update to the event document
    if (Object.keys(updateFields).length > 1 || updateFields.updatedAt) { // Check if there's more than just updatedAt
        const updateResult = await db.collection('events').updateOne(
          { _id: new ObjectId(eventId) },
          { $set: updateFields }
        );

        if (updateResult.matchedCount === 0) {
            return NextResponse.json({ error: 'Event not found for update (race condition or ID issue)' }, { status: 404 });
        }
        if (updateResult.modifiedCount === 0 && Object.keys(updateFields).length > 1) { 
            console.warn(`Event ${eventId} PUT request resulted in no document modifications besides updatedAt.`);
        }
    } else {
        console.log(`No fields to update for event ${eventId} besides updatedAt.`);
    }


    const updatedEventFromDb = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
    return NextResponse.json({
      message: 'Event updated successfully',
      event: updatedEventFromDb
    });

  } catch (error) {
    console.error('Error updating event:', error);
    // Ensure a response is always returned
    let errorMessage = 'Failed to update event';
    if (error instanceof Error) { // Basic check if error is an Error object
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
    const paramsObject = await context.params; // Correctly await context.params
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
    
    await db.collection('promoCodes').deleteMany({ eventId: new ObjectId(eventId) });
    // TODO: Add deletion for other related data: ticketTypes (if not embedded), bookings, tickets, waitlist.

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