// src/app/api/reports/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    const data = await request.json();
    const { eventId, reportType, dateRange, specificDate, period } = data;

    if (!reportType) {
      return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
    }
    // Ensure eventId is validated for report types that require it
    const eventSpecificReportTypes = ['attendance', 'revenue', 'seatOccupancy', 'ticketSales']; // Added ticketSales
    if (eventSpecificReportTypes.includes(reportType) && (!eventId || !ObjectId.isValid(eventId))) {
        return NextResponse.json(
            { error: 'Valid Event ID is required for this report type' },
            { status: 400 }
        );
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    let event = null;
    let eventObjectId = null;

    if (eventId && ObjectId.isValid(eventId)) {
        eventObjectId = new ObjectId(eventId);
        event = await db.collection('events').findOne({ _id: eventObjectId });
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }
        if (session.user.role === 'organizer' && event.organizerId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'You do not have permission for this event' }, { status: 403 });
        }
    } else if (eventSpecificReportTypes.includes(reportType)) { // Check against original reportType from request
        return NextResponse.json({ error: 'Event ID is missing or invalid for this report type.' }, { status: 400 });
    }

    let filterStartDate, filterEndDate;
    // Date range calculation logic (remains the same as your provided code)
    if (dateRange && dateRange.startDate && dateRange.endDate) {
        filterStartDate = new Date(dateRange.startDate);
        filterEndDate = new Date(dateRange.endDate);
        filterEndDate.setHours(23, 59, 59, 999);
    } else if (specificDate && period === 'daily') {
        filterStartDate = new Date(specificDate);
        filterStartDate.setHours(0, 0, 0, 0);
        filterEndDate = new Date(specificDate);
        filterEndDate.setHours(23, 59, 59, 999);
    } else if (period) {
        const today = new Date();
        today.setHours(23,59,59,999);
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        switch(period) {
            case 'last7days':
                filterEndDate = new Date(today);
                filterStartDate = new Date(startOfToday);
                filterStartDate.setDate(startOfToday.getDate() - 6);
                break;
            case 'last30days':
                filterEndDate = new Date(today);
                filterStartDate = new Date(startOfToday);
                filterStartDate.setDate(startOfToday.getDate() - 29);
                break;
            case 'thisMonth':
                filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
                filterEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                filterEndDate.setHours(23,59,59,999);
                break;
            case 'lastMonth':
                filterStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                filterEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
                filterEndDate.setHours(23,59,59,999);
                break;
            default:
                filterEndDate = new Date(today);
                filterStartDate = new Date(startOfToday);
                filterStartDate.setDate(startOfToday.getDate() - 6);
        }
    }


    let reportData = {};
    let query = {};
    const effectiveReportType = reportType === 'ticketSales' ? 'attendance' : reportType;


    if (effectiveReportType === 'attendance') { // Handles 'ticketSales' as well
      query = { eventId: eventObjectId, status: 'Confirmed' }; // Assuming 'Confirmed' tickets are sold tickets
      if (filterStartDate && filterEndDate) {
        // For ticket sales, we should ideally filter by bookingDate or payment completion date
        // if 'createdAt' on tickets refers to ticket generation time which might differ.
        // For now, using createdAt on tickets as a proxy if bookingDate isn't directly on tickets.
        // This might need adjustment based on your exact data model for when a ticket is considered "sold".
         const bookingsForTickets = await db.collection('bookings').find({
            eventId: eventObjectId,
            paymentStatus: 'completed',
            ...(filterStartDate && filterEndDate && { bookingDate: { $gte: filterStartDate, $lte: filterEndDate } })
        }).project({ _id: 1 }).toArray();
        const bookingIds = bookingsForTickets.map(b => b._id);
        query.bookingId = { $in: bookingIds };
      }

      const tickets = await db.collection('tickets').find(query).toArray();
      const totalTicketsSold = tickets.length;
      const salesByCategory = tickets.reduce((acc, ticket) => {
        const category = ticket.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1; // Assuming 1 ticket document per actual ticket
        return acc;
      }, {});

      const ticketTypeBreakdown = Object.entries(salesByCategory).map(([category, count]) => ({
        category: category,
        count: count,
        percentage: totalTicketsSold > 0 ? ((count / totalTicketsSold) * 100).toFixed(2) : '0.00',
      }));

      let dailySales = [];
      if (filterStartDate && filterEndDate) {
          // Aggregate ticket sales by date based on their booking date
          const bookingsInPeriod = await db.collection('bookings').find({
            eventId: eventObjectId,
            paymentStatus: 'completed',
            bookingDate: { $gte: filterStartDate, $lte: filterEndDate }
          }).toArray();

          const salesByDate = bookingsInPeriod.reduce((acc, booking) => {
              const dateStr = new Date(booking.bookingDate).toISOString().split('T')[0];
              const ticketsInBooking = booking.ticketDetails.reduce((sum, detail) => sum + detail.quantity, 0);
              acc[dateStr] = (acc[dateStr] || 0) + ticketsInBooking;
              return acc;
          }, {});
          dailySales = Object.entries(salesByDate)
            .map(([date, count]) => ({ date, ticketsSold: count }))
            .sort((a,b) => new Date(a.date) - new Date(b.date));
      }
      const eventCapacity = event.totalCapacity || (event.seatingLayout ? event.seatingLayout.reduce((sum, section) => sum + Object.values(section.rows).flat().length, 0) : 0);
      reportData = {
        reportTitle: `Ticket Sales Report for ${event.name}`,
        period: filterStartDate && filterEndDate ? `${filterStartDate.toLocaleDateString()} - ${filterEndDate.toLocaleDateString()}` : "All Time (for this event)",
        summary: {
          totalTicketsSold: totalTicketsSold,
          eventCapacity: eventCapacity || 'N/A',
          sellThroughRate: (eventCapacity && totalTicketsSold > 0) ? ((totalTicketsSold / eventCapacity) * 100).toFixed(2) + '%' : 'N/A',
        },
        ticketTypeBreakdown: ticketTypeBreakdown,
        dailySales: dailySales,
      };

    } else if (effectiveReportType === 'revenue') {
      query = { eventId: eventObjectId, paymentStatus: 'completed' };
      if (filterStartDate && filterEndDate) {
        query.bookingDate = { $gte: filterStartDate, $lte: filterEndDate };
      }
      const bookings = await db.collection('bookings').find(query).toArray();

      let totalNetRevenue = 0;
      let totalGrossRevenue = 0;
      let totalDiscountsApplied = 0;
      let totalDiscountedTickets = 0;
      const promoCodeUsage = {};
      const revenueByCategory = {}; // For gross revenue by category

      bookings.forEach(booking => {
        totalNetRevenue += (booking.totalAmount || 0);
        totalGrossRevenue += (booking.grossAmount || 0); // Assuming grossAmount is pre-discount
        const currentBookingDiscount = booking.discountAppliedAmount || 0;
        totalDiscountsApplied += currentBookingDiscount;

        let bookingHasDiscount = false;
        if (booking.promoCodeUsed && currentBookingDiscount > 0) {
          bookingHasDiscount = true;
          promoCodeUsage[booking.promoCodeUsed] = promoCodeUsage[booking.promoCodeUsed] || { uses: 0, totalDiscountValue: 0 };
          promoCodeUsage[booking.promoCodeUsed].uses += 1;
          promoCodeUsage[booking.promoCodeUsed].totalDiscountValue += currentBookingDiscount;
        }

        booking.ticketDetails.forEach(detail => {
          const category = detail.category || 'Uncategorized';
          revenueByCategory[category] = revenueByCategory[category] || { ticketCount: 0, grossRevenue: 0 };
          revenueByCategory[category].ticketCount += detail.quantity;
          // Revenue by category should be based on original price before booking-level discount
          revenueByCategory[category].grossRevenue += (parseFloat(detail.price) * detail.quantity);

          if (bookingHasDiscount) {
            totalDiscountedTickets += detail.quantity;
          }
        });
      });

      const promoCodeBreakdown = Object.entries(promoCodeUsage).map(([code, data]) => ({
        code,
        uses: data.uses,
        totalDiscountValue: data.totalDiscountValue.toFixed(2),
      }));

      let dailyRevenueData = [];
      if (filterStartDate && filterEndDate) {
          const revenueByDate = bookings.reduce((acc, booking) => {
              const dateStr = new Date(booking.bookingDate).toISOString().split('T')[0];
              acc[dateStr] = acc[dateStr] || { revenue: 0, bookings: 0 };
              acc[dateStr].revenue += (booking.totalAmount || 0); // Net revenue for the trend
              acc[dateStr].bookings += 1;
              return acc;
          }, {});
          dailyRevenueData = Object.entries(revenueByDate)
            .map(([date, dataVal]) => ({ date, revenue: dataVal.revenue, bookings: dataVal.bookings }))
            .sort((a,b) => new Date(a.date) - new Date(b.date));
      }

      reportData = {
        reportTitle: `Revenue Report for ${event.name}`,
        period: filterStartDate && filterEndDate ? `${filterStartDate.toLocaleDateString()} - ${filterEndDate.toLocaleDateString()}` : "All Time (for this event)",
        summary: {
            totalNetRevenue: totalNetRevenue,
            totalGrossRevenue: totalGrossRevenue,
            totalDiscountsApplied: totalDiscountsApplied,
            totalBookings: bookings.length,
            averageBookingValue: bookings.length > 0 ? (totalNetRevenue / bookings.length).toFixed(2) : "0.00",
            totalDiscountedTickets: totalDiscountedTickets,
        },
        ticketTypeBreakdown: Object.entries(revenueByCategory).map(([category, catData]) => ({
          category,
          ticketCount: catData.ticketCount,
          grossRevenue: catData.grossRevenue.toFixed(2), // This is gross revenue for this category
          // Percentage based on total gross revenue from tickets
          percentage: totalGrossRevenue > 0 ? ((catData.grossRevenue / totalGrossRevenue) * 100).toFixed(2) : '0.00'
        })),
        dailyRevenue: dailyRevenueData,
        promoCodeBreakdown: promoCodeBreakdown,
      };

    } else if (effectiveReportType === 'seatOccupancy' && eventId) {
        // Seat Occupancy logic remains the same
        const totalSeatsQuery = { eventId: eventObjectId };
        const totalSeatsCount = await db.collection('seats').countDocuments(totalSeatsQuery);
        const occupiedSeatsCount = await db.collection('seats').countDocuments({ ...totalSeatsQuery, status: 'occupied' });
        const availableSeatsCount = await db.collection('seats').countDocuments({ ...totalSeatsQuery, status: 'available' });
        let occupancyRateNum = 0;
        if (totalSeatsCount > 0) {
            occupancyRateNum = (occupiedSeatsCount / totalSeatsCount) * 100;
        }
        let sectionBreakdown = [];
        if (event.seatingLayout && Array.isArray(event.seatingLayout)) {
            for (const sectionLayout of event.seatingLayout) {
                const sectionName = sectionLayout.section;
                let totalSectionSeats = 0;
                if (sectionLayout.rows && typeof sectionLayout.rows === 'object') {
                    Object.values(sectionLayout.rows).forEach(rowSeatsArray => {
                        if (Array.isArray(rowSeatsArray)) {
                            totalSectionSeats += rowSeatsArray.length;
                        }
                    });
                }
                const occupiedInSection = await db.collection('seats').countDocuments({ eventId: eventObjectId, section: sectionName, status: 'occupied' });
                const sectionOccupancyRateNum = totalSectionSeats > 0 ? (occupiedInSection / totalSectionSeats) * 100 : 0;
                sectionBreakdown.push({
                    section: sectionName,
                    totalSeats: totalSectionSeats,
                    occupiedSeats: occupiedInSection,
                    occupancyRate: sectionOccupancyRateNum.toFixed(2) + '%',
                    occupancyValue: sectionOccupancyRateNum
                });
            }
        }
        reportData = {
            reportTitle: `Seat Occupancy Report for ${event.name}`,
            eventName: event.name,
            period: "Current Snapshot",
            summary: {
                totalSeats: totalSeatsCount,
                occupiedSeats: occupiedSeatsCount,
                availableSeats: availableSeatsCount,
                occupancyRate: occupancyRateNum.toFixed(2) + '%',
            },
            sectionBreakdown: sectionBreakdown,
        };

    } else if (effectiveReportType === 'auditoriumUsage' && session.user.role === 'admin') {
        // Auditorium Usage logic remains the same
        if (!filterStartDate || !filterEndDate) {
            return NextResponse.json({ error: 'Date range is required for auditorium usage report.' }, {status: 400});
        }
        query = {
            date: { $gte: filterStartDate.toISOString().split('T')[0], $lte: filterEndDate.toISOString().split('T')[0] }
        };

        const eventsInPeriod = await db.collection('events').find(query).sort({date: 1}).toArray();
        const eventIdsInPeriod = eventsInPeriod.map(e => e._id);

        let totalBookingsInPeriod = 0;
        let totalTicketsSoldInPeriod = 0;
        let totalNetRevenueInPeriod = 0; // This is net revenue
        let detailedEventsInPeriod = [];

        if (eventIdsInPeriod.length > 0) {
            const bookingsForEvents = await db.collection('bookings').find({
                eventId: { $in: eventIdsInPeriod },
                paymentStatus: 'completed'
            }).toArray();

            const eventStatsMap = new Map();
            bookingsForEvents.forEach(booking => {
                const eventIdStr = booking.eventId.toString();
                let currentEventStats = eventStatsMap.get(eventIdStr) || { ticketsSold: 0, revenue: 0, bookingCount: 0 };
                currentEventStats.bookingCount += 1;
                booking.ticketDetails.forEach(detail => {
                    currentEventStats.ticketsSold += detail.quantity;
                });
                currentEventStats.revenue += (booking.totalAmount || 0); // Net revenue
                eventStatsMap.set(eventIdStr, currentEventStats);
            });

            detailedEventsInPeriod = eventsInPeriod.map(eventDoc => {
                const stats = eventStatsMap.get(eventDoc._id.toString()) || { ticketsSold: 0, revenue: 0 };
                return {
                    name: eventDoc.name,
                    date: eventDoc.date,
                    ticketsSold: stats.ticketsSold,
                    revenue: stats.revenue // This is net revenue for the event
                };
            });

            totalBookingsInPeriod = bookingsForEvents.length;
            totalNetRevenueInPeriod = Array.from(eventStatsMap.values()).reduce((sum, stats) => sum + stats.revenue, 0);
            totalTicketsSoldInPeriod = Array.from(eventStatsMap.values()).reduce((sum, stats) => sum + stats.ticketsSold, 0);
        }

        const uniqueEventDays = new Set(eventsInPeriod.map(e => e.date)).size;
        const diffTime = Math.abs(filterEndDate - filterStartDate);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const utilizationRate = diffDays > 0 ? ((uniqueEventDays / diffDays) * 100).toFixed(2) : 0;

        reportData = {
            reportTitle: "Auditorium Usage Report",
            period: { startDate: filterStartDate.toISOString().split('T')[0], endDate: filterEndDate.toISOString().split('T')[0] },
            summary: {
                totalEventsHosted: eventsInPeriod.length,
                totalBookings: totalBookingsInPeriod, // Renamed for clarity
                totalTicketsSold: totalTicketsSoldInPeriod, // Renamed for clarity
                totalRevenueGenerated: totalNetRevenueInPeriod, // Clarified this is Net
                auditoriumUtilizationRate: `${utilizationRate}% (${uniqueEventDays} of ${diffDays} days)`,
            },
            eventsInPeriod: detailedEventsInPeriod,
        };
    } else {
      return NextResponse.json({ error: 'Invalid report type or insufficient permissions' }, { status: 400 });
    }

    const finalReportDocument = {
      ...(eventObjectId && { eventId: eventObjectId.toString() }), // Ensure eventId is string
      reportType: data.reportType, // Store original requested reportType
      dateRange: (filterStartDate && filterEndDate) ? { startDate: filterStartDate.toISOString(), endDate: filterEndDate.toISOString() } : null,
      generatedBy: new ObjectId(session.user.id),
      generatedByName: session.user.name || (await db.collection('users').findOne({_id: new ObjectId(session.user.id)}))?.username,
      data: reportData,
      createdAt: new Date(),
    };

    const result = await db.collection('reports').insertOne(finalReportDocument);

    return NextResponse.json({
      message: 'Report generated successfully',
      reportId: result.insertedId.toString(),
      report: {
        ...finalReportDocument,
        _id: result.insertedId.toString(),
        // eventId is already string or null
        generatedBy: finalReportDocument.generatedBy.toString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventIdParam = searchParams.get('eventId'); // Renamed to avoid conflict
    const reportTypeParam = searchParams.get('reportType');
    const reportId = searchParams.get('reportId');

    const { db } = await connectToDatabase();

    if (reportId) {
      if (!ObjectId.isValid(reportId)) {
        return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
      }
      const report = await db.collection('reports').findOne({ _id: new ObjectId(reportId) });
      if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

      if (session.user.role === 'organizer' && report.eventId) {
        // Ensure eventId in report is valid ObjectId before querying events
        let eventForReport = null;
        if (ObjectId.isValid(report.eventId)) {
            eventForReport = await db.collection('events').findOne({ _id: new ObjectId(report.eventId), organizerId: new ObjectId(session.user.id) });
        }
        if (!eventForReport && report.reportType !== 'auditoriumUsage') {
             return NextResponse.json({ error: 'You do not have permission to view this specific report' }, { status: 403 });
        }
      }
       return NextResponse.json({
        ...report,
        _id: report._id.toString(),
        eventId: report.eventId ? report.eventId.toString() : null, // Already string or null from POST
        generatedBy: report.generatedBy.toString(),
      });
    }

    const query = {};
    if (eventIdParam) { // Use the renamed param
      if (!ObjectId.isValid(eventIdParam)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
      query.eventId = eventIdParam; // Store as string for query, as it's stored as string in reports
    }
    if (reportTypeParam) {
      query.reportType = reportTypeParam;
    }

    if (session.user.role === 'organizer') {
      const organizerEvents = await db.collection('events').find({ organizerId: new ObjectId(session.user.id) }).project({ _id: 1 }).toArray();
      const organizerEventIdsAsStrings = organizerEvents.map(event => event._id.toString());

      if (query.eventId) { // query.eventId is already a string here
          if (!organizerEventIdsAsStrings.includes(query.eventId)) {
            return NextResponse.json({ error: 'Permission denied for this event\'s reports' }, { status: 403 });
          }
      } else {
          // If querying for an organizer's reports without a specific eventId,
          // fetch reports linked to their events OR generated by them.
          query.$or = [
              { eventId: { $in: organizerEventIdsAsStrings } },
              { generatedBy: session.user.id } // Assuming generatedBy is stored as string ID of user
          ];
          // If generatedBy is ObjectId, use: { generatedBy: new ObjectId(session.user.id) }
      }
    }
    // For admin, if no specific eventId or reportType, query will be empty {}, fetching all reports.

    const reports = await db.collection('reports').find(query).sort({ createdAt: -1 }).limit(50).toArray();

    const reportsWithDetails = await Promise.all(reports.map(async (report) => {
      let eventDetails = null;
      if (report.eventId && ObjectId.isValid(report.eventId)) { // Check if eventId is valid ObjectId before querying
        eventDetails = await db.collection('events').findOne(
          { _id: new ObjectId(report.eventId) },
          { projection: { name: 1, date: 1 } }
        );
      }
      return {
        ...report,
        _id: report._id.toString(),
        eventId: report.eventId ? report.eventId.toString() : null,
        generatedBy: report.generatedBy.toString(),
        event: eventDetails ? { ...eventDetails, _id: eventDetails._id.toString() } : (report.eventId ? { name: 'Event details not found or ID mismatch'} : null)
      };
    }));

    return NextResponse.json(reportsWithDetails);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports', details: error.message }, { status: 500 });
  }
}
