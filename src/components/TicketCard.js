// components/TicketCard.js
import React from 'react';
import Link from 'next/link';

function TicketCard({ ticket }) {
  return (
    <Link href={`/tickets/${ticket.id}`} className="group block">
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 group-hover:shadow-md group-hover:border-sky-100">
        <div className="w-72 bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center relative">
          <div className="text-gray-400 group-hover:text-sky-500 transition-colors">Event Poster</div>
          {/* Decorative elements */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-white rounded-full border-4 border-gray-100" />
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-white rounded-full border-4 border-gray-100" />
        </div>
        <div className="flex-1 p-6 flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-sky-600 transition-colors">{ticket.eventName}</h3>
          <p className="text-sm text-gray-600 mt-1">{ticket.date}</p>
          <div className="mt-auto pt-4 flex items-center text-sm text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full bg-sky-400 mr-2"></span>
            Active
          </div>
        </div>
      </div>
    </Link>
  );
}

export default TicketCard;