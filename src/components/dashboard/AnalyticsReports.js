// src/components/dashboard/AnalyticsReports.js
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas-pro';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  DocumentMagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  TableCellsIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  TicketIcon as ReportTicketIcon,
  CurrencyDollarIcon,
  UsersIcon,
  PresentationChartLineIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  TagIcon, // For promo codes
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LineChart,
  Line,
  ComposedChart, // Added for mixed chart types
} from 'recharts';

// --- Report Display Sub-components ---
const ReportWrapper = ({ title, period, children, reportRef }) => (
  <div ref={reportRef} className="mt-6 p-6 bg-white rounded-lg shadow-lg border border-gray-200 animate-fadeIn">
    <div className="border-b border-gray-200 pb-4 mb-6">
        <h3 className="text-xl font-semibold text-sky-700 flex items-center">
            <ClipboardDocumentListIcon className="h-6 w-6 mr-2"/>
            {title || "Report Results"}
        </h3>
        {period && <p className="text-sm text-gray-500 mt-1">Period: {period}</p>}
    </div>
    {children}
  </div>
);

const KeyMetric = ({ label, value, icon: Icon, color = "text-sky-600" }) => (
    <div className="bg-sky-50 p-4 rounded-lg shadow-sm border border-sky-100">
        <div className="flex items-center">
            {Icon && <Icon className={`h-7 w-7 mr-3 ${color}`} />}
            <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
        </div>
    </div>
);

const ReportTable = ({ title, headers, data, dataKeys, emptyMessage = "No data available." }) => (
    <div className="mt-6">
        <h5 className="text-md font-semibold text-gray-700 mb-2">{title}</h5>
        <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map(header => (
                            <th key={header} scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {(data && data.length > 0) ? data.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                            {dataKeys.map(key => (
                                <td key={key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                    {item[key]}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={headers.length} className="px-4 py-3 text-center text-sm text-gray-500">{emptyMessage}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// Custom Tooltip for Composed Chart
const CustomRevenueTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm">
        <p className="font-medium text-gray-800 mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.name === 'Revenue' ? '$' : ''}${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const RevenueReportDisplay = ({ data, reportRef }) => {
  if (!data) return <p>No revenue data available.</p>;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const revenueByTypeChartData = data.ticketTypeBreakdown?.map(item => ({
      name: item.category,
      // Use grossRevenue for this chart, as net revenue by type is complex with booking-level discounts
      revenue: parseFloat(item.grossRevenue) || 0,
  })) || [];

  return (
    <ReportWrapper reportRef={reportRef} title={data.reportTitle || "Revenue Report"} period={data.period}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KeyMetric label="Total Gross Revenue" value={`$${data.summary?.totalGrossRevenue?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`} icon={CurrencyDollarIcon} color="text-blue-600" />
        <KeyMetric label="Total Discounts Applied" value={`$${data.summary?.totalDiscountsApplied?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`} icon={TagIcon} color="text-orange-500" />
        <KeyMetric label="Total Net Revenue" value={`$${data.summary?.totalNetRevenue?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`} icon={CurrencyDollarIcon} />
        <KeyMetric label="Total Bookings" value={data.summary?.totalBookings?.toLocaleString() || 0} icon={ReportTicketIcon} color="text-green-600"/>
        <KeyMetric label="Avg. Booking Value (Net)" value={`$${parseFloat(data.summary?.averageBookingValue || 0).toFixed(2)}`} icon={ChartBarIcon} color="text-indigo-600"/>
        <KeyMetric label="Total Discounted Tickets" value={data.summary?.totalDiscountedTickets?.toLocaleString() || 0} icon={ReportTicketIcon} color="text-red-500"/>
      </div>

      {data.dailyRevenue && data.dailyRevenue.length > 0 && (
        <>
          <h5 className="text-md font-semibold text-gray-700 mb-3 mt-6">Daily Revenue & Bookings Trend</h5>
          <div style={{ width: '100%', height: 300 }} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <ResponsiveContainer>
              <ComposedChart data={data.dailyRevenue} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6b7280' }} />
                <YAxis yAxisId="left" orientation="left" stroke="#2563eb" fontSize={10} tickFormatter={(value) => `$${value/1000}k`} tick={{ fill: '#2563eb' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} tick={{ fill: '#10b981' }} allowDecimals={false}/>
                <Tooltip content={<CustomRevenueTrendTooltip />} />
                <Legend wrapperStyle={{fontSize: "12px"}}/>
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRevenueGradient)" name="Net Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#10b981" name="Bookings" dot={false} strokeWidth={2}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportTable
            title="Gross Revenue by Ticket Type"
            headers={['Category', 'Tickets Sold', 'Gross Revenue ($)', '% of Total Gross']}
            data={data.ticketTypeBreakdown || []}
            dataKeys={['category', 'ticketCount', 'grossRevenue', 'percentage']}
            emptyMessage="No revenue data by ticket type."
        />
        {revenueByTypeChartData.length > 0 && (
            <div className="p-4 border rounded-lg bg-gray-50">
                <h5 className="text-md font-semibold text-gray-700 mb-2 text-center">Gross Revenue Distribution by Type</h5>
                <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <BarChart data={revenueByTypeChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" fontSize={10} tickFormatter={(value) => `$${value/1000}k`} />
                            <YAxis type="category" dataKey="name" width={80} fontSize={10} tick={{ fill: '#6b7280' }} />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`}/>
                            <Legend wrapperStyle={{fontSize: "10px"}}/>
                            <Bar dataKey="revenue" name="Gross Revenue" barSize={20}>
                                {revenueByTypeChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}
      </div>
       <ReportTable
            title="Promo Code Usage"
            headers={['Code', 'Times Used', 'Total Discount Value ($)']}
            data={data.promoCodeBreakdown || []}
            dataKeys={['code', 'uses', 'totalDiscountValue']}
            emptyMessage="No promo codes were used in this period."
        />
    </ReportWrapper>
  );
};

const TicketSalesReportDisplay = ({ data, reportRef }) => {
    if (!data) return <p>No ticket sales data available.</p>;
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    const chartData = data.ticketTypeBreakdown?.map(item => ({ name: item.category, ticketsSold: item.count || item.ticketsSold || 0 })) || [];

    return (
        <ReportWrapper reportRef={reportRef} title={data.reportTitle || "Ticket Sales Report"} period={data.period}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <KeyMetric label="Total Tickets Sold" value={data.summary?.totalTicketsSold || data.summary?.totalAttendees || 0} icon={ReportTicketIcon} />
                <KeyMetric label="Event Capacity" value={data.summary?.eventCapacity || data.summary?.capacity || 'N/A'} icon={BuildingOfficeIcon} color="text-gray-500"/>
                <KeyMetric label="Sell-through Rate" value={data.summary?.sellThroughRate || data.summary?.attendanceRate || 'N/A'} icon={ChartBarIcon} color="text-green-600"/>
            </div>

            {data.dailySales && data.dailySales.length > 0 && (
                 <>
                    <h5 className="text-md font-semibold text-gray-700 mb-3 mt-6">Daily Sales Trend</h5>
                    <div style={{ width: '100%', height: 300 }} className="mb-6 p-4 border rounded-lg bg-gray-50">
                        <ResponsiveContainer>
                            <LineChart data={data.dailySales} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
                                <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6b7280' }}/>
                                <YAxis fontSize={10} tick={{ fill: '#6b7280' }} allowDecimals={false}/>
                                <Tooltip />
                                <Legend wrapperStyle={{fontSize: "12px"}}/>
                                <Line type="monotone" dataKey="ticketsSold" stroke="#38bdf8" strokeWidth={2} name="Tickets Sold" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportTable
                    title="Sales by Ticket Type"
                    headers={['Category', 'Tickets Sold', '% of Total']}
                    data={data.ticketTypeBreakdown?.map(item => ({...item, ticketsSold: item.count || item.ticketsSold || 0 })) || []}
                    dataKeys={['category', 'ticketsSold', 'percentage']}
                />
                {chartData.length > 0 && (
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h5 className="text-md font-semibold text-gray-700 mb-2 text-center">Sales Distribution by Type</h5>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" fontSize={10} />
                                    <YAxis type="category" dataKey="name" width={80} fontSize={10} tick={{ fill: '#6b7280' }} />
                                    <Tooltip formatter={(value) => `${value} tickets`}/>
                                    <Legend wrapperStyle={{fontSize: "10px"}}/>
                                    <Bar dataKey="ticketsSold" name="Tickets Sold" barSize={20}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </ReportWrapper>
    );
};


const SeatOccupancyReportDisplay = ({ data, reportRef }) => {
  if (!data) return <p>No seat occupancy data available.</p>;
  const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
  const chartData = data.sectionBreakdown?.map(s => ({
      name: s.section,
      occupancy: parseFloat(s.occupancyValue || s.occupancyRate) || 0
  })) || [];

  return (
    <ReportWrapper reportRef={reportRef} title={data.reportTitle || `Seat Occupancy for ${data.eventName}`} period={data.period}>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KeyMetric label="Total Seats" value={data.summary?.totalSeats || 0} icon={ReportTicketIcon} />
            <KeyMetric label="Occupied Seats" value={data.summary?.occupiedSeats || 0} icon={UsersIcon} color="text-green-600"/>
            <KeyMetric label="Available Seats" value={data.summary?.availableSeats || 0} icon={ReportTicketIcon} color="text-blue-500"/>
            <KeyMetric label="Overall Occupancy" value={data.summary?.occupancyRate || '0%'} icon={ChartBarIcon} color="text-indigo-600"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportTable
                title="Occupancy by Section"
                headers={['Section', 'Total Seats', 'Occupied', 'Occupancy Rate (%)']}
                data={data.sectionBreakdown || []}
                dataKeys={['section', 'totalSeats', 'occupiedSeats', 'occupancyRate']}
            />
            {chartData.length > 0 && (
                 <div className="p-4 border rounded-lg bg-gray-50">
                    <h5 className="text-md font-semibold text-gray-700 mb-2 text-center">Section Occupancy Rates</h5>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            {/* Increased bottom margin from 40 to 70 to give more space for XAxis labels and Legend */}
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 70 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-30} textAnchor="end" fontSize={10} interval={0} tick={{ fill: '#6b7280' }} height={50} /> {/* Added height to XAxis to ensure labels are not cut off */}
                                <YAxis label={{ value: 'Occupancy (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6b7280' }} fontSize={10} tick={{ fill: '#6b7280' }} />
                                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                                {/* Added marginTop to Legend's wrapperStyle for spacing */}
                                <Legend wrapperStyle={{fontSize: "10px", marginTop: "20px"}}/>
                                <Bar dataKey="occupancy" name="Occupancy Rate" >
                                     {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    </ReportWrapper>
  );
};

const AuditoriumUsageReportDisplay = ({ data, reportRef }) => {
  if (!data) return <p>No auditorium usage data available.</p>;
  const COLORS_EVENTS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
  const eventsChartDataTickets = data.eventsInPeriod?.map(event => ({
      name: event.name.length > 15 ? event.name.substring(0,12) + "..." : event.name,
      ticketsSold: event.ticketsSold || 0,
  })) || [];
  const eventsChartDataRevenue = data.eventsInPeriod?.map(event => ({
      name: event.name.length > 15 ? event.name.substring(0,12) + "..." : event.name,
      revenue: event.revenue || 0
  })) || [];


  return (
    <ReportWrapper reportRef={reportRef} title={data.reportTitle} period={data.period?.startDate && data.period?.endDate ? `${new Date(data.period.startDate).toLocaleDateString()} - ${new Date(data.period.endDate).toLocaleDateString()}` : 'N/A'}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <KeyMetric label="Total Events Hosted" value={data.summary?.totalEventsHosted || 0} icon={CalendarDaysIcon} />
            <KeyMetric label="Total Tickets Sold" value={data.summary?.totalTicketsSold?.toLocaleString() || data.summary?.totalTicketsSoldAcrossEvents?.toLocaleString() || 0} icon={ReportTicketIcon} color="text-green-600"/>
            <KeyMetric label="Total Net Revenue" value={`$${data.summary?.totalRevenueGenerated?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`} icon={CurrencyDollarIcon} color="text-sky-600"/>
            <KeyMetric label="Total Bookings" value={data.summary?.totalBookings?.toLocaleString() || data.summary?.totalBookingsAcrossEvents?.toLocaleString() || 0} icon={ClipboardDocumentListIcon} color="text-purple-600" />
            <KeyMetric label="Utilization Rate" value={data.summary?.auditoriumUtilizationRate || '0%'} icon={ChartBarIcon} color="text-indigo-600"/>
        </div>

        <ReportTable
            title="Events in Period - Summary"
            headers={['Event Name', 'Date', 'Tickets Sold', 'Net Revenue ($)']}
            data={data.eventsInPeriod || []}
            dataKeys={['name', 'date', 'ticketsSold', 'revenue']}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {eventsChartDataTickets.length > 0 && (
                <div className="p-4 border rounded-lg bg-gray-50">
                    <h5 className="text-md font-semibold text-gray-700 mb-2 text-center">Tickets Sold per Event</h5>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={eventsChartDataTickets} margin={{top: 5, right: 5, left: 5, bottom: 70}}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={9} tick={{ fill: '#6b7280' }} height={60} />
                                <YAxis fontSize={10} tick={{ fill: '#6b7280' }} />
                                <Tooltip />
                                <Legend wrapperStyle={{fontSize: "10px"}}/>
                                <Bar dataKey="ticketsSold" name="Tickets Sold">
                                    {eventsChartDataTickets.map((entry, index) => (
                                        <Cell key={`cell-event-tickets-${index}`} fill={COLORS_EVENTS[index % COLORS_EVENTS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            {eventsChartDataRevenue.length > 0 && (
                <div className="p-4 border rounded-lg bg-gray-50">
                    <h5 className="text-md font-semibold text-gray-700 mb-2 text-center">Net Revenue per Event</h5>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={eventsChartDataRevenue} margin={{top: 5, right: 5, left: 15, bottom: 70}}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={9} tick={{ fill: '#6b7280' }} height={60}/>
                                <YAxis fontSize={10} tickFormatter={(value) => `$${value/1000}k`} tick={{ fill: '#6b7280' }} />
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`}/>
                                <Legend wrapperStyle={{fontSize: "10px"}}/>
                                <Bar dataKey="revenue" name="Net Revenue ($)">
                                    {eventsChartDataRevenue.map((entry, index) => (
                                        <Cell key={`cell-event-revenue-${index}`} fill={COLORS_EVENTS[(index + 2) % COLORS_EVENTS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    </ReportWrapper>
  );
};
// --- End Report Display Sub-components ---


const AnalyticsReports = () => {
  const { data: session, status } = useSession();
  const [reportType, setReportType] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [userEvents, setUserEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);

  const [periodOption, setPeriodOption] = useState('last7days');
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedReportId, setGeneratedReportId] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const reportContentRef = useRef(null);

  const isAdmin = session?.user?.role === 'admin';
  const isOrganizer = session?.user?.role === 'organizer';

  const fetchEventsForSelection = useCallback(async () => {
    if (status !== 'authenticated') return;
    if (!isAdmin && !isOrganizer) return;

    try {
      let url = '/api/events?status=all';
      if (isOrganizer && session?.user?.id) {
        url += `&organizerId=${session.user.id}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }));
        throw new Error(errorData.error || `Failed to fetch events (status: ${response.status})`);
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        if (isAdmin) setAllEvents(data);
        else if (isOrganizer) setUserEvents(data);
      } else {
        throw new Error("Invalid data format for events list.");
      }
    } catch (err) {
      console.error('[AnalyticsReports] Error fetching events:', err);
      toast.error(err.message || 'Could not load events.');
      if (isAdmin) setAllEvents([]); else if (isOrganizer) setUserEvents([]);
    }
  }, [status, session, isAdmin, isOrganizer]);

  useEffect(() => {
    fetchEventsForSelection();
  }, [fetchEventsForSelection]);

  const getReportPayload = () => {
    const payload = {};

    let effectiveReportType = reportType;
    // The backend now handles 'ticketSales' by mapping it to 'attendance' logic
    // So, we send the original 'ticketSales' or 'revenue' etc.
    payload.reportType = reportType;


    const eventSpecificReports = ['attendance', 'revenue', 'seatOccupancy', 'ticketSales'];

    if (eventSpecificReports.includes(reportType)) {
        if (!selectedEventId) {
            toast.error(`Please select an event for the '${reportType}' report.`);
            return null;
        }
        payload.eventId = selectedEventId;
    }

    let startDate, endDate;
    const today = new Date();
    const todayEndOfDay = new Date(today);
    todayEndOfDay.setHours(23, 59, 59, 999);

    switch (periodOption) {
      case 'daily':
        startDate = new Date(specificDate); startDate.setHours(0, 0, 0, 0);
        endDate = new Date(specificDate); endDate.setHours(23, 59, 59, 999);
        payload.specificDate = specificDate; payload.period = 'daily';
        break;
      case 'last7days':
        endDate = new Date(todayEndOfDay); startDate = new Date(todayEndOfDay);
        startDate.setDate(todayEndOfDay.getDate() - 6); startDate.setHours(0, 0, 0, 0);
        break;
      case 'last30days':
        endDate = new Date(todayEndOfDay); startDate = new Date(todayEndOfDay);
        startDate.setDate(todayEndOfDay.getDate() - 29); startDate.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); endDate.setHours(23,59,59,999);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0); endDate.setHours(23,59,59,999);
        break;
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          startDate = new Date(customDateRange.startDate); startDate.setHours(0,0,0,0);
          endDate = new Date(customDateRange.endDate); endDate.setHours(23,59,59,999);
           if (startDate > endDate) { toast.error('Start date cannot be after end date.'); return null; }
        } else { toast.error('Please select start and end dates for custom range.'); return null; }
        break;
      default: // Default to last7days
        endDate = new Date(todayEndOfDay); startDate = new Date(todayEndOfDay);
        startDate.setDate(todayEndOfDay.getDate() - 6); startDate.setHours(0, 0, 0, 0);
    }
    payload.dateRange = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
    return payload;
  };

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast.error('Please select a report type.');
      return;
    }
    const payload = getReportPayload();
    if (!payload) return;

    setIsLoading(true); setError(null); setReportData(null); setGeneratedReportId(null);
    const toastId = toast.loading('Generating report...');
    console.log('[AnalyticsReports] Generating report with payload:', payload);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log('[AnalyticsReports] API response for report generation:', data);

      if (!response.ok) throw new Error(data.error || 'Failed to generate report.');

      let processedData = data.report.data;
      // Ensure data structures are as expected by display components
      if (payload.reportType === 'seatOccupancy' && processedData?.sectionBreakdown) {
        processedData.sectionBreakdown = processedData.sectionBreakdown.map(s => ({
          ...s,
          occupancyValue: parseFloat(s.occupancyRate) || 0 // Ensure occupancyValue exists
        }));
      }
      // For ticketSales (mapped to 'attendance' in backend)
      if ((payload.reportType === 'ticketSales' || payload.reportType === 'attendance') && processedData?.ticketTypeBreakdown) {
          processedData.ticketTypeBreakdown = processedData.ticketTypeBreakdown.map(s => ({
              ...s,
              ticketsSold: s.count || 0 // Ensure 'ticketsSold' key is present if 'count' is used
          }));
      }
      if ((payload.reportType === 'ticketSales' || payload.reportType === 'attendance') && !processedData?.dailySales) {
        processedData.dailySales = []; // Ensure array exists
      }
      if (payload.reportType === 'revenue' && !processedData?.dailyRevenue) {
        processedData.dailyRevenue = []; // Ensure array exists
      }
       if (payload.reportType === 'revenue' && !processedData?.promoCodeBreakdown) {
        processedData.promoCodeBreakdown = []; // Ensure array exists
      }


      setReportData({ ...processedData, originalReportType: reportType }); // Keep original type for render logic
      setGeneratedReportId(data.reportId);
      toast.success('Report generated successfully!', { id: toastId });
    } catch (err) {
      console.error('[AnalyticsReports] Error generating report:', err);
      setError(err.message);
      toast.error(err.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportContentRef.current || !reportData) {
        toast.error("No report content available to download.");
        return;
    }
    setIsDownloadingPdf(true);
    const toastId = toast.loading("Preparing PDF...");

    // Temporarily fix dimensions of responsive containers for html2canvas
    const responsiveContainers = reportContentRef.current.querySelectorAll('.recharts-responsive-container');
    responsiveContainers.forEach(container => {
        container.style.width = container.offsetWidth + 'px'; // Set fixed width
        container.style.height = container.offsetHeight + 'px'; // Set fixed height
    });


    try {
        // Short delay to allow browser to acknowledge style changes if any
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(reportContentRef.current, {
            scale: 2, // Higher scale for better quality
            useCORS: true, // If you have external images
            logging: false, // Disable logging for cleaner console
            onclone: (document) => {
                // Ensure text elements are fully visible, sometimes they get cut off
                document.querySelectorAll('.recharts-text, .recharts-label').forEach(textElement => {
                    textElement.style.overflow = 'visible'; // Or other appropriate style
                });
            }
        });

        // Restore original styles for responsive containers
        responsiveContainers.forEach(container => {
            container.style.width = '';
            container.style.height = '';
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p', // portrait
            unit: 'px', // points, pixels, inches, mm, cm
            format: 'a4', // page format
            putOnlyUsedFonts:true,
            floatPrecision: 16 // or "smart"
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;

        // Calculate new dimensions to fit A4, maintaining aspect ratio
        let newImgWidth = pdfWidth - 20; // 10px margin on each side
        let newImgHeight = newImgWidth / ratio;

        if (newImgHeight > pdfHeight - 20) { // If height exceeds page with margin
            newImgHeight = pdfHeight - 20; // 10px margin top/bottom
            newImgWidth = newImgHeight * ratio;
        }

        const x = (pdfWidth - newImgWidth) / 2; // Center horizontally
        const y = 10; // 10px margin from top

        pdf.addImage(imgData, 'PNG', x, y, newImgWidth, newImgHeight);

        const reportDate = new Date().toLocaleDateString().replace(/\//g, '-');
        const reportTitleForFile = reportData.reportTitle?.replace(/\s+/g, '_') || "report";
        pdf.save(`${reportTitleForFile}_${reportDate}.pdf`);

        toast.success("PDF downloaded!", { id: toastId });

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error("Could not generate PDF.", { id: toastId });
        // Restore original styles even on error
        responsiveContainers.forEach(container => {
            container.style.width = '';
            container.style.height = '';
        });
    } finally {
        setIsDownloadingPdf(false);
    }
  };


  const renderReportData = () => {
    if (!reportData) return null;
    if (reportData.error) return <p className="text-red-500 mt-4">{reportData.error}</p>;
    // Use the originalReportType stored in reportData for consistent rendering
    const typeToRender = reportData.originalReportType || reportType;


    switch (typeToRender) {
      case 'revenue': return <RevenueReportDisplay data={reportData} reportRef={reportContentRef} />;
      case 'ticketSales': return <TicketSalesReportDisplay data={reportData} reportRef={reportContentRef} />;
      case 'seatOccupancy': return <SeatOccupancyReportDisplay data={reportData} reportRef={reportContentRef} />;
      case 'auditoriumUsage': return <AuditoriumUsageReportDisplay data={reportData} reportRef={reportContentRef} />;
      default:
        return <p className="mt-4">Report display for '{typeToRender}' not implemented or data mismatch.</p>;
    }
  };

  const availableReportTypes = () => {
    let types = [];
    if (isOrganizer) {
        types = [
            { value: 'ticketSales', label: 'Ticket Sales', icon: ReportTicketIcon },
            { value: 'revenue', label: 'Revenue', icon: CurrencyDollarIcon },
            { value: 'seatOccupancy', label: 'Seat Occupancy (Single Event)', icon: ChartBarIcon },
        ];
    }
    if (isAdmin) { // Admin sees all organizer reports + their own
        types = [
            { value: 'ticketSales', label: 'Event Ticket Sales', icon: ReportTicketIcon },
            { value: 'revenue', label: 'Event Revenue', icon: CurrencyDollarIcon },
            { value: 'seatOccupancy', label: 'Event Seat Occupancy (Single Event)', icon: ChartBarIcon },
            { value: 'auditoriumUsage', label: 'Auditorium Usage', icon: BuildingOfficeIcon },
        ];
    }
    return types;
  };

  const eventsForDropdown = isAdmin ? allEvents : userEvents;
  const eventSpecificReportTypes = ['ticketSales', 'revenue', 'seatOccupancy'];
  const showEventSelector = eventSpecificReportTypes.includes(reportType);


  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        <DocumentMagnifyingGlassIcon className="h-7 w-7 mr-2 text-sky-600" />
        Analytics & Reports
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6 p-4 border border-sky-200 bg-sky-50/50 rounded-lg items-end">
        <div>
          <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <select
            id="reportType"
            value={reportType}
            onChange={(e) => {
                setReportType(e.target.value);
                const newReportType = e.target.value;
                // If the new report type is not event-specific, clear the selected event
                if (!eventSpecificReportTypes.includes(newReportType)) {
                    setSelectedEventId('');
                }
                setReportData(null); // Clear previous report data when type changes
            }}
            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
          >
            <option value="">-- Select Report --</option>
            {availableReportTypes().map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
        </div>

        {/* Conditionally render Event Selector based on reportType */}
        {showEventSelector && (
          <div>
            <label htmlFor="selectedEventId" className="block text-sm font-medium text-gray-700 mb-1">
              Event
            </label>
            <select
              id="selectedEventId"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
              disabled={!reportType} // Also disable if no report type is selected
            >
              <option value="">-- Select Specific Event --</option>
              {eventsForDropdown.length === 0 && <option value="" disabled>No specific events found</option>}
              {eventsForDropdown.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="periodOption" className="block text-sm font-medium text-gray-700 mb-1">
            Period
          </label>
          <select
            id="periodOption"
            value={periodOption}
            onChange={(e) => setPeriodOption(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="daily">Specific Day</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {periodOption === 'daily' && (
          <div className={showEventSelector ? "lg:col-start-1" : "lg:col-start-2"}> {/* Adjust grid placement */}
            <label htmlFor="specificDate" className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <input
              type="date"
              id="specificDate"
              value={specificDate}
              max={new Date().toISOString().split("T")[0]} // Prevent future dates
              onChange={(e) => setSpecificDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
            />
          </div>
        )}

        {periodOption === 'custom' && (
          <>
            <div className={showEventSelector ? "" : "lg:col-start-2"}> {/* Adjust grid placement */}
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={customDateRange.startDate}
                max={customDateRange.endDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={customDateRange.endDate}
                min={customDateRange.startDate} // Ensure end date is not before start date
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
              />
            </div>
          </>
        )}
        {/* Generate Report Button - ensure it's always in a logical place */}
        <div className={`md:col-span-full ${showEventSelector ? 'lg:col-start-3' : 'lg:col-start-2 lg:col-span-1'} lg:self-end`}>
             <button
                onClick={handleGenerateReport}
                disabled={isLoading || !reportType || (showEventSelector && !selectedEventId)}
                className="w-full bg-sky-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
            {isLoading ? ( <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> ) : ( <FunnelIcon className="h-5 w-5 mr-2" /> )}
            {isLoading ? 'Generating...' : 'Generate Report'}
            </button>
        </div>
      </div>


      {error && (
        <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!isLoading && !error && reportData && (
        <div id="report-content-area" ref={reportContentRef}>
          {renderReportData()}
        </div>
      )}

      {!isLoading && !error && reportData && (
        <div className="mt-6 flex justify-end">
            <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="bg-teal-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
            >
                {isDownloadingPdf ? (
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                ) : (
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                )}
                {isDownloadingPdf ? 'Downloading...' : 'Download as PDF'}
            </button>
        </div>
      )}

      {/* Placeholder when no report is generated yet */}
      {!isLoading && !error && !reportData && (
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500">
            <PresentationChartLineIcon className="h-16 w-16 mx-auto text-gray-300 mb-4"/>
            <p className="text-lg">Select your report criteria and click "Generate Report".</p>
            <p className="text-sm">Your generated report will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsReports;
