// components/EventCard.js
import React from 'react';

function EventCard({ event }) {
 return (
  <div className="border rounded shadow-md p-4">
   <div className="bg-gray-100 aspect-w-16 aspect-h-9 rounded mb-2 flex items-center justify-center text-gray-400">
    {/* Placeholder for Event Poster */}
    Event Poster
   </div>
   <h3 className="font-semibold">{event.name}</h3>
   <p className="text-sm text-gray-600">{event.date}</p>
   <p className="text-xs text-gray-500">{event.description}</p>
  </div>
 );
}

export default EventCard;