'use client'

import { useState, useEffect } from 'react'
import RoleGuard from '@/components/RoleGuard'
import { 
  UserCircleIcon, 
  CalendarIcon, 
  UserGroupIcon,
  TicketIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import StatsCard from '@/components/dashboard/StatsCard'
import OrganizersList from '@/components/dashboard/OrganizersList'
import RecentActivity from '@/components/dashboard/RecentActivity'
import AnalyticsReports from '@/components/dashboard/AnalyticsReports';

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    {
      title: 'Total Organizers',
      value: '0',
      icon: BuildingOfficeIcon,
      trendValue: '+0 this month'
    },
    {
      title: 'Active Events',
      value: '0',
      icon: CalendarIcon,
      trendValue: '+0 this week'
    },
    {
      title: 'Total Tickets Sold',
      value: '0',
      icon: TicketIcon,
      trendValue: '+0 today'
    },
    {
      title: 'Active Users',
      value: '0',
      icon: UserCircleIcon,
      trendValue: '+0 this week'
    }
  ])
  
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingStats(true);
      try {
        // Fetch organizers count
        const organizersResponse = await fetch('/api/organizers');
        let organizersCount = 0;
        if (organizersResponse.ok) {
          const organizersData = await organizersResponse.json();
          organizersCount = organizersData.length;
        } else {
          console.error('Failed to fetch organizers:', organizersResponse.statusText);
        }
        
        // Fetch active events count (upcoming)
        const eventsResponse = await fetch('/api/events?status=upcoming');
        let activeEventsCount = 0;
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          activeEventsCount = eventsData.length;
        } else {
          console.error('Failed to fetch events:', eventsResponse.statusText);
        }

        // Fetch total tickets sold
        let totalTicketsSoldCount = 0;
        try {
            // Assuming an admin-accessible route for ALL bookings
            const allBookingsResponse = await fetch('/api/bookings'); 
            if (allBookingsResponse.ok) {
                const allBookingsData = await allBookingsResponse.json();
                totalTicketsSoldCount = allBookingsData
                    .filter(booking => booking.paymentStatus === 'completed')
                    .reduce((sum, booking) => {
                        return sum + (booking.ticketDetails?.reduce((ticketSum, detail) => ticketSum + (detail.quantity || 0), 0) || 0);
                    }, 0);
            } else {
                 console.error('Failed to fetch all bookings for ticket count:', allBookingsResponse.statusText);
            }
        } catch (bookingError) {
            console.error('Error fetching all bookings:', bookingError);
        }
        
        // Fetch active users (placeholder)
        let activeUsersCount = 0;
        // console.warn("Active users count is a placeholder. Implement API if needed.");


        setStats(prevStats => {
          const newStats = [...prevStats];
          newStats[0] = { ...newStats[0], value: organizersCount.toString(), trendValue: `+${Math.floor(organizersCount * 0.05) || 0} this month` };
          newStats[1] = { ...newStats[1], value: activeEventsCount.toString(), trendValue: `+${Math.floor(activeEventsCount * 0.1) || 0} this week` };
          newStats[2] = { ...newStats[2], value: totalTicketsSoldCount.toLocaleString(), trendValue: `+${Math.floor(totalTicketsSoldCount * 0.02) || 0} today` };
          newStats[3] = { ...newStats[3], value: activeUsersCount.toLocaleString(), trendValue: `+${Math.floor(activeUsersCount * 0.01) || 0} this week` };
          return newStats;
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white p-8 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Administrator Dashboard</h1>
            <p className="text-sky-100">Welcome back! Here&apos;s what&apos;s happening with your events platform.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Quick Actions */}
          <div className="mb-8">
            <Link 
              href="/admin/register-organizer"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg shadow-md hover:from-sky-600 hover:to-blue-600 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Register Event Organizer
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} isLoading={loadingStats} />
            ))}
          </div>

          {/* Main Content Grid (Organizers & Recent Activity) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"> {/* Added mb-8 for spacing */}
            {/* Organizers Section */}
            <div className="lg:col-span-2">
              <OrganizersList />
            </div>

            {/* Recent Activity */}
            <RecentActivity />
          </div>

          {/* Analytics Reports Section - MOVED HERE */}
          <div className="mt-8"> {/* Added mt-8 for spacing from the grid above */}
            <AnalyticsReports />
          </div>

        </div>
      </div>
    </RoleGuard>
  );
}
