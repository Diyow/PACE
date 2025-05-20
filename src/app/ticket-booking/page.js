'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useRouter and useSearchParams

const TicketBookingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sample event data (replace with your actual data)
  const event = {
    name: 'Summer Music Festival 2025',
    date: 'July 15-17, 2025',
    location: 'Central Park Arena',
    description:
      'Join us for three days of incredible music featuring top artists from around the world. Experience amazing performances, food vendors and interactive art installations.',
    highlights: ['50+ Live Performances', 'Food & Beverage Included', 'VIP Access Available'],
    bannerImage: 'URL_TO_YOUR_BANNER_IMAGE', // Replace with your image URL
    ticketPrice: 10, // Updated ticket price to $10
  };

  const [promotionalCode, setPromotionalCode] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [fees, setFees] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedSeatsFromQuery, setSelectedSeatsFromQuery] = useState([]);

  // Fee per ticket
  const feePerTicket = 2.00;

  useEffect(() => {
    const seatsParam = searchParams.get('selectedSeats');
    if (seatsParam) {
      try {
        const parsedSeats = JSON.parse(seatsParam);
        setSelectedSeatsFromQuery(parsedSeats);
        // Calculate subtotal based on the number of selected seats
        setSubtotal(parsedSeats.length * event.ticketPrice);
        // Calculate fees: $2 per ticket
        const calculatedFees = parsedSeats.length * feePerTicket;
        setFees(calculatedFees);
        // Calculate total
        setTotal(parsedSeats.length * event.ticketPrice + calculatedFees);
      } catch (error) {
        console.error('Error parsing selected seats:', error);
        // Handle potential parsing errors
      }
    } else {
      // Reset subtotal, fees, and total if no seats are selected
      setSubtotal(0);
      setFees(0);
      setTotal(0);
      setSelectedSeatsFromQuery([]);
    }
  }, [searchParams, event.ticketPrice, feePerTicket]);

  const handlePromotionalCodeChange = (event) => {
    setPromotionalCode(event.target.value);
    // In a real application, you would validate the code here
  };

  const handleSelectSeat = () => {
    router.push(`/seat-selection?ticketPrice=${event.ticketPrice}`);
  };

  const handleBookNow = () => {
    // Booking logic would go here
    console.log('Booking initiated with:', { promotionalCode, total, selectedSeats: selectedSeatsFromQuery });
    router.push(`/payment?selectedSeats=${JSON.stringify(selectedSeatsFromQuery)}&total=${total.toFixed(2)}`); // Navigate to payment page with data
  };

  return (
    <div className="flex max-w-6xl mx-auto p-4 gap-8 bg-gray-100 rounded-md">
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
        <button className="bg-black text-white py-3 rounded-md cursor-pointer text-lg font-semibold hover:bg-gray-700" onClick={handleSelectSeat}>
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
        <button className="bg-blue-500 text-white py-3 rounded-md cursor-pointer text-lg font-semibold mt-4 hover:bg-blue-700" onClick={handleBookNow}>
          Book Now
        </button>
      </div>
    </div>
  );
};

export default TicketBookingPage;
