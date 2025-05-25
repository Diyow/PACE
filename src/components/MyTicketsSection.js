// src/components/MyTicketsSection.js
"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import TicketCard from './TicketCard';
import Link from 'next/link';
import { ClockIcon, CalendarDaysIcon, TicketIcon as TabTicketIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'; // Added icons for better UI

function MyTicketsSection() {
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [userTickets, setUserTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserTickets = async () => {
      if (sessionStatus === 'authenticated' && session?.user?.id) {
        setLoading(true);
        setError(null);
        try {
          // Fetches all confirmed tickets for the user.
          // The API /api/tickets already fetches associated event details.
          const response = await fetch(`/api/tickets?status=confirmed`); // Fetch confirmed tickets
          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to fetch tickets');
          }
          const data = await response.json();
          setUserTickets(data);
        } catch (err) {
          console.error('Error fetching user tickets:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else if (sessionStatus === 'unauthenticated') {
        setUserTickets([]); // Clear tickets if user logs out
        setLoading(false);
      }
    };

    fetchUserTickets();
  }, [sessionStatus, session]);

  const now = new Date();

  const upcomingTickets = userTickets.filter(ticket => {
    if (!ticket.event || !ticket.event.date) return false;
    const eventDateTimeStr = `${ticket.event.date}T${ticket.event.time || '00:00:00'}`;
    try {
        const eventDate = new Date(eventDateTimeStr);
        return eventDate >= now;
    } catch (e) {
        console.error("Error parsing date for upcoming filter:", ticket.event.name, e);
        return false;
    }
  }).sort((a, b) => { // Sort upcoming tickets by soonest first
      const dateA = new Date(`${a.event.date}T${a.event.time || '00:00:00'}`);
      const dateB = new Date(`${b.event.date}T${b.event.time || '00:00:00'}`);
      return dateA - dateB;
  });


  const pastTickets = userTickets.filter(ticket => {
    if (!ticket.event || !ticket.event.date) return false;
    const eventDateTimeStr = `${ticket.event.date}T${ticket.event.time || '00:00:00'}`;
     try {
        const eventDate = new Date(eventDateTimeStr);
        return eventDate < now;
    } catch (e) {
        console.error("Error parsing date for past filter:", ticket.event.name, e);
        return false;
    }
  }).sort((a, b) => { // Sort past tickets by most recent first
      const dateA = new Date(`${a.event.date}T${a.event.time || '00:00:00'}`);
      const dateB = new Date(`${b.event.date}T${b.event.time || '00:00:00'}`);
      return dateB - dateA;
  });

  const ticketsToDisplay = activeTab === 'upcoming' ? upcomingTickets : pastTickets;

  if (sessionStatus === 'loading') {
    return (
      <section className="py-12 bg-gradient-to-b from-white to-sky-50/30">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500">Loading your tickets...</p>
        </div>
      </section>
    );
  }
  
  if (sessionStatus === 'unauthenticated') {
     return (
      <section className="py-12 bg-gradient-to-b from-white to-sky-50/30">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <div className="flex flex-col items-center justify-center bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <TabTicketIcon className="h-12 w-12 text-sky-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">View Your Tickets</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Please <Link href="/login" className="text-sky-600 hover:text-sky-700 font-medium underline">log in</Link> to see your purchased event tickets and manage your bookings.
            </p>
          </div>
        </div>
      </section>
    );
  }


  return (
    <section className="py-12 bg-gradient-to-b from-white to-sky-50/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            My Tickets
          </h2>
          <div className="inline-flex p-1 rounded-xl bg-sky-100/70 backdrop-blur-sm shadow-sm">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`relative px-4 sm:px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2
                ${activeTab === 'upcoming' ? 'text-sky-700 bg-white shadow-md' : 'text-sky-600 hover:text-sky-700 hover:bg-white/50'}`}
            >
              <CalendarDaysIcon className="h-5 w-5" /> Upcoming ({upcomingTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`relative px-4 sm:px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2
                ${activeTab === 'past' ? 'text-sky-700 bg-white shadow-md' : 'text-sky-600 hover:text-sky-700 hover:bg-white/50'}`}
            >
              <ClockIcon className="h-5 w-5" /> Past ({pastTickets.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
            <p className="mt-3 text-gray-500">Fetching your tickets...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-600 bg-red-50 p-6 rounded-lg border border-red-200 flex flex-col items-center">
            <ExclamationCircleIcon className="h-8 w-8 mb-2"/>
            <p className="font-medium">Error loading tickets:</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : ticketsToDisplay.length === 0 ? (
          <div className="text-center py-12 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <TabTicketIcon className="h-12 w-12 text-sky-400 mx-auto mb-4" />
            <p className="text-lg text-gray-500">
              You have no {activeTab} tickets at the moment.
            </p>
             {activeTab === 'upcoming' && (
                <a 
                    href="/#events" 
                    className="mt-4 inline-block px-6 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
                >
                    Explore Events
                </a>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {ticketsToDisplay.map(ticket => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default MyTicketsSection;