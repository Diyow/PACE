'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'
import { 
  ChevronRightIcon, 
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Footer() {
  const [trendingEvent, setTrendingEvent] = useState({
    name: 'Summer Music Festival',
    category: 'Music',
    ticketsLeft: 0
  });

  // Simulate trending event updates
  useEffect(() => {
    const events = [
      { name: 'Summer Music Festival', category: 'Music', ticketsLeft: 0 },
      { name: 'Tech Conference 2024', category: 'Technology', ticketsLeft: 15 },
      { name: 'Food & Wine Expo', category: 'Food', ticketsLeft: 30 },
      { name: 'Sports Championship', category: 'Sports', ticketsLeft: 5 }
    ];

    const interval = setInterval(() => {
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setTrendingEvent(randomEvent);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 text-gray-700 dark:text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-gray-900 dark:text-white text-xl font-semibold">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: 'Events', href: '/#events' },
                { name: 'My Tickets', href: '/#my-tickets' },
                { name: 'Waitlist', href: '/#waitlist' },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="group flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  >
                    <ChevronRightIcon className="h-4 w-4 mr-2 text-sky-500 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trending Event */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-white text-xl font-semibold">Trending Now</h3>
              <div className="flex items-center text-sky-500 text-sm">
                <SparklesIcon className="h-4 w-4 mr-1" />
                <span>Hot Event</span>
              </div>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {trendingEvent.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {trendingEvent.category}
                  </p>
                </div>
                <FireIcon className="h-6 w-6 text-orange-500" />
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {trendingEvent.ticketsLeft === 0 ? 'Sold Out' : `${trendingEvent.ticketsLeft} tickets left`}
                  </span>
                  <Link 
                    href={`/events/${trendingEvent.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trending events are updated every 30 seconds based on user interest and ticket sales.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800/50">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} PACE. All rights reserved.
            </p>
            <div className="flex space-x-8 mt-4 md:mt-0">
              <Link 
                href="/privacy" 
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 