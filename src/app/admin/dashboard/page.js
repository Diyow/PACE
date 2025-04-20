'use client'

import { useState } from 'react'
import RoleGuard from '@/components/RoleGuard'
import { UserCircleIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Administrator Dashboard</h1>
        
        {/* Register Event Organizer Button */}
        <Link 
          href="/admin/register-organizer"
          className="inline-block bg-gray-900 text-white px-6 py-2 rounded-md mb-8 hover:bg-gray-800 transition-colors"
        >
          Register Event Organizer
        </Link>

        {/* Organizers Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Organizers</h2>
          
          {/* Organizer Cards */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Organizer Name</h3>
                <p className="text-gray-500 text-sm">Organization Name</p>
                <p className="text-gray-500 text-sm">Email</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Organizer Name</h3>
                <p className="text-gray-500 text-sm">Organization Name</p>
                <p className="text-gray-500 text-sm">Email</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Reports Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Analytics Report</h3>
            <div className="flex justify-between items-center">
              <span className="text-4xl font-bold">0</span>
              <span className="text-3xl">😊</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Analytics Report</h3>
            <div className="flex justify-between items-center">
              <span className="text-4xl font-bold">0</span>
              <span className="text-3xl">😊</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Analytics Report</h3>
            <div className="flex justify-between items-center">
              <span className="text-4xl font-bold">0</span>
              <span className="text-3xl">😊</span>
            </div>
          </div>
        </div>

        {/* Bottom Section Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-semibold">Activity History 1</p>
                  <p className="text-sm text-gray-500">User/Admin - 0 Hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-semibold">Activity History 1</p>
                  <p className="text-sm text-gray-500">User/Admin - 0 Hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ChartBarIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-semibold">Activity History 1</p>
                  <p className="text-sm text-gray-500">User/Admin - 0 Hours ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Overview */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">System Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>System Status</span>
                <span className="bg-gray-100 px-3 py-1 rounded-md text-sm">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Active Users</span>
                <span>32</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
