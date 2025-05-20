// components/EventsSection.js
'use client'
import React, { useState, useEffect } from 'react';
import EventCard from './EventCard';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

function EventsSection() {
 const [searchQuery, setSearchQuery] = useState('');
 const [events, setEvents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 
 // Fetch events from the API
 useEffect(() => {
  const fetchEvents = async () => {
   try {
    setLoading(true);
    const response = await fetch('/api/events');
    
    if (!response.ok) {
     throw new Error('Failed to fetch events');
    }
    
    const data = await response.json();
    setEvents(data);
   } catch (err) {
    console.error('Error fetching events:', err);
    setError('Failed to load events. Please try again later.');
   } finally {
    setLoading(false);
   }
  };
  
  fetchEvents();
 }, []);

 // Filter events based on search query
 const filteredEvents = events.filter(event => 
  event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
 );

 const handleSearch = (e) => {
  setSearchQuery(e.target.value);
 };

 const clearSearch = () => {
  setSearchQuery('');
 };

 return (
  <section className="py-8">
   <div className="max-w-7xl mx-auto px-4">
    <h2 className="text-2xl font-semibold text-gray-900 mb-6">Events</h2>
    
    <div className="flex gap-4 mb-6">
     <div className="flex-1 relative group">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
      <input
       type="text"
       value={searchQuery}
       onChange={handleSearch}
       placeholder="Search Events..."
       className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-200 transition-all duration-200 placeholder:text-gray-400"
      />
      {searchQuery && (
       <button
        onClick={clearSearch}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
       >
        <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
       </button>
      )}
     </div>
     <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
      <FunnelIcon className="h-5 w-5 text-gray-500" />
      <span className="text-sm text-gray-700">Filters</span>
     </button>
    </div>

    {loading ? (
     <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
     </div>
    ) : error ? (
     <div className="text-center py-12 text-red-500">{error}</div>
    ) : filteredEvents.length === 0 ? (
     <div className="text-center py-12 text-gray-500">
      {searchQuery ? 'No events match your search' : 'No events available'}
     </div>
    ) : (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredEvents.map(event => (
       <EventCard key={event._id} event={{
        id: event._id,
        name: event.name,
        date: (() => {
          const eventDate = new Date(event.date + 'T' + (event.time || '00:00'));
          const formattedDate = eventDate.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
          const hours = eventDate.getHours().toString().padStart(2, '0');
          const minutes = eventDate.getMinutes().toString().padStart(2, '0');
          return `${formattedDate} at ${hours}.${minutes}`;
        })(),
        description: event.description || 'No description available'
       }} />
      ))}
     </div>
    )}
   </div>
  </section>
 );
}

export default EventsSection;