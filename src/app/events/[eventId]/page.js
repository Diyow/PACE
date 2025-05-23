// src/app/events/[eventId]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  ShoppingCartIcon,
  ArrowLeftIcon,
  PhotoIcon,
  InformationCircleIcon,
  TicketIcon as GetTicketsIcon, // Renamed to avoid conflict
  UsersIcon, 
  BuildingStorefrontIcon,
  TagIcon // For Promo Code
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

  // State for Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedDiscountInfo, setAppliedDiscountInfo] = useState(null); // { code, type, value, amount }
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);


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
    } else { // If returning to page without new seat data, clear previous selection
        setSelectedSeatsSummary(null);
    }

    if (totalCostString) {
        setTotalPriceFromSeats(parseFloat(totalCostString));
    } else {
        setTotalPriceFromSeats(0);
    }
    // Reset promo code if seat selection changes
    setPromoCodeInput('');
    setAppliedDiscountInfo(null);

  }, [searchParams]);


  const handleSelectSeats = () => {
    if (!event) return;
    const representativePrice = event.ticketCategories && event.ticketCategories.length > 0 
                                ? event.ticketCategories[0]?.price || 0 
                                : 0;
    router.push(`/seat-selection?eventId=${event._id}&eventName=${encodeURIComponent(event.name)}&pricePerSeat=${representativePrice}`);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) {
      toast.error('Please enter a promotional code.');
      return;
    }
    if (!event || !event._id) {
        toast.error('Event details not loaded yet.');
        return;
    }
    if (totalPriceFromSeats === 0) {
        toast.error('Please select seats before applying a promo code.');
        return;
    }

    setPromoCodeLoading(true);
    try {
        const response = await fetch(`/api/promo-codes?eventId=${event._id}&code=${promoCodeInput.trim().toUpperCase()}`);
        const data = await response.json();

        if (!response.ok) {
            setAppliedDiscountInfo(null);
            toast.error(data.error || 'Invalid or expired promotional code.');
        } else {
            let discountAmount = 0;
            if (data.discountType === 'percentage') {
                discountAmount = (totalPriceFromSeats * data.discountValue) / 100;
            } else if (data.discountType === 'fixed') {
                discountAmount = data.discountValue;
            }
            discountAmount = Math.min(discountAmount, totalPriceFromSeats); // Cannot discount more than subtotal

            setAppliedDiscountInfo({
                code: promoCodeInput.trim().toUpperCase(),
                type: data.discountType,
                value: data.discountValue,
                amount: discountAmount,
            });
            toast.success(`Promotional code "${promoCodeInput.trim().toUpperCase()}" applied!`);
        }
    } catch (err) {
        setAppliedDiscountInfo(null);
        toast.error('Failed to validate promotional code.');
        console.error("Promo code validation error:", err);
    } finally {
        setPromoCodeLoading(false);
    }
  };


  // Calculate final total including discount
  const finalTotal = appliedDiscountInfo 
    ? Math.max(0, totalPriceFromSeats - appliedDiscountInfo.amount) 
    : totalPriceFromSeats;

  const handleProceedToPayment = () => {
    if (!selectedSeatsSummary || totalPriceFromSeats === 0) { // Check original price from seats
      toast.error('No seats selected.');
      return;
    }
    const paymentDetails = {
        eventId: event._id,
        eventName: event.name,
        selectedSeats: selectedSeatsSummary,
        subtotal: totalPriceFromSeats, // Price from seats before discount
        discountApplied: appliedDiscountInfo ? { // Send discount details
            code: appliedDiscountInfo.code,
            amount: appliedDiscountInfo.amount
        } : null,
        totalAmount: finalTotal, // Final amount after discount
    };
    localStorage.setItem('paymentDetails', JSON.stringify(paymentDetails));
    // Pass the final total to the payment page
    router.push(`/payment?total=${finalTotal.toFixed(2)}&eventId=${event._id}`);
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sky-700 mb-6 text-sm">
              {eventDate && (
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-1.5 opacity-80" />
                  <span>{eventDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
              {eventDate && event.time && (
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-1.5 opacity-80" />
                  <span>{eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-1.5 opacity-80" />
                <span>Help Auditorium</span>
              </div>
            </div>

            {event.posterUrl ? (
              <img src={event.posterUrl} alt={`${event.name} Poster`} className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-lg mb-6 shadow-lg"/>
            ) : (
              <div className="w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-sky-200 to-blue-200 rounded-lg mb-6 flex items-center justify-center shadow-lg">
                <PhotoIcon className="h-24 w-24 text-sky-500 opacity-70" />
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
                    <p className="text-xs text-sky-600 font-medium uppercase tracking-wider">Tickets Available</p>
                    <p className="text-2xl font-bold text-sky-800">
                        {typeof event.ticketsAvailable === 'number' ? event.ticketsAvailable : 'N/A'}
                        {typeof event.totalCapacity === 'number' && event.totalCapacity > 0 && (
                            <span className="text-sm font-normal text-gray-500"> / {event.totalCapacity}</span>
                        )}
                    </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wider">Tickets Purchased</p>
                    <p className="text-2xl font-bold text-green-800">
                        {typeof event.ticketsPurchased === 'number' ? event.ticketsPurchased : 'N/A'}
                    </p>
                </div>
            </div>

            <h2 className="text-2xl font-semibold text-sky-700 mb-3 mt-8 border-b border-sky-200 pb-2">About this Event</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description || 'No description available.'}</p>
            
            <div className="mt-8 pt-6 border-t border-sky-200">
                <div className="flex items-center text-sky-700 mb-3">
                    <BuildingStorefrontIcon className="h-6 w-6 mr-2 opacity-80"/>
                    <h3 className="text-xl font-semibold">Organized by</h3>
                </div>
                <p className="text-gray-600">{event.organizerName || 'PACE Events Platform'}</p>
            </div>
          </div>

          {/* Right Column: Booking Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white p-6 sm:p-8 rounded-xl shadow-xl">
              {!selectedSeatsSummary ? (
                <>
                  <h2 className="text-2xl font-bold text-sky-800 mb-6 border-b border-sky-200 pb-3">Get Your Tickets</h2>
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
                    disabled={isLoading || ticketTypes.length === 0 || (typeof event.ticketsAvailable === 'number' && event.ticketsAvailable <= 0) }
                    className={`w-full font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-150 ease-in-out flex items-center justify-center
                                ${ (typeof event.ticketsAvailable === 'number' && event.ticketsAvailable <= 0) 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-sky-500 text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'}`}
                  >
                    <GetTicketsIcon className="h-5 w-5 mr-2" />
                    { (typeof event.ticketsAvailable === 'number' && event.ticketsAvailable <= 0) ? 'Sold Out' : 'Select Seats'}
                  </button>
                </>
              ) : ( // User has selected seats and returned
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
                  
                  {/* Promo Code Section - Only show if seats are selected */}
                  <div className="my-6 pt-4 border-t border-gray-200">
                    <label htmlFor="promoCode" className="block text-sm font-medium text-sky-700 mb-1">
                        <TagIcon className="h-5 w-5 inline mr-1 opacity-80"/>
                        Promotional Code
                    </label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            id="promoCode"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            placeholder="Enter code"
                            className="flex-grow appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
                            disabled={promoCodeLoading}
                        />
                        <button 
                            onClick={handleApplyPromoCode}
                            disabled={promoCodeLoading || !promoCodeInput.trim()}
                            className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition disabled:opacity-50"
                        >
                            {promoCodeLoading ? 'Applying...' : 'Apply'}
                        </button>
                    </div>
                    {appliedDiscountInfo && (
                        <p className="mt-2 text-xs text-green-600">
                            Code "{appliedDiscountInfo.code}" applied: -${appliedDiscountInfo.amount.toFixed(2)}
                        </p>
                    )}
                  </div>
                  
                  {/* Price Summary */}
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
                    {/* You can add fees here if applicable */}
                    {/* <div className="flex justify-between">
                        <span className="text-gray-600">Fees</span>
                        <span className="text-gray-800 font-medium">$2.00</span>
                    </div> */}
                    <div className="flex justify-between text-lg font-bold text-sky-800 pt-2 border-t border-sky-200">
                        <span>Total</span>
                        <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 ease-in-out flex items-center justify-center"
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Proceed to Payment
                  </button>
                   <button
                    onClick={handleSelectSeats} // Navigates back to seat selection
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