// components/EventCard.js
import React from 'react';
import Link from 'next/link';

function EventCard({ event }) {
  return (
    <Link href={`/events/${event.id}`} className="group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02] group-hover:border-sky-100">
        <div className="aspect-[4/3] bg-gradient-to-br from-sky-50 to-blue-50 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 group-hover:text-sky-500 transition-colors">
            Event Poster
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 group-hover:text-sky-600 transition-colors">{event.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{event.date}</p>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
        </div>
      </div>
    </Link>
  );
}

export default EventCard;