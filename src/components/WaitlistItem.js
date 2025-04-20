// components/WaitlistItem.js
"use client";

import React from 'react';

function WaitlistItem({ item, onLeave }) {
 return (
  <li className="border-b py-2 flex items-center justify-between">
   <div>
    <h3 className="font-semibold text-sm">{item.name}</h3>
    <p className="text-xs text-gray-600">{item.date}</p>
   </div>
   <button
    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline text-xs"
    onClick={() => onLeave(item.id)}
   >
    Leave Waitlist
   </button>
  </li>
 );
}

export default WaitlistItem;
