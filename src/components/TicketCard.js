// components/TicketCard.js
import React from 'react';

function TicketCard({ ticket, isPast }) {
 return (
  <div className="border rounded shadow-md p-4 mb-4 flex items-center">
   <div className="bg-gray-100 aspect-w-16 aspect-h-9 rounded mr-4 w-32 flex items-center justify-center text-gray-400">
    {/* Placeholder for Ticket Preview */}
    Ticket Preview
   </div>
   <div>
    <h3 className="font-semibold">{ticket.name}</h3>
    <p className="text-sm text-gray-600">{ticket.date}</p>
    {isPast && <span className="text-xs text-gray-500 italic">Event Ended</span>}
   </div>
  </div>
 );
}

export default TicketCard;