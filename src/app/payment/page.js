// src/app/payment/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast'; 

const PaymentPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // totalFromQuery is the final total AFTER discount from event details page
  const totalFromQuery = parseFloat(searchParams.get('total')) || 0; 

  const [paymentDetails, setPaymentDetails] = useState(null); // From localStorage
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0); // This will be the final amount to pay
  const [originalSubtotal, setOriginalSubtotal] = useState(0); // Subtotal before discount
  const [discountInfo, setDiscountInfo] = useState(null); // { code, amount }

  const [paymentMethod, setPaymentMethod] = useState('credit-card');
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
        console.log("[PaymentPage] Parsed paymentDetails from localStorage:", parsedDetails);
        setPaymentDetails(parsedDetails);
        setSelectedSeats(parsedDetails.selectedSeats || []);
        
        // Calculate original subtotal from selected seats prices
        const subtotalCalc = (parsedDetails.selectedSeats || []).reduce((sum, seat) => sum + (parseFloat(seat.price) || 0), 0);
        setOriginalSubtotal(subtotalCalc);

        if (parsedDetails.appliedPromoCode && parsedDetails.discountAmount > 0) {
            setDiscountInfo({
                code: parsedDetails.appliedPromoCode,
                amount: parseFloat(parsedDetails.discountAmount)
            });
        }
        // totalAmount is the final amount after potential discount, passed via query or from parsedDetails
        setTotalAmount(parsedDetails.totalAmount || totalFromQuery); 

      } catch (error) {
        console.error('[PaymentPage] Error parsing paymentDetails from localStorage:', error);
        toast.error("Could not retrieve booking details. Please try again.");
        setTotalAmount(totalFromQuery); // Fallback
      }
    } else {
       toast.warn("No booking details found. Please start from the event page.");
       router.push('/'); // Redirect if no details
       setTotalAmount(totalFromQuery); // Fallback
    }
  }, [totalFromQuery, router]); // Added router to dependency array

  const handlePayNow = async () => {
    if (!paymentDetails || selectedSeats.length === 0) {
        toast.error("Booking details are missing or no seats selected.");
        return;
    }

    if (paymentMethod === 'credit-card') {
        if (!cardHolderName || !cardNumber || !expiryDate || !cvv) {
            toast.error("Please fill in all dummy card details to simulate.");
            return;
        }
    } else if (paymentMethod === 'e-wallet') {
        const ewalletId = document.getElementById('ewalletId')?.value;
        if (!ewalletId) {
            toast.error("Please enter a dummy e-wallet ID.");
            return;
        }
    }

    setIsProcessing(true);
    toast.loading("Simulating payment processing...");

    await new Promise(resolve => setTimeout(resolve, 1500)); 

    try {
        const bookingPayload = {
            eventId: paymentDetails.eventId,
            _detailedSelectedSeats: paymentDetails.selectedSeats,
            totalAmount: originalSubtotal, // Send the original total amount BEFORE discount
            paymentStatusOverride: 'completed',
            // Add discount information if available
            ...(discountInfo && {
                appliedPromoCode: discountInfo.code,
                discountAppliedAmount: discountInfo.amount,
            }),
            // The final amount paid would be originalSubtotal - discountAppliedAmount
            // The backend can recalculate this or trust the client's final totalAmount for verification
            // For simplicity, we let backend recalculate if needed, but store the discount.
        };
        
        console.log("[PaymentPage] Sending booking payload:", bookingPayload);

        const bookingResponse = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload),
        });

        const bookingResult = await bookingResponse.json(); // Always try to parse, even for errors

        if (!bookingResponse.ok) {
            console.error("[PaymentPage] Booking API Error Data:", bookingResult);
            throw new Error(bookingResult.error || "Booking creation failed after simulated payment.");
        }
        
        console.log("[PaymentPage] Simulated Email Sent: Booking Confirmation for", paymentDetails.eventName);
        console.log("[PaymentPage] Booking ID:", bookingResult.bookingId);
        console.log("[PaymentPage] Ticket Details:", paymentDetails.selectedSeats);
        console.log("[PaymentPage] Original Subtotal:", originalSubtotal.toFixed(2));
        if(discountInfo) {
            console.log("[PaymentPage] Discount Applied:", discountInfo.code, "-$", discountInfo.amount.toFixed(2));
        }
        console.log("[PaymentPage] Final Amount Paid:", totalAmount.toFixed(2)); // totalAmount is already discounted

        toast.dismiss();
        toast.success(`Payment Successful! Booking ID: ${bookingResult.bookingId}.`);

        localStorage.removeItem('paymentDetails');
        setTimeout(() => {
            router.push('/'); 
        }, 2000);

    } catch (error) {
        toast.dismiss();
        toast.error(`An error occurred: ${error.message}`);
        console.error("[PaymentPage] Simulated Payment/Booking error:", error);
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
          <hr className="border-gray-200 my-2" />
           <p className="text-sm text-gray-700">
            Subtotal <span className="float-right">${originalSubtotal.toFixed(2)}</span>
          </p>
          {discountInfo && (
            <p className="text-sm text-green-600">
                Discount ({discountInfo.code})
                <span className="float-right">-${discountInfo.amount.toFixed(2)}</span>
            </p>
          )}
          <hr className="border-gray-200 my-2" />
          <p className="font-bold mt-2 text-xl text-sky-700">
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
