// src/app/payment/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter
import { toast } from 'react-hot-toast'; // For notifications

const PaymentPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter(); // For navigation

  const totalFromQuery = parseFloat(searchParams.get('total')) || 0;
  const eventIdFromQuery = searchParams.get('eventId'); // Get eventId if needed

  const [paymentDetails, setPaymentDetails] = useState(null); // From localStorage
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0); // This will be the final amount

  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState(''); // Added CVV
  const [cardHolderName, setCardHolderName] = useState(''); // Added Card Holder Name

  const [isProcessing, setIsProcessing] = useState(false);


  useEffect(() => {
    const storedDetailsString = localStorage.getItem('paymentDetails');
    if (storedDetailsString) {
      try {
        const parsedDetails = JSON.parse(storedDetailsString);
        setPaymentDetails(parsedDetails);
        setSelectedSeats(parsedDetails.selectedSeats || []);
        // The total amount should ideally come directly from parsedDetails to ensure consistency
        // It might include fees or discounts calculated prior to reaching payment.
        setTotalAmount(parsedDetails.totalAmount || totalFromQuery);

        // It's good practice to clear the localStorage item after retrieving it
        // to prevent re-use on accidental refresh or navigation.
        // localStorage.removeItem('paymentDetails'); // Consider when to clear, maybe after successful payment
      } catch (error) {
        console.error('Error parsing paymentDetails from localStorage:', error);
        toast.error("Could not retrieve booking details. Please try again.");
        // Fallback to query param if localStorage fails, though less reliable for complex data
        setTotalAmount(totalFromQuery);
      }
    } else {
      // Fallback if no localStorage item (e.g., direct navigation to payment page)
       toast.warn("No booking details found. Please start from the event page.");
       setTotalAmount(totalFromQuery); // Use query param as a last resort
    }
  }, [totalFromQuery]);


  const handlePayNow = async () => {
    if (!paymentDetails || selectedSeats.length === 0) {
        toast.error("Booking details are missing or no seats selected.");
        return;
    }
    if (paymentMethod === 'credit-card') {
        if (!cardNumber || !expiryDate || !cvv || !cardHolderName) {
            toast.error("Please fill in all card details.");
            return;
        }
        // Basic validation (length, format) can be added here
    }

    setIsProcessing(true);
    toast.loading("Processing payment...");

    // --- Simulate Payment & Booking Creation ---
    // In a real app, this would involve:
    // 1. Securely sending payment info to a payment gateway.
    // 2. On successful payment, create a booking record in your DB.
    // 3. Update seat statuses to 'occupied'.
    try {
        // Example: Create a booking on your backend
        const bookingPayload = {
            eventId: paymentDetails.eventId,
            // ticketTypeIds and quantities would be derived from paymentDetails.selectedSeats
            // For simplicity, if your /api/bookings can handle the `selectedSeats` structure directly:
            selectedTickets: paymentDetails.selectedSeats.map(s => ({
                category: s.category, // Or ticketTypeId if you have it
                price: s.price,
                quantity: 1, // Assuming each selected seat is one ticket
                seatInfo: `${s.section}-${s.row}${s.seat}`
            })),
            totalAmount: paymentDetails.totalAmount,
            paymentMethod: paymentMethod,
            // Add other necessary booking info: promoCodeApplied, fees, etc.
        };

        // const bookingResponse = await fetch('/api/bookings', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(bookingPayload),
        // });

        // if (!bookingResponse.ok) {
        //     const errorData = await bookingResponse.json();
        //     throw new Error(errorData.error || "Booking creation failed.");
        // }
        // const bookingResult = await bookingResponse.json();

        // Simulate success after a delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        toast.dismiss();
        toast.success('Payment successful! Booking confirmed.'); // Booking ID: ${bookingResult.bookingId}
        localStorage.removeItem('paymentDetails'); // Clean up

        // Redirect to a success page or "My Tickets"
        router.push('/'); // Example: redirect to homepage

    } catch (error) {
        toast.dismiss();
        toast.error(`Payment failed: ${error.message}`);
        console.error("Payment/Booking error:", error);
    } finally {
        setIsProcessing(false);
    }
  };


  // Display for selected seats in order summary
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
          {/* Display subtotal, fees, discounts if available in paymentDetails */}
          {/* For simplicity, just showing totalAmount */}
          <hr className="border-gray-200 my-3" />
          <p className="font-bold mt-3 text-xl text-sky-700">
            Total Amount <span className="float-right text-black">${totalAmount.toFixed(2)}</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-sky-800 border-b pb-2">Payment Method</h2>
          {/* Payment method selection (simplified) */}
          <div className="mb-3 border border-gray-300 rounded-md p-3 hover:border-sky-400 transition-colors">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="credit-card"
                checked={paymentMethod === 'credit-card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2 h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500"
              />
              Credit / Debit Card
            </label>
          </div>
           {/* Add other payment methods like E-Wallet if needed */}
        </div>

        {paymentMethod === 'credit-card' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
            <h2 className="text-2xl font-bold mb-2 text-sky-800 border-b pb-2">Card Details</h2>
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

        <button
          className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-lg font-bold text-lg shadow-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-60 ${isProcessing ? 'cursor-wait' : ''}`}
          onClick={handlePayNow}
          disabled={isProcessing || totalAmount === 0}
        >
          {isProcessing ? 'Processing...' : `Pay Now - $${totalAmount.toFixed(2)}`}
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
        }
        .input-field:focus {
          outline: none;
          border-color: #0EA5E9; /* sky-500 */
          box-shadow: 0 0 0 2px #7DD3FC; /* ring-sky-300 (example) */
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;