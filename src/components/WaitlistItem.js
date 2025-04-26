// components/WaitlistItem.js
"use client";

import React from 'react';

function WaitlistItem({ item }) {
  const handleLeave = (e) => {
    e.preventDefault();
    // Implement leave waitlist logic
    console.log('Leaving waitlist for:', item.id);
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-sky-100 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm group-hover:text-sky-500 transition-colors">Poster</div>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 group-hover:text-sky-600 transition-colors">{item.eventName}</h3>
          <p className="text-sm text-gray-500">{item.date}</p>
        </div>
      </div>
      <button
        onClick={handleLeave}
        className="px-4 py-1.5 text-sm font-medium text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
      >
        Leave Waitlist
      </button>
    </div>
  );
}

export default WaitlistItem;
