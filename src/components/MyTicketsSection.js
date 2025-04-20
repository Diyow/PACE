// components/MyTicketsSection.js
"use client";

import React, { useState } from 'react';
import TicketCard from './TicketCard';

function MyTicketsSection() {
 const [activeTab, setActiveTab] = useState('Upcoming');
 // Replace with your actual ticket data
 const upcomingTickets = [
  { id: 1, name: 'Event Name 1', date: '01 Jan, 2025 - 00:00' },
  { id: 2, name: 'Event Name 2', date: '01 Jan, 2025 - 00:00' },
 ];
 const pastTickets = [
  { id: 3, name: 'Event Name 3', date: '01 Jan, 2024 - 00:00' },
 ];

 return (
  <section className="mt-8">
   <h2>My Tickets</h2>
   <div className="flex border-b">
    <button
     className={`py-2 px-4 ${activeTab === 'Upcoming' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-600'}`}
     onClick={() => setActiveTab('Upcoming')}
    >
     Upcoming
    </button>
    <button
     className={`py-2 px-4 ${activeTab === 'Past' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-600'}`}
     onClick={() => setActiveTab('Past')}
    >
     Past
    </button>
   </div>
   <div className="mt-4">
    {activeTab === 'Upcoming' && upcomingTickets.map(ticket => (
     <TicketCard key={ticket.id} ticket={ticket} />
    ))}
    {activeTab === 'Past' && pastTickets.map(ticket => (
     <TicketCard key={ticket.id} ticket={ticket} isPast={true} />
    ))}
    {activeTab === 'Upcoming' && upcomingTickets.length === 0 && <p className="text-gray-500">No upcoming tickets.</p>}
    {activeTab === 'Past' && pastTickets.length === 0 && <p className="text-gray-500">No past tickets.</p>}
   </div>
  </section>
 );
}

export default MyTicketsSection;