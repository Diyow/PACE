// components/EventsSection.js
'use client'
import React, { useState } from 'react';
import EventCard from './EventCard';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

function EventsSection() {
 const [searchQuery, setSearchQuery] = useState('');
 
 // Replace with your actual event data
 const events = [
  { id: 1, name: 'Event Name', date: '01 Jan, 2025', description: 'Description..' },
  { id: 2, name: 'Event Name', date: '01 Jan, 2025', description: 'Description..' },
  { id: 3, name: 'Event Name', date: '01 Jan, 2025', description: 'Description..' },
  { id: 4, name: 'Event Name', date: '01 Jan, 2025', description: 'Description..' },
  { id: 5, name: 'Event Name', date: '01 Jan, 2025', description: 'Description..' }
 ];

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

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
     {events.map(event => (
      <EventCard key={event.id} event={event} />
     ))}
    </div>
   </div>
  </section>
 );
}

export default EventsSection;