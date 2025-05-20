'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const PaymentPage = () => {
  const searchParams = useSearchParams();

  // Retrieve selected seats and total from query parameters
  const selectedSeatsParam = searchParams.get('selectedSeats');
  const totalFromQuery = parseFloat(searchParams.get('total')) || 0;
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalAmount, setTotalAmount] = useState(totalFromQuery);

  // Processing fee: $2 total for the entire order
  const processingFee = 2.00;

  useEffect(() => {
    if (selectedSeatsParam) {
      try {
        const parsedSeats = JSON.parse(selectedSeatsParam);
        setSelectedSeats(parsedSeats);
        setTotalAmount(totalFromQuery + processingFee);
      } catch (error) {
        console.error('Error parsing selected seats:', error);
        // Handle potential parsing errors
      }
    } else {
      setTotalAmount(totalFromQuery); // If no seats, keep the total as is (shouldn't happen in a normal flow)
    }
  }, [selectedSeatsParam, totalFromQuery, processingFee]);

  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const handleCardNumberChange = (event) => {
    setCardNumber(event.target.value);
  };

  const handleExpiryDateChange = (event) => {
    setExpiryDate(event.target.value);
  };

  const handlePayNow = () => {
    // In a real application, this would trigger the payment processing logic.
    // You would send the payment details, selected seats, and total amount to your backend.
    alert('Payment initiated!');
    console.log('Payment Details:', {
      paymentMethod,
      cardNumber,
      expiryDate,
      selectedSeats,
      totalAmount,
    });
    // You might want to redirect to a confirmation page here in a real app.
  };

  return (
    <div className="font-sans max-w-md mx-auto mt-10 p-6 bg-gray-100 rounded-md shadow-md">
      <main className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Order Summary</h2>
          {selectedSeats.length > 0 ? (
            <p className="mb-2">
              Event Ticket - {selectedSeats.map(seat => `${seat.row}${seat.seat}`).join(', ')}{' '}
              <span className="float-right text-gray-800">${(totalAmount - processingFee).toFixed(2)}</span>
            </p>
          ) : (
            <p className="mb-2">No seats selected.</p>
          )}
          <p className="mb-2">
            Processing Fee <span className="float-right text-gray-800">${processingFee.toFixed(2)}</span>
          </p>
          <hr className="border-gray-200 my-4" />
          <p className="font-bold mt-4 text-gray-800">
            Total Amount <span className="float-right font-bold text-black">${totalAmount.toFixed(2)}</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Payment Method</h2>
          <div className="mb-3 border border-gray-300 rounded-md p-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="credit-card"
                checked={paymentMethod === 'credit-card'}
                onChange={handlePaymentMethodChange}
                className="mr-2"
              />
              Credit Card
            </label>
          </div>
          <div className="border border-gray-300 rounded-md p-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="e-wallet"
                checked={paymentMethod === 'e-wallet'}
                onChange={handlePaymentMethodChange}
                className="mr-2"
              />
              E-Wallet
            </label>
          </div>
        </div>

        {paymentMethod === 'credit-card' && (
          <div className="bg-white p-6 rounded-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Card Details</h2>
            <div className="mb-4">
              <label htmlFor="cardNumber" className="block text-gray-700 text-sm font-bold mb-2">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumberChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label htmlFor="expiryDate" className="block text-gray-700 text-sm font-bold mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                id="expiryDate"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={handleExpiryDateChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
        )}

        <button
          className="bg-black text-white py-3 rounded-md font-bold hover:bg-gray-800 focus:outline-none focus:shadow-outline"
          onClick={handlePayNow}
        >
          PAY NOW - ${totalAmount.toFixed(2)}
        </button>
      </main>
    </div>
  );
};

export default PaymentPage;