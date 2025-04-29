'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  ClockIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

const mockEvents = [
  { 
    id: 1, 
    name: 'Summer Music Festival', 
    date: '2024-07-15', 
    ticketsSold: 250, 
    status: 'upcoming',
    venue: 'Central Park',
  },
  { 
    id: 2, 
    name: 'Tech Conference 2024', 
    date: '2024-08-20', 
    ticketsSold: 180, 
    status: 'upcoming',
    venue: 'Convention Center',
  },
  { 
    id: 3, 
    name: 'Food & Wine Festival', 
    date: '2024-06-10', 
    ticketsSold: 320, 
    status: 'upcoming',
    venue: 'City Square',
  },
];

export default function EventsList() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Events</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'past'
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Past
            </button>
          </div>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mt-6 divide-y divide-gray-100">
        <AnimatePresence>
          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-4 flex items-center justify-between group hover:bg-gray-50 rounded-lg px-4 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-sky-600 transition-colors">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 inline mr-1" />
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {event.venue}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{event.ticketsSold} tickets sold</p>
                  <p className="text-sm text-gray-500">${(event.ticketsSold * 50).toLocaleString()} revenue</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 