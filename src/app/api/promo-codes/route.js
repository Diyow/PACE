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
    
    // Validate required fields
    if (!eventId || !code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: 'Event ID, code, discount type, and discount value are required' },
        { status: 400 }
      );
    }
    
    // Validate discount type
    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Discount type must be either "percentage" or "fixed"' },
        { status: 400 }
      );
    }
    
    // Validate discount value
    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 1 and 100' },
        { status: 400 }
      );
    }
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if the event exists and belongs to the organizer
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId),
      ...(session.user.role === 'organizer' ? { organizerId: session.user.id } : {})
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or you do not have permission' },
        { status: 404 }
      );
    }
    
    // Check if the code already exists for this event
    const existingCode = await db.collection('promoCodes').findOne({
      eventId: new ObjectId(eventId),
      code: code.toUpperCase()
    });
    
    if (existingCode) {
      return NextResponse.json(
        { error: 'This promotional code already exists for this event' },
        { status: 400 }
      );
    }
    
    // Create the promotional code
    const promoCode = {
      eventId: new ObjectId(eventId),
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
      promoCodeId: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating promotional code:', error);
    return NextResponse.json(
      { error: 'Failed to create promotional code' },
      { status: 500 }
    );
  }
}

// READ - Get all promotional codes for an event or validate a specific code
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const code = searchParams.get('code');
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // If code is provided, validate it
    if (code && eventId) {
      const promoCode = await db.collection('promoCodes').findOne({
        eventId: new ObjectId(eventId),
        code: code.toUpperCase()
      });
      
      if (!promoCode) {
        return NextResponse.json(
          { error: 'Invalid promotional code' },
          { status: 404 }
        );
      }
      
      // Check if the code has expired
      if (promoCode.expiryDate && new Date() > new Date(promoCode.expiryDate)) {
        return NextResponse.json(
          { error: 'This promotional code has expired' },
          { status: 400 }
        );
      }
      
      // Check if the code has reached its maximum uses
      if (promoCode.maxUses !== null && promoCode.currentUses >= promoCode.maxUses) {
        return NextResponse.json(
          { error: 'This promotional code has reached its maximum number of uses' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        valid: true,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue
      });
    }
    
    // If eventId is provided, get all codes for that event (admin/organizer only)
    if (eventId) {
      if (!['organizer', 'admin'].includes(session.user.role)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // For organizers, check if they own the event
      if (session.user.role === 'organizer') {
        const event = await db.collection('events').findOne({
          _id: new ObjectId(eventId),
          organizerId: session.user.id
        });
        
        if (!event) {
          return NextResponse.json(
            { error: 'You do not have permission to view promotional codes for this event' },
            { status: 403 }
          );
        }
      }
      
      const promoCodes = await db.collection('promoCodes')
        .find({ eventId: new ObjectId(eventId) })
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json(promoCodes);
    }
    
    // If no parameters provided, return based on role
    if (session.user.role === 'admin') {
      // Admins can see all promo codes
      const promoCodes = await db.collection('promoCodes')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json(promoCodes);
    } else if (session.user.role === 'organizer') {
      // Organizers can see promo codes for their events
      const organizerEvents = await db.collection('events')
        .find({ organizerId: session.user.id })
        .project({ _id: 1 })
        .toArray();
      
      const eventIds = organizerEvents.map(event => event._id);
      
      const promoCodes = await db.collection('promoCodes')
        .find({ eventId: { $in: eventIds } })
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json(promoCodes);
    } else {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching promotional codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotional codes' },
      { status: 500 }
    );
  }
}