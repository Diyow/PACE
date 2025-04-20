// components/WaitlistSection.js
"use client";

import React from 'react';
import WaitlistItem from './WaitlistItem';

function WaitlistSection() {
 // Replace with your actual waitlist data
 const waitlistItems = [
  { id: 1, name: 'Event Name 1', date: '01 Jan, 2025 - 00:00' },
  { id: 2, name: 'Event Name 2', date: '01 Jan, 2025 - 00:00' },
  { id: 3, name: 'Event Name 3', date: '01 Jan, 2025 - 00:00' },
 ];

 const handleLeaveWaitlist = (itemId) => {
  // Implement your logic to remove the item from the waitlist
  console.log(`Leaving waitlist for item: ${itemId}`);
 };

 return (
  <section className="mt-8">
   <h2>Waitlist</h2>
   <ul>
    {waitlistItems.map(item => (
     <WaitlistItem key={item.id} item={item} onLeave={handleLeaveWaitlist} />
    ))}
    {waitlistItems.length === 0 && <p className="text-gray-500">No items in your waitlist.</p>}
   </ul>
  </section>
 );
}

export default WaitlistSection;