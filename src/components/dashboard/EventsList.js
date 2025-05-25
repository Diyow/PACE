'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  ClockIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function EventsList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Fetch events from the API
  useEffect(() => {
    const fetchEvents = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        // Add status filter based on active tab and filter by current user's ID
        const status = activeTab === 'upcoming' ? 'upcoming' : 'past';
        const response = await fetch(`/api/events?status=${status}&organizerId=${session.user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [activeTab, session]); // Re-fetch when tab changes or session changes

  // Filter events based on search term
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Format date to be displayed in the UI
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // Handle edit event
  const handleEditEvent = (eventId) => {
    router.push(`/organizer/edit-event/${eventId}`);
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      // Remove the deleted event from the state
      setEvents(events.filter(event => event._id !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  // Toggle menu for an event
  const toggleMenu = (eventId) => {
    setOpenMenuId(openMenuId === eventId ? null : eventId);
  };

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
        {loading ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        ) : error ? (
          <div className="py-8 flex justify-center items-center text-red-500">
            <ExclamationCircleIcon className="h-6 w-6 mr-2" />
            <p>{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {searchTerm ? 'No events match your search' : 'No events found'}
          </div>
        ) : (
          <AnimatePresence>
            {filteredEvents.map((event) => (
              <motion.div
                key={event._id}
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
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{event.totalTicketsSold || 0} tickets sold</p>
                    <p className="text-sm text-gray-500">${(event.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} revenue</p>
                  </div>
                  <div className="relative">
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg transition-opacity"
                      onClick={() => toggleMenu(event._id)}
                    >
                      <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    
                    {openMenuId === event._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                        <button
                          onClick={() => handleEditEvent(event._id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <PencilSquareIcon className="h-4 w-4 mr-2" />
                          Edit Event
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Event
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
