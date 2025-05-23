// src/app/api/promo-codes/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// CREATE - Create a new promotional code
export async function POST(request) {
  try {
    const data = await request.json();
    const { eventId, code, discountType, discountValue, maxUses, expiryDate } = data;
    
    if (!eventId || !code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: 'Event ID, code, discount type, and discount value are required' },
        { status: 400 }
      );
    }
    if (!ObjectId.isValid(eventId)) {
        return NextResponse.json({ error: 'Invalid Event ID format for creation' }, { status: 400 });
    }
    
    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Discount type must be either "percentage" or "fixed"' },
        { status: 400 }
      );
    }
    
    if (discountType === 'percentage' && (parseFloat(discountValue) <= 0 || parseFloat(discountValue) > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 1 and 100' },
        { status: 400 }
      );
    }
     if (discountType === 'fixed' && parseFloat(discountValue) <= 0) {
      return NextResponse.json(
        { error: 'Fixed discount value must be greater than 0' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }
    if (!['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role' }, { status: 403 });
    }
    
    const { db } = await connectToDatabase();
    const eventObjectId = new ObjectId(eventId);
    
    const event = await db.collection('events').findOne({ _id: eventObjectId });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (session.user.role === 'organizer' && event.organizerId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this event' }, { status: 403 });
    }
    
    const existingCode = await db.collection('promoCodes').findOne({
      eventId: eventObjectId,
      code: code.toUpperCase()
    });
    if (existingCode) {
      return NextResponse.json({ error: 'This promotional code already exists for this event' }, { status: 400 });
    }
    
    const promoCode = {
      eventId: eventObjectId,
      code: code.toUpperCase(),
      discountType,
      discountValue: parseFloat(discountValue),
      maxUses: maxUses ? parseInt(maxUses) : null,
      currentUses: 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('promoCodes').insertOne(promoCode);
    
    return NextResponse.json({
      message: 'Promotional code created successfully',
      promoCode: {
        ...promoCode,
        _id: result.insertedId.toString(),
        eventId: promoCode.eventId.toString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating promotional code:', error);
    return NextResponse.json({ error: 'Failed to create promotional code', details: error.message }, { status: 500 });
  }
}

// READ - Get all promotional codes for an event or validate a specific code
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const codeToValidate = searchParams.get('code'); // Renamed for clarity
    
    const session = await getServerSession(authOptions);
    // Public validation of a specific code might not require a session,
    // but listing codes for an event definitely does.
    // For now, let's assume a session is needed for all GET operations here for simplicity,
    // as the primary use case (edit page) requires it.
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    
    // Case 1: Validate a specific promotional code for an event
    if (codeToValidate && eventId) {
      if (!ObjectId.isValid(eventId)) {
        return NextResponse.json({ error: 'Invalid Event ID format for validation' }, { status: 400 });
      }
      const eventObjectId = new ObjectId(eventId);
      const promoCode = await db.collection('promoCodes').findOne({
        eventId: eventObjectId,
        code: codeToValidate.toUpperCase()
      });
      
      if (!promoCode) {
        return NextResponse.json({ valid: false, error: 'Invalid promotional code' }, { status: 404 });
      }
      if (promoCode.expiryDate && new Date() > new Date(promoCode.expiryDate)) {
        return NextResponse.json({ valid: false, error: 'This promotional code has expired' }, { status: 400 });
      }
      if (promoCode.maxUses !== null && promoCode.currentUses >= promoCode.maxUses) {
        return NextResponse.json({ valid: false, error: 'This promotional code has reached its maximum number of uses' }, { status: 400 });
      }
      
      return NextResponse.json({
        valid: true,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        _id: promoCode._id.toString(),
        eventId: promoCode.eventId.toString(),
      });
    }
    
    // Case 2: Get all promotional codes for a specific event (for organizer/admin edit page)
    if (eventId && !codeToValidate) { // Ensure codeToValidate is not present for this block
      if (!ObjectId.isValid(eventId)) {
         return NextResponse.json({ error: 'Invalid Event ID format for listing' }, { status: 400 });
      }
      if (!['organizer', 'admin'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient role to view promo codes' }, { status: 403 });
      }
      
      const eventObjectId = new ObjectId(eventId);
      if (session.user.role === 'organizer') {
        const event = await db.collection('events').findOne({
          _id: eventObjectId,
          organizerId: new ObjectId(session.user.id) // Compare with ObjectId
        });
        if (!event) {
          return NextResponse.json({ error: 'Forbidden: You do not have permission to view promotional codes for this event' }, { status: 403 });
        }
      }
      
      const promoCodesForEvent = await db.collection('promoCodes')
        .find({ eventId: eventObjectId })
        .sort({ createdAt: -1 })
        .toArray();
      
      const sanitizedPromoCodes = promoCodesForEvent.map(pc => ({
        ...pc,
        _id: pc._id.toString(),
        eventId: pc.eventId.toString(),
        // expiryDate is a Date object from DB, frontend will format it
      }));
      return NextResponse.json(sanitizedPromoCodes);
    }
    
    // Case 3: Get all promo codes (admin only) or for an organizer's events (if no specific eventId)
    // This part is less likely to be the cause of the edit page issue but included for completeness.
    if (!eventId && !codeToValidate) {
        if (session.user.role === 'admin') {
            const allPromoCodes = await db.collection('promoCodes').find({}).sort({ createdAt: -1 }).toArray();
            return NextResponse.json(allPromoCodes.map(pc => ({...pc, _id: pc._id.toString(), eventId: pc.eventId.toString()})));
        } else if (session.user.role === 'organizer') {
            const organizerEvents = await db.collection('events')
                .find({ organizerId: new ObjectId(session.user.id) }) // Compare with ObjectId
                .project({ _id: 1 })
                .toArray();
            const eventIds = organizerEvents.map(event => event._id); // These are ObjectIds
            const organizerPromoCodes = await db.collection('promoCodes')
                .find({ eventId: { $in: eventIds } })
                .sort({ createdAt: -1 })
                .toArray();
            return NextResponse.json(organizerPromoCodes.map(pc => ({...pc, _id: pc._id.toString(), eventId: pc.eventId.toString()})));
        } else {
            return NextResponse.json({ error: 'Forbidden: Insufficient role for this query' }, { status: 403 });
        }
    }

    // If no specific case matched (should not happen if eventId is always passed from edit page)
    return NextResponse.json({ error: 'Invalid request parameters for fetching promo codes' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching promotional codes:', error);
    return NextResponse.json({ error: 'Failed to fetch promotional codes', details: error.message }, { status: 500 });
  }
}
