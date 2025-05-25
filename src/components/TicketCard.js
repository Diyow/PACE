import React from 'react';
import Image from 'next/image';
import { PhotoIcon, CalendarDaysIcon, ClockIcon, TicketIcon as CardTicketIcon } from '@heroicons/react/24/outline';

function TicketCard({ ticket }) {
  const eventName = ticket.event?.name || 'Event Name Not Available';
  let eventDateStr = 'Date Not Available';
  let eventTimeStr = '';

  if (ticket.event?.date) {
    const eventDateObj = new Date(`${ticket.event.date}T${ticket.event.time || '00:00:00'}`);
    eventDateStr = eventDateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    eventTimeStr = eventDateObj.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const ticketCategory = ticket.ticketType?.category || 'General Admission';
  const ticketStatus = ticket.status ? ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1) : 'Unknown';

  return (
    <div className="group block">
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:border-sky-200 group-hover:scale-[1.01]">
        <div className="w-1/3 sm:w-48 md:w-56 bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center relative p-4 overflow-hidden">
          {ticket.event?.posterUrl ? (
            <Image
                src={ticket.event.posterUrl}
                alt={`${eventName} Poster`}
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-md shadow-sm"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 192px, 224px"
            />
          ) : (
            <PhotoIcon className="h-16 w-16 text-gray-300 group-hover:text-sky-400 transition-colors" />
          )}
        </div>
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-sky-600 transition-colors">
              {eventName}
            </h3>
            <div className="text-xs sm:text-sm text-gray-500 mt-1.5 space-y-1">
              <p className="flex items-center">
                <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                {eventDateStr}
              </p>
              {eventTimeStr && (
                <p className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                  {eventTimeStr}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="text-xs sm:text-sm text-gray-600">
              <p className="flex items-center">
                <CardTicketIcon className="h-4 w-4 mr-1.5 text-sky-500" />
                {ticketCategory}
                 {ticket.seatInfo && <span className="ml-1 text-gray-500">(Seat: {ticket.seatInfo})</span>}
              </p>
            </div>
            <span className={`mt-2 sm:mt-0 px-2.5 py-0.5 inline-block text-xs font-medium rounded-full
              ${ticketStatus === 'Confirmed' ? 'bg-green-100 text-green-700' :
               ticketStatus === 'Reserved' ? 'bg-yellow-100 text-yellow-700' :
               'bg-gray-100 text-gray-700'}`}>
              {ticketStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketCard;
