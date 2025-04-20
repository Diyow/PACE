// components/EventsSection.js
import React from 'react';
import EventCard from './EventCard';

function EventsSection() {
 // Replace with your actual event data
 const events = [
  { id: 1, name: 'Event Name 1', date: '01 Jan, 2025', description: 'Description...' },
  { id: 2, name: 'Event Name 2', date: '01 Jan, 2025', description: 'Description...' },
  { id: 3, name: 'Event Name 3', date: '01 Jan, 2025', description: 'Description...' },
  { id: 4, name: 'Event Name 4', date: '01 Jan, 2025', description: 'Description...' },
  { id: 5, name: 'Event Name 5', date: '01 Jan, 2025', description: 'Description...' },
 ];

 return (
  <section>
   <h2>Events</h2>
   <div className="flex items-center mb-4">
    <input type="text" placeholder="Search Events..." className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
    <button className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Filters</button>
   </div>
   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    {events.map(event => (
     <EventCard key={event.id} event={event} />
    ))}
   </div>
  </section>
 );
}

export default EventsSection;