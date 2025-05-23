// src/app/payment/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast'; // For UI notifications

const PaymentPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const totalFromQuery = parseFloat(searchParams.get('total')) || 0;
  // const eventIdFromQuery = searchParams.get('eventId'); // Keep if needed for booking

  const [paymentDetails, setPaymentDetails] = useState(null); // From localStorage
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState('credit-card'); // Default or from user selection
  // Dummy state for card details if you want to show the form
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const storedDetailsString = localStorage.getItem('paymentDetails');
    if (storedDetailsString) {
      try {
        const parsedDetails = JSON.parse(storedDetailsString);
        setPaymentDetails(parsedDetails);
        setSelectedSeats(parsedDetails.selectedSeats || []);
        setTotalAmount(parsedDetails.totalAmount || totalFromQuery);
      } catch (error) {
        console.error('Error parsing paymentDetails from localStorage:', error);
        toast.error("Could not retrieve booking details. Please try again.");
        setTotalAmount(totalFromQuery);
      }
    } else {
       toast.warn("No booking details found. Please start from the event page.");
       setTotalAmount(totalFromQuery);
    }
  }, [totalFromQuery]);

  const handlePayNow = async () => {
    if (!paymentDetails || selectedSeats.length === 0) {
        toast.error("Booking details are missing or no seats selected.");
        return;
    }

    // Basic validation for dummy fields if you're showing them
    if (paymentMethod === 'credit-card') {
        if (!cardHolderName || !cardNumber || !expiryDate || !cvv) {
            toast.error("Please fill in all dummy card details to simulate.");
            return;
        }
    } else if (paymentMethod === 'e-wallet') {
        // Add any dummy e-wallet fields if you have them
        const ewalletId = document.getElementById('ewalletId')?.value;
        if (!ewalletId) {
            toast.error("Please enter a dummy e-wallet ID.");
            return;
        }
    }


    setIsProcessing(true);
    toast.loading("Simulating payment processing...");

    // Simulate network delay for payment processing
    await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5-second delay

    try {
        // **A. Create Booking in your System**
        // The paymentDetails from localStorage should have everything needed.
        // Your /api/bookings endpoint will handle creating the booking and individual tickets.
        const bookingPayload = {
            eventId: paymentDetails.eventId,
            // ticketTypeIds, quantities are derived by your backend from selectedSeats
            // Your API should iterate over `paymentDetails.selectedSeats` to create tickets
            // and determine ticketTypeIds.
            // The structure passed to /api/bookings should match what it expects.
            // Based on your API, it expects eventId, ticketTypeIds, and quantities.
            // We need to map selectedSeats to this.
            // For now, assuming selectedSeats contains enough info to create tickets on backend
            ticketDetails: paymentDetails.selectedSeats.map(seat => ({
                ticketTypeId: seat.ticketTypeId || null, // You'll need to ensure ticketTypeId is passed from seat selection or derived
                category: seat.category,
                price: seat.price,
                quantity: 1, // Each seat is one ticket
                seatInfo: `${seat.section}-${seat.row}${seat.seat}` // Example seat identifier
            })),
            totalAmount: paymentDetails.totalAmount,
            paymentStatus: 'completed', // Mark as completed for this simulation
            // Add attendeeId if the user is logged in (from session)
        };
        
        // If your /api/bookings POST expects `ticketTypeIds` and `quantities` arrays directly:
        // You would need to aggregate from `paymentDetails.selectedSeats` if multiple seats of same type exist
        // or ensure `selectedSeats` already contains distinct `ticketTypeId` for each seat
        // For this simulation, let's assume your current /api/bookings POST is flexible or you adjust it.
        // A simplified payload for /api/bookings might directly use selectedSeats to generate tickets.

        const bookingResponse = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if your API requires authentication
            },
            body: JSON.stringify({
                eventId: paymentDetails.eventId,
                // This part needs careful mapping to what /api/bookings expects.
                // Let's assume each selected seat becomes one ticket of its category.
                // Your backend `/api/bookings` needs to be robust enough to handle this.
                // It might be simpler if `/api/bookings` can take a list of { ticketTypeId, quantity }
                // For now, we'll pass a structure that the backend can iterate over.
                // This is a placeholder, you'll need to ensure this matches your API:
                ticketTypeIds: paymentDetails.selectedSeats.map(s => s.ticketTypeId || s.category), // Fallback to category if no ID
                quantities: paymentDetails.selectedSeats.map(() => 1),
                // You might also pass the full selectedSeats array for detailed ticket creation
                _detailedSelectedSeats: paymentDetails.selectedSeats, // For backend to use
                totalAmount: paymentDetails.totalAmount, // Ensure this is passed
                paymentStatusOverride: 'completed' // Signal to backend this is a completed payment
            }),
        });

        if (!bookingResponse.ok) {
            const errorData = await bookingResponse.json();
            console.error("Booking API Error Data:", errorData);
            throw new Error(errorData.error || "Booking creation failed after simulated payment.");
        }
        const bookingResult = await bookingResponse.json(); // Contains bookingId, etc.

        // **B. Send Confirmation Email/Notification (Simulated)**
        // In a real app, your backend would send an email after successful booking.
        // For this project, a console log or a more prominent UI notification is fine.
        console.log("Simulated Email Sent: Booking Confirmation for", paymentDetails.eventName);
        console.log("Booking ID:", bookingResult.bookingId);
        console.log("Ticket Details:", paymentDetails.selectedSeats);
        console.log("Total Paid:", paymentDetails.totalAmount);

        // Update seat statuses (this should ideally be part of the booking API transaction)
        // For each selected seat, call PUT /api/seats/[seatId] to set status to 'occupied'
        // This is a simplified client-side loop; in production, the backend handles this.
        for (const seat of paymentDetails.selectedSeats) {
            // You need a way to get the actual MongoDB _id for each seat to update it.
            // If your `selectedSeats` objects don't have the `_id` of the seat document,
            // this step is harder from the client. It's better if the booking API handles this.
            // For now, we'll skip direct seat status update from client here, assuming booking API marks them.
            console.log(`Simulating: Mark seat ${seat.section}-${seat.row}${seat.seat} as occupied.`);
        }


        toast.dismiss(); // Dismiss loading toast
        toast.success(`Payment Successful! Booking ID: ${bookingResult.bookingId}. Check console for details.`);

        // **C. Clear localStorage and Redirect**
        localStorage.removeItem('paymentDetails');
        setTimeout(() => {
            router.push('/'); // Redirect to homepage as per requirement
        }, 3000); // Delay redirect slightly to allow user to see success toast

    } catch (error) {
        toast.dismiss();
        toast.error(`An error occurred: ${error.message}`);
        console.error("Simulated Payment/Booking error:", error);
    } finally {
        setIsProcessing(false);
    }
  };

  const renderSelectedSeatsSummary = () => {
    if (!selectedSeats || selectedSeats.length === 0) {
      return <p className="text-sm text-gray-500">No seats selected.</p>;
    }
    return (
      <ul className="list-disc list-inside pl-1 text-sm text-gray-700">
        {selectedSeats.map((seat, index) => (
          <li key={index}>
            Seat: {seat.section} {seat.row}{seat.seat} ({seat.category || 'Standard'}) - ${parseFloat(seat.price).toFixed(2)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="font-sans max-w-lg mx-auto mt-10 mb-20 p-4 sm:p-6 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl shadow-2xl">
      <main className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-sky-800 border-b pb-2">Order Summary</h2>
          {paymentDetails?.eventName && (
            <p className="text-md font-semibold text-gray-700 mb-1">Event: {paymentDetails.eventName}</p>
          )}
          <div className="mb-3">
            {renderSelectedSeatsSummary()}
          </div>
          <hr className="border-gray-200 my-3" />
          <p className="font-bold mt-3 text-xl text-sky-700">
            Total Amount <span className="float-right text-black">${totalAmount.toFixed(2)}</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-sky-800 border-b pb-2">Select Payment Method</h2>
          <div className="space-y-3">
            <div className={`border rounded-md p-3 hover:border-sky-400 transition-colors ${paymentMethod === 'credit-card' ? 'border-sky-500 bg-sky-50' : 'border-gray-300'}`}>
              <label className="flex items-center cursor-pointer">
                <input type="radio" value="credit-card" name="paymentMethod" checked={paymentMethod === 'credit-card'} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-2 h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500"/>
                Credit / Debit Card
              </label>
            </div>
            <div className={`border rounded-md p-3 hover:border-sky-400 transition-colors ${paymentMethod === 'e-wallet' ? 'border-sky-500 bg-sky-50' : 'border-gray-300'}`}>
              <label className="flex items-center cursor-pointer">
                <input type="radio" value="e-wallet" name="paymentMethod" checked={paymentMethod === 'e-wallet'} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-2 h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500"/>
                E-Wallet (Simulated)
              </label>
            </div>
            {/* Add other simulated methods if needed */}
          </div>
        </div>

        {paymentMethod === 'credit-card' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold mb-2 text-sky-700">Dummy Card Details</h2>
            <div>
              <label htmlFor="cardHolderName" className="block text-sm font-medium text-gray-700 mb-1">Card Holder Name</label>
              <input type="text" id="cardHolderName" placeholder="John Doe" value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input type="text" id="cardNumber" placeholder="•••• •••• •••• ••••" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="input-field" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="text" id="expiryDate" placeholder="MM/YY" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="input-field" />
              </div>
              <div className="flex-1">
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input type="text" id="cvv" placeholder="•••" value={cvv} onChange={(e) => setCvv(e.target.value)} className="input-field" />
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'e-wallet' && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
                <h2 className="text-xl font-semibold mb-2 text-sky-700">Dummy E-Wallet Details</h2>
                <div>
                    <label htmlFor="ewalletId" className="block text-sm font-medium text-gray-700 mb-1">E-Wallet ID / Phone Number</label>
                    <input type="text" id="ewalletId" placeholder="e.g., 08123456789 or user@example.com" className="input-field" />
                </div>
            </div>
        )}


        <button
          className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-lg font-bold text-lg shadow-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-60 ${isProcessing ? 'cursor-wait animate-pulse' : ''}`}
          onClick={handlePayNow}
          disabled={isProcessing || totalAmount === 0 || !paymentDetails}
        >
          {isProcessing ? 'Processing Payment...' : `Confirm & Pay $${totalAmount.toFixed(2)}`}
        </button>
      </main>
      <style jsx>{`
        .input-field {
          display: block;
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #D1D5DB; /* gray-300 */
          border-radius: 0.375rem; /* rounded-md */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
          transition: border-color 0.2s;
          font-size: 0.875rem; /* text-sm */
        }
        .input-field:focus {
          outline: none;
          border-color: #0EA5E9; /* sky-500 */
          box-shadow: 0 0 0 2px #BAE6FD; /* sky-200 for ring */
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;