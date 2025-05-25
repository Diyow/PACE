'use client';

import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import AnalyticsCards from '@/components/dashboard/AnalyticsCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import EventsList from '@/components/dashboard/EventsList';
import AnalyticsReports from '@/components/dashboard/AnalyticsReports';

export default function OrganizerDashboard() {
  return (
    <RoleGuard allowedRoles={['organizer', 'admin']}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white p-8 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Event Organizer Dashboard</h1>
            <p className="text-sky-100">Welcome back! Here&apos;s what&apos;s happening with your events.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* Quick Actions */}
          <div className="mb-8">
            <Link 
              href="/organizer/create-event"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg shadow-md hover:from-sky-600 hover:to-blue-600 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Create New Event
            </Link>
          </div>

          {/* Dashboard Content */}
          <div className="space-y-8">
            <AnalyticsCards />
            <EventsList />
            <AnalyticsReports />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}