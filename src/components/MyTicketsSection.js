// components/MyTicketsSection.js
"use client";

import React, { useState } from 'react';
import TicketCard from './TicketCard';

function MyTicketsSection() {
 const [activeTab, setActiveTab] = useState('upcoming');
 
 // Replace with your actual ticket data
 const tickets = [
  { id: 1, eventName: 'Event Name', date: '01 Jan, 2025 - 00:00' },
  { id: 2, eventName: 'Event Name', date: '01 Jan, 2025 - 00:00' },
  { id: 3, eventName: 'Event Name', date: '01 Jan, 2025 - 00:00' }
 ];

 return (
  <section className="py-12 bg-gradient-to-b from-white to-sky-50/30">
   <div className="max-w-7xl mx-auto px-4">
    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
     My Tickets
     <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-600">
      {tickets.length}
     </span>
    </h2>
    
    <div className="inline-flex p-1 rounded-xl bg-sky-50/50 backdrop-blur-sm mb-8">
     <button
      onClick={() => setActiveTab('upcoming')}
      className={`relative px-8 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
       activeTab === 'upcoming'
         ? 'text-sky-700 bg-white shadow-sm'
         : 'text-sky-600 hover:text-sky-700'
      }`}
     >
       Upcoming
       {activeTab === 'upcoming' && (
         <span className="absolute inset-0 rounded-lg bg-white shadow-sm transition-all duration-200" style={{ zIndex: -1 }} />
       )}
     </button>
     <button
      onClick={() => setActiveTab('past')}
      className={`relative px-8 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
       activeTab === 'past'
         ? 'text-sky-700 bg-white shadow-sm'
         : 'text-sky-600 hover:text-sky-700'
      }`}
     >
       Past
       {activeTab === 'past' && (
         <span className="absolute inset-0 rounded-lg bg-white shadow-sm transition-all duration-200" style={{ zIndex: -1 }} />
       )}
     </button>
    </div>

    <div className="space-y-6">
     {tickets.map(ticket => (
      <TicketCard key={ticket.id} ticket={ticket} />
     ))}
    </div>
   </div>
  </section>
 );
}

export default MyTicketsSection;