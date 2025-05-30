import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PhotoIcon } from '@heroicons/react/24/outline';

function EventCard({ event }) {
  return (
    <Link href={`/events/${event.id}`} className="group block"> {/* Added block for better layout control of the Link */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02] group-hover:border-sky-100">
        <div className="aspect-[4/3] bg-gradient-to-br from-sky-50 to-blue-50 relative flex items-center justify-center overflow-hidden">
          {event.posterUrl ? (
            <Image 
              src={event.posterUrl} 
              alt={`${event.name || 'Event'} poster`} 
              fill // Makes the image fill the parent container
              style={{ objectFit: 'cover' }}
              className="transition-transform duration-300 group-hover:scale-105"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-sky-500 transition-colors">
              <PhotoIcon className="h-16 w-16 opacity-50" />
              <span className="mt-2 text-sm">Event Poster</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 group-hover:text-sky-600 transition-colors truncate" title={event.name}>{event.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{event.date}</p>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
        </div>
      </div>
    </Link>
  );
}

export default EventCard;
