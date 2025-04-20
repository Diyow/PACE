'use client';

import RoleGuard from '@/components/RoleGuard'

export default function OrganizerDashboard() {
  return (
    <RoleGuard allowedRoles={['organizer', 'admin']}>
      <div className="min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Organizer Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Organizer dashboard content */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">My Events</h2>
            <p className="text-gray-600">Manage your events</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Event Analytics</h2>
            <p className="text-gray-600">View event statistics</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Attendee Management</h2>
            <p className="text-gray-600">Manage event attendees</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}