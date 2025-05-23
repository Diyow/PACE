// src/app/events/[eventId]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  CalendarDaysIcon, ClockIcon, MapPinIcon, ShoppingCartIcon, ArrowLeftIcon,
  PhotoIcon, InformationCircleIcon, TicketIcon as GetTicketsIcon,
  UsersIcon, BuildingStorefrontIcon, TagIcon, UserPlusIcon, UserMinusIcon,
  EnvelopeIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const EventDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const eventId = params.eventId;

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [isEventDataLoading, setIsEventDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSeatsSummary, setSelectedSeatsSummary] = useState(null);
  const [totalPriceFromSeats, setTotalPriceFromSeats] = useState(0);

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedDiscountInfo, setAppliedDiscountInfo] = useState(null);
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);

  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [isWaitlistLoading, setIsWaitlistLoading] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistName, setWaitlistName] = useState(''); // For the modal input
  const [waitlistIsFullMessage, setWaitlistIsFullMessage] = useState('');


  const fetchEventDetails = useCallback(async () => {
    if (!eventId) return;
    setIsEventDataLoading(true);
    setError(null);
    try {
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (!eventRes.ok) {
        if (eventRes.status === 404) throw new Error('Event not found.');
        const errorData = await eventRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch event details.');
      }
      const eventData = await eventRes.json();
      setEvent(eventData);
      if (eventData.ticketCategories && eventData.ticketCategories.length > 0) {
        setTicketTypes(eventData.ticketCategories.map((tt, index) => ({ ...tt, id: tt._id || `tt-${index}` })));
      } else {
        setTicketTypes([]);
      }
    } catch (err) {
      console.error("Error fetching event details:", err);
      setError(err.message);
      setEvent(null);
    } finally {
      setIsEventDataLoading(false);
    }
  }, [eventId]);

  const checkWaitlistStatus = useCallback(async () => {
    // This function checks if the *currently logged-in user* is on the waitlist.
    // It uses `checkStatus=true` to differentiate from an admin fetching the whole list.
    if (sessionStatus === 'authenticated' && session?.user?.id && eventId) {
      setIsWaitlistLoading(true);
      try {
        const res = await fetch(`/api/waitlist?eventId=${eventId}&checkStatus=true`); // Added checkStatus
        const data = await res.json();
        if (res.ok) {
            setIsOnWaitlist(data.isOnWaitlist || false);
        } else {
            if (res.status !== 404) { // 404 means not on waitlist, not an error to toast
                console.error("API error checking waitlist status:", data.error || "Unknown error");
                toast.error(data.error || "Could not check waitlist status.");
            }
            setIsOnWaitlist(false);
        }
      } catch (err) {
        console.error("Error checking waitlist status:", err);
        toast.error("Failed to check waitlist status.");
        setIsOnWaitlist(false);
      } finally {
        setIsWaitlistLoading(false);
      }
    } else {
      setIsOnWaitlist(false); // Not authenticated or no eventId, so not on waitlist by session
    }
  }, [eventId, session, sessionStatus]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  useEffect(() => {
    if (eventId && sessionStatus !== 'loading') { // Ensure session status is resolved
        checkWaitlistStatus();
    }
  }, [eventId, sessionStatus, checkWaitlistStatus]); // Rerun if sessionStatus changes

  useEffect(() => {
    const seatsDataString = searchParams.get('selectedSeatsData');
    if (seatsDataString) {
      try { 
        const parsedSeats = JSON.parse(decodeURIComponent(seatsDataString));
        setSelectedSeatsSummary(parsedSeats); 
        const newTotalFromSeats = parsedSeats.reduce((sum, seat) => sum + (parseFloat(seat.price) || 0), 0);
        setTotalPriceFromSeats(newTotalFromSeats);
      } 
      catch (e) { 
        console.error("Error parsing selectedSeatsData from URL:", e);
        setSelectedSeatsSummary(null); 
        setTotalPriceFromSeats(0);
      }
    } else { 
      setSelectedSeatsSummary(null); 
      setTotalPriceFromSeats(0);
    }
    setPromoCodeInput('');
    setAppliedDiscountInfo(null);
  }, [searchParams]);

  const handleSelectSeats = () => { /* ... same ... */ };
  const handleApplyPromoCode = async () => { /* ... same ... */ };
  const finalTotal = appliedDiscountInfo ? Math.max(0, totalPriceFromSeats - appliedDiscountInfo.amount) : totalPriceFromSeats;
  const handleProceedToPayment = () => { /* ... same ... */ };

  const openWaitlistModal = () => {
    // Pre-fill with session data if available, otherwise fields will be empty
    setWaitlistEmail(session?.user?.email || '');
    setWaitlistName(session?.user?.name || '');
    setShowWaitlistModal(true);
    setWaitlistIsFullMessage(''); 
  };

  const handleJoinWaitlistSubmit = async () => {
    if (!waitlistEmail.trim() || !/\S+@\S+\.\S+/.test(waitlistEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!eventId) return;

    setIsWaitlistLoading(true);
    setWaitlistIsFullMessage('');
    try {
      const payload = { 
        eventId, 
        email: waitlistEmail, 
        name: waitlistName.trim() || undefined // Send name only if provided
      };
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) { // Waitlist full or already on waitlist (API might return 409 for full, 400 for already on)
            setWaitlistIsFullMessage(data.error || "The waitlist is currently full or you are already on it.");
            toast.error(data.error || "Could not join waitlist.");
        } else {
            throw new Error(data.error || "Failed to join waitlist.");
        }
      } else {
        toast.success(data.message || "Successfully joined the waitlist!");
        setIsOnWaitlist(true); // Assume success means user is now on waitlist
        setShowWaitlistModal(false);
        setWaitlistEmail('');
        setWaitlistName('');
      }
    } catch (err) {
      toast.error(err.message);
      console.error("Error joining waitlist:", err);
    } finally {
      setIsWaitlistLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (sessionStatus !== 'authenticated' || !eventId) {
        toast.error("You must be logged in to leave a waitlist.");
        // Optionally, if you stored a token for unauthenticated waitlist entries,
        // you'd need a different mechanism to leave.
        return;
    }
    setIsWaitlistLoading(true);
    try {
      // The DELETE API uses session to identify the user, so no attendeeId needed in query for self-removal
      const response = await fetch(`/api/waitlist?eventId=${eventId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to leave waitlist.");
      toast.success(data.message || "Successfully left the waitlist.");
      setIsOnWaitlist(false);
    } catch (err) {
      toast.error(err.message);
      console.error("Error leaving waitlist:", err);
    } finally {
      setIsWaitlistLoading(false);
    }
  };

  if (isEventDataLoading || sessionStatus === 'loading') {
    return ( <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 p-4"> <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500"></div> <p className="ml-4 text-sky-700 text-xl">Loading Event Details...</p> </div> );
  }
  if (error) { return ( <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4"> <InformationCircleIcon className="h-16 w-16 text-red-500 mb-4" /> <h2 className="text-2xl font-semibold text-red-700 mb-2">Error Loading Event</h2> <p className="text-red-600 text-center mb-6">{error}</p> <button onClick={() => router.push('/')} className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center"> <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Homepage </button> </div> ); }
  if (!event) { return ( <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4"> <p className="text-xl text-gray-700">Event not found.</p> </div> );}

  const eventDate = event.date ? new Date(`${event.date}T${event.time || '00:00:00'}`) : null;
  const isSoldOut = typeof event.ticketsAvailable === 'number' && event.ticketsAvailable <= 0;
  // Use waitlistCapacity from the event data fetched from API
  const isWaitlistAtCapacity = event.currentWaitlistSize >= event.waitlistCapacity; 


  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
         <button onClick={() => router.back()} className="mb-6 inline-flex items-center text-sky-600 hover:text-sky-700 transition-colors group">
            <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" /> Back
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl shadow-xl overflow-hidden">
            {/* Event Info (same as before) */}
            <h1 className="text-3xl sm:text-4xl font-bold text-sky-800 mb-3">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sky-700 mb-6 text-sm">
              {eventDate && ( <div className="flex items-center"> <CalendarDaysIcon className="h-5 w-5 mr-1.5 opacity-80" /> <span>{eventDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span> </div> )}
              {eventDate && event.time && ( <div className="flex items-center"> <ClockIcon className="h-5 w-5 mr-1.5 opacity-80" /> <span>{eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span> </div> )}
              <div className="flex items-center"> <MapPinIcon className="h-5 w-5 mr-1.5 opacity-80" /> <span>Help Auditorium</span> </div>
            </div>
            {event.posterUrl ? <img src={event.posterUrl} alt={`${event.name} Poster`} className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-lg mb-6 shadow-lg"/> : <div className="w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-sky-200 to-blue-200 rounded-lg mb-6 flex items-center justify-center shadow-lg"> <PhotoIcon className="h-24 w-24 text-sky-500 opacity-70" /> </div> }
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
                    <p className="text-xs text-sky-600 font-medium uppercase tracking-wider">Tickets Available</p>
                    <p className="text-2xl font-bold text-sky-800"> {typeof event.ticketsAvailable === 'number' ? event.ticketsAvailable : 'N/A'} {typeof event.totalCapacity === 'number' && event.totalCapacity > 0 && ( <span className="text-sm font-normal text-gray-500"> / {event.totalCapacity}</span> )} </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wider">Tickets Purchased/Taken</p>
                    <p className="text-2xl font-bold text-green-800"> {typeof event.ticketsPurchased === 'number' ? event.ticketsPurchased : 'N/A'} </p>
                </div>
            </div>
            <h2 className="text-2xl font-semibold text-sky-700 mb-3 mt-8 border-b border-sky-200 pb-2">About this Event</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description || 'No description available.'}</p>
            <div className="mt-8 pt-6 border-t border-sky-200">
                <div className="flex items-center text-sky-700 mb-3"> <BuildingStorefrontIcon className="h-6 w-6 mr-2 opacity-80"/> <h3 className="text-xl font-semibold">Organized by</h3> </div>
                <p className="text-gray-600">{event.organizerName || 'PACE Events Platform'}</p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white p-6 sm:p-8 rounded-xl shadow-xl">
              {!selectedSeatsSummary && !isSoldOut && (
                <> {/* Get Your Tickets UI */}
                    <h2 className="text-2xl font-bold text-sky-800 mb-6 border-b border-sky-200 pb-3">Get Your Tickets</h2>
                    {ticketTypes.length > 0 ? ( ticketTypes.map(tt => ( <div key={tt.id || tt._id} className="mb-3 p-3 border border-sky-100 rounded-lg bg-sky-50/50"> <div className="flex justify-between items-center"> <h3 className="font-semibold text-sky-700">{tt.category}</h3> <p className="font-bold text-sky-600">${parseFloat(tt.price).toFixed(2)}</p> </div> <p className="text-xs text-gray-500 mt-1">Per person</p> </div> )) ) : ( <p className="text-gray-500 mb-4">Ticket information loading...</p> )}
                    <button onClick={handleSelectSeats} disabled={isEventDataLoading || ticketTypes.length === 0 || isSoldOut }
                        className={`w-full font-semibold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center ${ isSoldOut ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-sky-500 text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'}`} >
                        <GetTicketsIcon className="h-5 w-5 mr-2" />
                        {isSoldOut ? 'Sold Out' : 'Select Seats'}
                    </button>
                </>
              )}

              {isSoldOut && !selectedSeatsSummary && (
                <> {/* Waitlist UI */}
                  <h2 className="text-2xl font-bold text-sky-800 mb-4 border-b border-sky-200 pb-3">Event Sold Out</h2>
                  {isWaitlistLoading && !showWaitlistModal ? ( // Show spinner only if not opening modal
                     <div className="flex justify-center items-center py-3"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div></div>
                  ) : isOnWaitlist ? (
                    <div className="text-center">
                      <p className="text-green-600 font-medium mb-3">You are on the waitlist!</p>
                      <button onClick={handleLeaveWaitlist} disabled={isWaitlistLoading} className="w-full font-semibold py-3 px-4 rounded-lg shadow-md flex items-center justify-center bg-red-500 text-white hover:bg-red-600 disabled:opacity-70">
                        <UserMinusIcon className="h-5 w-5 mr-2" /> {isWaitlistLoading ? 'Processing...' : 'Leave Waitlist'}
                      </button>
                    </div>
                  ) : isWaitlistAtCapacity ? ( // Check if waitlist capacity is reached
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-center">
                        <ExclamationTriangleIcon className="h-6 w-6 text-orange-500 mx-auto mb-2"/>
                        <p className="text-sm text-orange-700 font-medium">The waitlist for this event is currently full.</p>
                        <p className="text-xs text-orange-600 mt-1">Please check back later.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-4">Join the waitlist to be notified if tickets become available.</p>
                      <button onClick={openWaitlistModal} disabled={isWaitlistLoading} className="w-full font-semibold py-3 px-4 rounded-lg shadow-md flex items-center justify-center bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-70">
                        <UserPlusIcon className="h-5 w-5 mr-2" /> Join Waitlist
                      </button>
                    </>
                  )}
                  {waitlistIsFullMessage && !isOnWaitlist && !isWaitlistAtCapacity && ( // Show if API returned full message during join attempt
                     <p className="text-sm text-orange-600 mt-3 text-center">{waitlistIsFullMessage}</p>
                  )}
                </>
              )}

              {selectedSeatsSummary && ( /* Payment flow UI */ 
                 <>
                  <h2 className="text-2xl font-bold text-sky-800 mb-4 border-b border-sky-200 pb-3">Your Selection</h2>
                   <div className="mb-4 space-y-1"> <p className="text-sm text-gray-600">Selected Seats:</p> <div className="flex flex-wrap gap-2"> {selectedSeatsSummary.map((seat, index) => ( <span key={index} className="bg-sky-100 text-sky-800 px-2 py-1 rounded-md text-xs"> {seat.section} - {seat.row}{seat.seat} ({seat.category || 'Standard'}) </span> ))} </div> </div>
                   
                   <div className="my-6 pt-4 border-t border-gray-200">
                     <label htmlFor="promoCode" className="block text-sm font-medium text-sky-700 mb-1">
                       <TagIcon className="h-5 w-5 inline mr-1 opacity-80"/> Promotional Code
                     </label>
                     <div className="flex gap-2">
                       <input type="text" id="promoCode" value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value)} placeholder="Enter code" 
                              className="flex-grow appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors" 
                              disabled={promoCodeLoading} />
                       <button onClick={handleApplyPromoCode} disabled={promoCodeLoading || !promoCodeInput.trim()} 
                               className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition disabled:opacity-50" >
                         {promoCodeLoading ? 'Applying...' : 'Apply'}
                       </button>
                     </div>
                     {appliedDiscountInfo && (
                       <p className="mt-2 text-xs text-green-600">
                         Code "{appliedDiscountInfo.code}" applied: -${appliedDiscountInfo.amount.toFixed(2)}
                       </p>
                     )}
                   </div>

                   <div className="space-y-1 text-sm mb-6">
                     <div className="flex justify-between">
                       <span className="text-gray-600">Subtotal (Seats)</span>
                       <span className="text-gray-800 font-medium">${totalPriceFromSeats.toFixed(2)}</span>
                     </div>
                     {appliedDiscountInfo && (
                       <div className="flex justify-between text-green-600">
                         <span>Discount ({appliedDiscountInfo.code})</span>
                         <span>-${appliedDiscountInfo.amount.toFixed(2)}</span>
                       </div>
                     )}
                     <div className="flex justify-between text-lg font-bold text-sky-800 pt-2 border-t border-sky-200">
                       <span>Total</span>
                       <span>${finalTotal.toFixed(2)}</span>
                     </div>
                   </div>
                   <button onClick={handleProceedToPayment} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 ease-in-out flex items-center justify-center" >
                     <ShoppingCartIcon className="h-5 w-5 mr-2" /> Proceed to Payment
                   </button>
                   <button onClick={handleSelectSeats} className="mt-3 w-full bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-all duration-150 ease-in-out flex items-center justify-center" >
                     Change Seats
                   </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showWaitlistModal && ( 
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
            <h3 className="text-xl font-semibold text-sky-800 mb-4">Join Waitlist for {event?.name}</h3>
            <p className="text-sm text-gray-600 mb-6">Enter your contact details. We'll notify you if tickets become available.</p>
            <div className="mb-4">
              <label htmlFor="waitlistName" className="block text-sm font-medium text-gray-700 mb-1">Full Name (Optional)</label>
              <input type="text" id="waitlistName" value={waitlistName} onChange={(e) => setWaitlistName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Your Name" />
            </div>
            <div className="mb-6">
              <label htmlFor="waitlistEmail" className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="email" id="waitlistEmail" value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="you@example.com" required />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setShowWaitlistModal(false); setWaitlistEmail(''); setWaitlistName('');}}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isWaitlistLoading} > Cancel
              </button>
              <button onClick={handleJoinWaitlistSubmit} disabled={isWaitlistLoading || !waitlistEmail.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex items-center" >
                {isWaitlistLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white mr-2"></div>}
                {isWaitlistLoading ? 'Submitting...' : 'Submit to Waitlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
