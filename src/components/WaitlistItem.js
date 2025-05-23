// src/components/WaitlistItem.js
"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { PhotoIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline'; // Added icons
import Link from 'next/link';

function WaitlistItem({ item, onLeaveSuccess }) {
  const [isLeaving, setIsLeaving] = useState(false);

  // Extract event details from the item (assuming API populates item.event)
  const eventName = item.event?.name || 'Event Name Not Available';
  let eventDateStr = 'Date N/A';
  let eventTimeStr = '';

  if (item.event?.date) {
    try {
        const eventDateTime = new Date(`${item.event.date}T${item.event.time || '00:00:00'}`);
        eventDateStr = eventDateTime.toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
        });
        if (item.event.time) {
            eventTimeStr = eventDateTime.toLocaleTimeString(undefined, {
                hour: '2-digit', minute: '2-digit',
            });
        }
    } catch(e) {
        console.error("Error formatting date for waitlist item:", item.event.date, e);
        eventDateStr = item.event.date; // Fallback
    }
  }
  
  const joinedDate = item.joinedAt ? new Date(item.joinedAt).toLocaleDateString() : 'N/A';
  const status = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown';


  const handleLeave = async (e) => {
    e.preventDefault();
    if (!item.eventId) {
        toast.error("Event ID missing, cannot leave waitlist.");
        return;
    }
    if (!confirm(`Are you sure you want to leave the waitlist for "${eventName}"?`)) {
        return;
    }

    setIsLeaving(true);
    try {
      // The DELETE API uses session to identify the user, eventId is needed in query
      const response = await fetch(`/api/waitlist?eventId=${item.eventId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave waitlist.');
      }
      onLeaveSuccess(); // This will call handleLeaveWaitlistSuccess in WaitlistSection
      // Toast success is handled by the parent
    } catch (err) {
      console.error('Error leaving waitlist:', err);
      toast.error(err.message);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-sky-200 transition-all group hover:shadow-md">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Link href={`/events/${item.eventId}`} className="shrink-0">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-blue-100 rounded-lg flex items-center justify-center group-hover:from-sky-200 group-hover:to-blue-200 transition-colors">
            {/* Assuming item.event.posterUrl might exist in the future via API population */}
            {item.event?.posterUrl ? (
                 <img src={item.event.posterUrl} alt={`${eventName} poster`} className="w-full h-full object-cover rounded-lg" />
            ) : (
                <PhotoIcon className="h-10 w-10 text-sky-400 group-hover:text-sky-500 transition-colors" />
            )}
          </div>
        </Link>
        <div className="flex-grow">
          <Link href={`/events/${item.eventId}`}>
            <h3 className="font-semibold text-gray-800 group-hover:text-sky-600 transition-colors text-lg">
              {eventName}
            </h3>
          </Link>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            <p className="flex items-center">
                <CalendarDaysIcon className="h-3.5 w-3.5 mr-1 text-gray-400"/> Event Date: {eventDateStr} {eventTimeStr && `at ${eventTimeStr}`}
            </p>
            <p className="flex items-center">
                <ClockIcon className="h-3.5 w-3.5 mr-1 text-gray-400"/> Joined Waitlist: {joinedDate}
            </p>
             <p>
                Status: <span className={`font-medium ${
                    status === 'Waiting' ? 'text-yellow-600' :
                    status === 'Notified' ? 'text-blue-600' :
                    status === 'Converted' ? 'text-green-600' :
                    'text-gray-500'
                }`}>{status}</span>
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={handleLeave}
        disabled={isLeaving}
        className="mt-3 sm:mt-0 w-full sm:w-auto shrink-0 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
      >
        {isLeaving ? 'Leaving...' : 'Leave Waitlist'}
      </button>
    </div>
  );
}

export default WaitlistItem;