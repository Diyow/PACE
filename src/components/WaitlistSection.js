// components/WaitlistSection.js
"use client";

import React from 'react';
import WaitlistItem from './WaitlistItem';

function WaitlistSection() {
  // Replace with your actual waitlist data
  const waitlistItems = [
    { id: 1, eventName: 'Event Name', date: '01 Jan, 2025 - 00:00' },
    { id: 2, eventName: 'Event Name', date: '01 Jan, 2025 - 00:00' },
    { id: 3, eventName: 'Event Name', date: '01 Jan, 2025 - 00:00' }
  ];

  return (
    <section className="py-12 bg-gradient-to-b from-sky-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Waitlist
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-600">
            {waitlistItems.length}
          </span>
        </h2>
        
        <div className="space-y-4">
          {waitlistItems.map(item => (
            <WaitlistItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default WaitlistSection;