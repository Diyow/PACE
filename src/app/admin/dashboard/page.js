'use client'

import { useState } from 'react'
import RoleGuard from '@/components/RoleGuard'
import { 
  UserCircleIcon, 
  CalendarIcon, 
  ChartBarIcon,
  UserGroupIcon,
  TicketIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import StatsCard from '@/components/dashboard/StatsCard'
import OrganizersList from '@/components/dashboard/OrganizersList'
import RecentActivity from '@/components/dashboard/RecentActivity'

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Organizers',
      value: '12',
      icon: BuildingOfficeIcon,
      trendValue: '+2 this month'
    },
    {
      title: 'Active Events',
      value: '24',
      icon: CalendarIcon,
      trendValue: '+5 this week'
    },
    {
      title: 'Total Tickets',
      value: '1,234',
      icon: TicketIcon,
      trendValue: '+123 today'
    },
    {
      title: 'Active Users',
      value: '892',
      icon: UserCircleIcon,
      trendValue: '+45 this week'
    }
  ]

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white p-8 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Administrator Dashboard</h1>
            <p className="text-sky-100">Welcome back! Here's what's happening with your events platform.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* Quick Actions */}
          <div className="mb-8">
            <Link 
              href="/admin/register-organizer"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg shadow-md hover:from-sky-600 hover:to-blue-600 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Register Event Organizer
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Organizers Section */}
            <div className="lg:col-span-2">
              <OrganizersList />
            </div>

            {/* Recent Activity */}
            <RecentActivity />
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
