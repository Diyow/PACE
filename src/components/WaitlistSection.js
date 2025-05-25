"use client";

import React, { useState, useEffect, useCallback } from 'react';
import WaitlistItem from './WaitlistItem';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';


function WaitlistSection() {
  const { data: session, status: sessionStatus } = useSession();
  const [actualWaitlistItems, setActualWaitlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWaitlistItems = useCallback(async () => {
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      setIsLoading(true);
      setError(null);
      try {
        // The GET /api/waitlist should return all entries for the logged-in user
        // when no eventId is specified and role is 'user'.
        const response = await fetch('/api/waitlist'); 
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch waitlist items.');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setActualWaitlistItems(data);
        } else {
          console.error("API did not return an array for waitlist items:", data);
          throw new Error("Received invalid data format for waitlist items.");
        }
      } catch (err) {
        console.error("Error fetching waitlist items:", err);
        setError(err.message);
        setActualWaitlistItems([]); // Clear items on error
      } finally {
        setIsLoading(false);
      }
    } else if (sessionStatus === 'unauthenticated') {
      setActualWaitlistItems([]); // Clear if logged out
    }
  }, [session, sessionStatus]);

  useEffect(() => {
    fetchWaitlistItems();
  }, [fetchWaitlistItems]);

  const handleLeaveWaitlistSuccess = (waitlistEntryId) => {
    setActualWaitlistItems(prevItems => prevItems.filter(item => item._id !== waitlistEntryId));
    toast.success("Successfully left the waitlist.");
  };


  if (sessionStatus === 'loading') {
    return (
      <section className="py-12 bg-gradient-to-b from-sky-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          Loading your waitlist...
        </div>
      </section>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <section className="py-12 bg-gradient-to-b from-sky-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <ClockIcon className="h-12 w-12 text-sky-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Waitlist</h3>
                <p className="text-gray-500 mb-4">
                  <Link href="/login" className="text-sky-600 hover:text-sky-700 font-medium underline">Log in</Link> to view and manage events you&apos;re waitlisted for.
                </p>
            </div>
        </div>
      </section>
    );
  }


  return (
    <section className="py-12 bg-gradient-to-b from-sky-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          My Waitlist
          {!isLoading && !error && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-600">
              {actualWaitlistItems.length}
            </span>
          )}
        </h2>
        
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            <p className="ml-3 text-gray-500">Fetching your waitlist...</p>
          </div>
        )}
        {error && !isLoading && (
           <div className="text-center py-10 text-red-600 bg-red-50 p-6 rounded-lg border border-red-200 flex flex-col items-center">
            <ExclamationCircleIcon className="h-8 w-8 mb-2"/>
            <p className="font-medium">Error loading your waitlist:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!isLoading && !error && actualWaitlistItems.length === 0 && (
            <div className="text-center py-12 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <ClockIcon className="h-12 w-12 text-sky-400 mx-auto mb-4" />
                <p className="text-lg text-gray-500">You are not currently on any waitlists.</p>
                <Link 
                    href="/#events" 
                    className="mt-4 inline-block px-6 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
                >
                    Explore Events
                </Link>
            </div>
        )}
        {!isLoading && !error && actualWaitlistItems.length > 0 && (
          <div className="space-y-4">
            {actualWaitlistItems.map(item => ( // item here is the full waitlist entry from API
              <WaitlistItem 
                key={item._id} 
                item={item} 
                onLeaveSuccess={() => handleLeaveWaitlistSuccess(item._id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default WaitlistSection;