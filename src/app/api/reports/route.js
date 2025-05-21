import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// CREATE - Generate a new report
export async function POST(request) {
  try {
    const data = await request.json();
    const { eventId, reportType, dateRange } = data;
    
    // Validate required fields
    if (!eventId || !reportType) {
      return NextResponse.json(
        { error: 'Event ID and report type are required' },
        { status: 400 }
      );
    }
    
    // Get the current user session to verify permissions
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if the event exists and belongs to the organizer (if not admin)
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId),
      ...(session.user.role === 'organizer' ? { organizerId: session.user.id } : {})
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or you do not have permission to generate reports for this event' },
        { status: 404 }
      );
    }
    
    // Prepare date range for filtering
    let startDate, endDate;
    if (dateRange) {
      startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
    }
    
    // Generate report data based on report type
    let reportData = {};
    
    if (reportType === 'attendance') {
      // Query for attendance data
      const query = {
        eventId: new ObjectId(eventId),
        status: 'confirmed'
      };
      
      if (startDate && endDate) {
        query.createdAt = { $gte: startDate, $lte: endDate };
      }
      
      const tickets = await db.collection('tickets')
        .find(query)
        .toArray();
      
      // Calculate attendance statistics
      reportData = {
        totalAttendees: tickets.length,
        ticketTypeBreakdown: []
      };
      
      // Get ticket type breakdown
      const ticketTypes = await db.collection('ticketTypes')
        .find({ eventId: new ObjectId(eventId) })
        .toArray();
      
      for (const ticketType of ticketTypes) {
        const count = tickets.filter(ticket => 
          ticket.ticketTypeId.toString() === ticketType._id.toString()
        ).length;
        
        reportData.ticketTypeBreakdown.push({
          category: ticketType.category,
          count: count,
          percentage: tickets.length > 0 ? (count / tickets.length * 100).toFixed(2) : 0
        });
      }
    } else if (reportType === 'revenue') {
      // Query for revenue data
      const query = {
        eventId: new ObjectId(eventId),
        paymentStatus: 'completed'
      };
      
      if (startDate && endDate) {
        query.bookingDate = { $gte: startDate, $lte: endDate };
      }
      
      const bookings = await db.collection('bookings')
        .find(query)
        .toArray();
      
      // Calculate revenue statistics
      const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      
      reportData = {
        totalRevenue: totalRevenue,
        totalBookings: bookings.length,
        averageBookingValue: bookings.length > 0 ? (totalRevenue / bookings.length).toFixed(2) : 0,
        ticketTypeBreakdown: []
      };
      
      // Get ticket type breakdown
      const ticketTypes = await db.collection('ticketTypes')
        .find({ eventId: new ObjectId(eventId) })
        .toArray();
      
      // Calculate revenue per ticket type
      for (const ticketType of ticketTypes) {
        let typeRevenue = 0;
        let ticketCount = 0;
        
        for (const booking of bookings) {
          const ticketDetail = booking.ticketDetails.find(detail => 
            detail.ticketTypeId.toString() === ticketType._id.toString()
          );
          
          if (ticketDetail) {
            typeRevenue += ticketDetail.price * ticketDetail.quantity;
            ticketCount += ticketDetail.quantity;
          }
        }
        
        reportData.ticketTypeBreakdown.push({
          category: ticketType.category,
          revenue: typeRevenue,
          ticketCount: ticketCount,
          percentage: totalRevenue > 0 ? (typeRevenue / totalRevenue * 100).toFixed(2) : 0
        });
      }
    }
    
    // Create the report
    const report = {
      eventId: new ObjectId(eventId),
      reportType: reportType,
      dateRange: dateRange || null,
      generatedBy: session.user.id,
      data: reportData,
      createdAt: new Date(),
    };
    
    const result = await db.collection('reports').insertOne(report);
    
    return NextResponse.json({
      message: 'Report generated successfully',
      reportId: result.insertedId,
      report: report
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// READ - Get reports
export async function GET(request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const reportType = searchParams.get('reportType');
    const reportId = searchParams.get('reportId');
    
    const { db } = await connectToDatabase();
    
    // If reportId is provided, get a specific report
    if (reportId) {
      if (!ObjectId.isValid(reportId)) {
        return NextResponse.json(
          { error: 'Invalid report ID' },
          { status: 400 }
        );
      }
      
      const report = await db.collection('reports').findOne({
        _id: new ObjectId(reportId)
      });
      
      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
      
      // Check if user has permission to view this report
      if (session.user.role === 'organizer') {
        const event = await db.collection('events').findOne({
          _id: report.eventId,
          organizerId: session.user.id
        });
        
        if (!event) {
          return NextResponse.json(
            { error: 'You do not have permission to view this report' },
            { status: 403 }
          );
        }
      }
      
      return NextResponse.json(report);
    }
    
    // Build the query based on provided parameters
    const query = {};
    
    if (eventId) {
      if (!ObjectId.isValid(eventId)) {
        return NextResponse.json(
          { error: 'Invalid event ID' },
          { status: 400 }
        );
      }
      query.eventId = new ObjectId(eventId);
    }
    
    if (reportType) {
      query.reportType = reportType;
    }
    
    // For organizers, only show reports for their events
    if (session.user.role === 'organizer') {
      if (eventId) {
        // Check if the event belongs to the organizer
        const event = await db.collection('events').findOne({
          _id: new ObjectId(eventId),
          organizerId: session.user.id
        });
        
        if (!event) {
          return NextResponse.json(
            { error: 'You do not have permission to view reports for this event' },
            { status: 403 }
          );
        }
      } else {
        // If no eventId provided, get all events by this organizer
        const organizerEvents = await db.collection('events')
          .find({ organizerId: session.user.id })
          .project({ _id: 1 })
          .toArray();
        
        const eventIds = organizerEvents.map(event => event._id);
        query.eventId = { $in: eventIds };
      }
    }
    
    // Fetch reports from the database
    const reports = await db.collection('reports')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Fetch event details for each report
    const reportsWithEventDetails = await Promise.all(reports.map(async (report) => {
      const event = await db.collection('events').findOne(
        { _id: report.eventId },
        { projection: { name: 1, date: 1 } }
      );
      
      return {
        ...report,
        event: event || { name: 'Unknown Event' }
      };
    }));
    
    return NextResponse.json(reportsWithEventDetails);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}