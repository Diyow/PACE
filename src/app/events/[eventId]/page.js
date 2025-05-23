// src/app/events/[eventId]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon, // Keep for consistency
  ShoppingCartIcon,
  ArrowLeftIcon,
  PhotoIcon,
  InformationCircleIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const EventDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.eventId;

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSeatsSummary, setSelectedSeatsSummary] = useState(null);
  const [totalPriceFromSeats, setTotalPriceFromSeats] = useState(0);

  // const PROCESSING_FEE_PER_TICKET = 2.00; // Example processing fee

  const fetchEventDetails = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (!eventRes.ok) {
        if (eventRes.status === 404) throw new Error('Event not found.');
        const errorData = await eventRes.json();
        throw new Error(errorData.error || 'Failed to fetch event details.');
      }
      const eventData = await eventRes.json();
      setEvent(eventData);

      if (eventData.ticketCategories && eventData.ticketCategories.length > 0) {
        setTicketTypes(eventData.ticketCategories.map((tt, index) => ({
            ...tt,
            id: tt._id || `tt-${index}`
        })));
      } else {
        setTicketTypes([]);
      }

    } catch (err) {
      console.error("Error fetching event details:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  useEffect(() => {
    const seatsDataString = searchParams.get('selectedSeatsData');
    const totalCostString = searchParams.get('totalCost');

    if (seatsDataString) {
      try {
        const parsedSeatsData = JSON.parse(decodeURIComponent(seatsDataString));
        setSelectedSeatsSummary(parsedSeatsData);
      } catch (e) {
        console.error("Error parsing selectedSeatsData from URL:", e);
        toast.error("Could not retrieve selected seat information.");
        setSelectedSeatsSummary(null);
      }
    }
    if (totalCostString) {
        setTotalPriceFromSeats(parseFloat(totalCostString));
    }
  }, [searchParams]);


  const handleSelectSeats = () => {
    if (!event) return;
    const representativePrice = ticketTypes[0]?.price || 0;
    router.push(`/seat-selection?eventId=${event._id}&eventName=${encodeURIComponent(event.name)}&pricePerSeat=${representativePrice}`);
  };

  const handleProceedToPayment = () => {
    if (!selectedSeatsSummary || totalPriceFromSeats === 0) {
      toast.error('No seats selected or total is zero.');
      return;
    }
    const paymentDetails = {
        eventId: event._id,
        eventName: event.name,
        selectedSeats: selectedSeatsSummary,
        totalAmount: totalPriceFromSeats,
    };
    localStorage.setItem('paymentDetails', JSON.stringify(paymentDetails));
    router.push(`/payment?total=${totalPriceFromSeats.toFixed(2)}&eventId=${event._id}`);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500"></div>
        <p className="ml-4 text-sky-700 text-xl">Loading Event Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
        <InformationCircleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold text-red-700 mb-2">Error Loading Event</h2>
        <p className="text-red-600 text-center mb-6">{error}</p>
        <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center"
        >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Homepage
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p className="text-xl text-gray-700">Event not found.</p>
      </div>
    );
  }

  const eventDate = event.date ? new Date(`${event.date}T${event.time || '00:00:00'}`) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center text-sky-600 hover:text-sky-700 transition-colors group"
        >
            <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Event Details */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl shadow-xl overflow-hidden">
            <h1 className="text-3xl sm:text-4xl font-bold text-sky-800 mb-3">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sky-700 mb-6">
              {eventDate && (
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 opacity-80" />
                  <span>{eventDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
              {eventDate && event.time && (
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 opacity-80" />
                  <span>{eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              {/* Static Location Added */}
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 opacity-80" />
                <span>Help Auditorium</span>
              </div>
            </div>

            {event.posterUrl ? (
              <img
                src={event.posterUrl}
                alt={`${event.name} Poster`}
                className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-lg mb-6 shadow-lg"
              />
            ) : (
              <div className="w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-sky-200 to-blue-200 rounded-lg mb-6 flex items-center justify-center shadow-lg">
                <PhotoIcon className="h-24 w-24 text-sky-500 opacity-70" />
              </div>
            )}

            <h2 className="text-2xl font-semibold text-sky-700 mb-3 mt-8 border-b border-sky-200 pb-2">About this Event</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description || 'No description available.'}</p>
            
            {/* Organizer Info (Placeholder - can be dynamic if data is available) */}
            <div className="mt-8 pt-6 border-t border-sky-200">
                <h3 className="text-xl font-semibold text-sky-700 mb-3">Organized by</h3>
                <p className="text-gray-600">{event.organizer?.name || 'PACE Events Platform'}</p> {/* Assuming event might have organizer info */}
            </div>
          </div>

          {/* Right Column: Seat Selection / Summary & Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white p-6 sm:p-8 rounded-xl shadow-xl">
              {!selectedSeatsSummary ? (
                <>
                  <h2 className="text-2xl font-bold text-sky-800 mb-6 border-b border-sky-200 pb-3">Book Your Spot</h2>
                  {ticketTypes.length > 0 ? (
                     ticketTypes.map(tt => (
                        <div key={tt.id || tt._id} className="mb-3 p-3 border border-sky-100 rounded-lg bg-sky-50/50">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-sky-700">{tt.category}</h3>
                                <p className="font-bold text-sky-600">${parseFloat(tt.price).toFixed(2)}</p>
                            </div>
                             <p className="text-xs text-gray-500 mt-1">Per person</p>
                        </div>
                    ))
                  ) : (
                     <p className="text-gray-500 mb-4">Ticket information will be available soon.</p>
                  )}
                  <button
                    onClick={handleSelectSeats}
                    disabled={isLoading || ticketTypes.length === 0}
                    className="w-full bg-sky-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <TicketIcon className="h-5 w-5 mr-2" />
                    Select Seats
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-sky-800 mb-4 border-b border-sky-200 pb-3">Your Selection</h2>
                  <div className="mb-4 space-y-1">
                    <p className="text-sm text-gray-600">Selected Seats:</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedSeatsSummary.map((seat, index) => (
                             <span key={index} className="bg-sky-100 text-sky-800 px-2 py-1 rounded-md text-xs">
                                {seat.section} - {seat.row}{seat.seat} ({seat.category || 'Standard'})
                             </span>
                        ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-sky-800 pt-3 border-t border-sky-200 mb-6">
                    <span>Total Price:</span>
                    <span>${totalPriceFromSeats.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleProceedToPayment}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 ease-in-out flex items-center justify-center"
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Proceed to Payment
                  </button>
                   <button
                    onClick={handleSelectSeats}
                    className="mt-3 w-full bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-all duration-150 ease-in-out flex items-center justify-center"
                  >
                    Change Seats
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;