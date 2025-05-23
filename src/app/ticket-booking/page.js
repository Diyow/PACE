'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const TicketBookingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const event = {
    name: 'Summer Music Festival 2025',
    date: 'July 15-17, 2025',
    location: 'Central Park Arena',
    description:
      'Join us for three days of incredible music featuring top artists from around the world. Experience amazing performances, food vendors and interactive art installations.',
    highlights: ['50+ Live Performances', 'Food & Beverage Included', 'VIP Access Available'],
    bannerImage: 'URL_TO_YOUR_BANNER_IMAGE',
    ticketPrice: 10,
    isSoldOut: true,
  };

  const [promotionalCode, setPromotionalCode] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [fees, setFees] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedSeatsFromQuery, setSelectedSeatsFromQuery] = useState([]);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [contactDetails, setContactDetails] = useState({ email: '' });
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [notification, setNotification] = useState(null); // State for custom notification

  const feePerTicket = 2.00;

  useEffect(() => {
    const seatsParam = searchParams.get('selectedSeats');
    if (seatsParam) {
      try {
        const parsedSeats = JSON.parse(seatsParam);
        setSelectedSeatsFromQuery(parsedSeats);
        setSubtotal(parsedSeats.length * event.ticketPrice);
        const calculatedFees = parsedSeats.length * feePerTicket;
        setFees(calculatedFees);
        setTotal(parsedSeats.length * event.ticketPrice + calculatedFees);
      } catch (error) {
        console.error('Error parsing selected seats:', error);
      }
    } else {
      setSubtotal(0);
      setFees(0);
      setTotal(0);
      setSelectedSeatsFromQuery([]);
    }
  }, [searchParams, event.ticketPrice, feePerTicket]);

  const handlePromotionalCodeChange = (event) => {
    setPromotionalCode(event.target.value);
  };

  const handleSelectSeat = () => {
    router.push(`/seat-selection?ticketPrice=${event.ticketPrice}`);
  };

  const handleBookNow = () => {
    console.log('Booking initiated with:', { promotionalCode, total, selectedSeats: selectedSeatsFromQuery });
    router.push(`/payment?selectedSeats=${JSON.stringify(selectedSeatsFromQuery)}&total=${total.toFixed(2)}`);
  };

  const handleContactDetailChange = (type, value) => {
    setContactDetails(prev => ({ ...prev, [type]: value }));
  };

  const handleJoinWaitlistClick = () => {
    setShowWaitlistModal(true);
  };

  const handleJoinWaitlistSubmit = () => {
    console.log('User joined waitlist with email:', contactDetails.email, 'for event:', event.name);
    setOnWaitlist(true);
    setShowWaitlistModal(false);
    setNotification('You have successfully joined the waitlist. We will contact you if tickets become available.');
    setTimeout(() => setNotification(null), 3000); // Clear notification after 3 seconds
    // In a real application, send contactDetails.email and event.id to your backend
  };

  const handleLeaveWaitlist = () => {
    console.log('User wants to leave the waitlist for event:', event.name);
    setOnWaitlist(false);
    setNotification('You have left the waitlist.');
    setTimeout(() => setNotification(null), 3000); // Clear notification after 3 seconds
    // In a real scenario, send a request to your backend to remove the user
  };

  const handleCloseWaitlistModal = () => {
    setShowWaitlistModal(false);
  };

  return (
    <div className="relative flex max-w-6xl mx-auto p-4 gap-8 bg-gray-100 rounded-md">
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white py-2 px-4 rounded-md shadow-md z-50">
          {notification}
        </div>
      )}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96 z-50">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Join Waitlist</h2>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
              placeholder="Enter your email"
              value={contactDetails.email}
              onChange={(e) => handleContactDetailChange('email', e.target.value)}
            />
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                onClick={handleCloseWaitlistModal}
              >
                Cancel
              </button>
              <button
                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                onClick={handleJoinWaitlistSubmit}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-grow p-6 bg-white rounded-md border border-gray-200">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">{event.name}</h1>
        <p className="text-gray-600 mb-6">
          🗓️ {event.date} 📍 {event.location}
        </p>
        <div className="bg-gray-300 h-48 rounded-md mb-6 flex justify-center items-center text-gray-500 text-xl">
          {event.bannerImage ? (
            <img src={event.bannerImage} alt="Event Banner" className="w-full h-full object-cover rounded-md" />
          ) : (
            'Event Banner Image'
          )}
        </div>
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Event Description</h2>
          <p className="text-gray-700 leading-relaxed mb-6">{event.description}</p>
          <ul className="list-none">
            {event.highlights.map((highlight, index) => (
              <li key={index} className="mb-2">
                <span className="mr-2 text-green-600">✔️</span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-full md:w-1/3 p-6 bg-white rounded-md border border-gray-200 flex flex-col gap-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Book Ticket</h2>
        </div>
        {event.isSoldOut ? (
          <div className="flex flex-col gap-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Sold Out!</strong>
              <span className="block sm:inline"> Tickets for this event are currently sold out.</span>
            </div>
            {!onWaitlist ? (
              <button
                className="bg-blue-500 text-white py-3 rounded-md cursor-pointer text-lg font-semibold hover:bg-blue-700"
                onClick={handleJoinWaitlistClick}
              >
                Join Waitlist
              </button>
            ) : (
              <button
                className="bg-gray-400 text-white py-3 rounded-md cursor-pointer text-lg font-semibold hover:bg-gray-500"
                onClick={handleLeaveWaitlist}
              >
                Leave Waitlist
              </button>
            )}
          </div>
        ) : (
          <>
            <button
              className="bg-black text-white py-3 rounded-md cursor-pointer text-lg font-semibold hover:bg-gray-700"
              onClick={handleSelectSeat}
            >
              Select Seat
            </button>
            {selectedSeatsFromQuery.length > 0 && (
              <div className="mt-4 p-2 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-800">
                Selected Seats: {selectedSeatsFromQuery.map(seat => `${seat.row}${seat.seat}`).join(', ')}
              </div>
            )}
            <div className="flex flex-col">
              <label htmlFor="promoCode" className="text-sm font-medium text-gray-700 mb-2">
                Promotional Code
              </label>
              <input
                type="text"
                id="promoCode"
                value={promotionalCode}
                onChange={handlePromotionalCodeChange}
                placeholder="Enter Code"
                className="p-2 rounded-md border border-gray-300"
              />
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-700">Subtotal</span>
              <span className="text-gray-800">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-700">Fees</span>
              <span className="text-gray-800">${fees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg border-t border-gray-300">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              className="bg-blue-500 text-white py-3 rounded-md cursor-pointer text-lg font-semibold mt-4 hover:bg-blue-700"
              onClick={handleBookNow}
            >
              Book Now
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketBookingPage;