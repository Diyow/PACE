'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initialSeatingLayout } from './seatingData';

const SeatSelectionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketPrice = parseFloat(searchParams.get('ticketPrice')) || 0;
  const eventId = searchParams.get('eventId') || '';
  const eventName = searchParams.get('eventName') || 'Event';
  const [isLoading, setIsLoading] = useState(false);

  const [seatingLayout, setSeatingLayout] = useState(initialSeatingLayout);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    setTotalPrice(selectedSeats.length * ticketPrice);
  }, [selectedSeats, ticketPrice]);

  const handleSeatSelect = (sectionIndex, rowLetter, seatNumber) => {
    setSeatingLayout(prevLayout => {
      const newLayout = prevLayout.map((sectionData, idx) => {
        if (idx === sectionIndex) {
          return {
            ...sectionData,
            rows: Object.entries(sectionData.rows).reduce((acc, [row, seats]) => {
              if (row === rowLetter) {
                acc[row] = seats.map(seat =>
                  seat.number === seatNumber
                    ? { ...seat, status: seat.status === 'available' ? 'selected' : 'available' }
                    : seat
                );
              } else {
                acc[row] = seats;
              }
              return acc;
            }, {}),
          };
        }
        return sectionData;
      });
      return newLayout;
    });

    const currentSectionData = seatingLayout[sectionIndex];
    const isSelected = selectedSeats.some(
      seat => seat.section === currentSectionData.section && seat.row === rowLetter && seat.seat === seatNumber
    );

    if (isSelected) {
      setSelectedSeats(
        selectedSeats.filter(
          seat => !(seat.section === currentSectionData.section && seat.row === rowLetter && seat.seat === seatNumber)
        )
      );
    } else {
      setSelectedSeats([...selectedSeats, { section: currentSectionData.section, row: rowLetter, seat: seatNumber }]);
    }
  };

  const handleOrder = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/ticket-booking?selectedSeats=${JSON.stringify(selectedSeats)}&eventId=${eventId}`);
    }, 800);
  };

  const handleSectionClick = (sectionIndex) => {
    setActiveSection(activeSection === sectionIndex ? null : sectionIndex);
  };

  // Helper to render seats for a given section
  const renderSeatsForSection = (sectionData, sectionIndex) => {
    if (!sectionData || !sectionData.rows) return null;
    return (
      <div className="flex flex-col items-center w-full">
        {Object.entries(sectionData.rows).map(([rowLetter, seats]) => (
          <div
            key={rowLetter}
            className="flex gap-1 my-1 items-center justify-start flex-nowrap"
          >
            <span className="w-6 h-6 flex items-center justify-center text-[11px] leading-tight font-medium bg-slate-200 text-slate-700 rounded-sm mr-1">{rowLetter}</span>
            {seats.map(seat => (
              <button
                key={`${rowLetter}-${seat.number}`}
                className={`text-[11px] leading-tight min-w-[1.3rem] h-[1.3rem] flex items-center justify-center rounded border transition-all duration-150 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400
                  ${seat.status === 'available'
                    ? 'bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-300 cursor-pointer'
                    : seat.status === 'unavailable'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                    : 'bg-sky-500 text-white border-sky-600 shadow-md'}`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent section click when seat is clicked
                  handleSeatSelect(sectionIndex, rowLetter, seat.number);
                }}
                disabled={seat.status === 'unavailable'}
                title={`${sectionData.section} - Row ${rowLetter}, Seat ${seat.number}`}
              >
                {seat.number}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="font-sans max-w-8xl mx-auto p-4 bg-gradient-to-b from-sky-50 to-white rounded-lg shadow-xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-sky-800">{eventName}</h1>
        <p className="text-sky-600 text-lg">Select your seats</p>
      </div>

      {/* Seat Legend */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 sm:mb-0">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 bg-sky-100 rounded-sm border border-sky-300"></span>
            <span className="text-sm text-gray-700">Available</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 bg-gray-300 rounded-sm border border-gray-400"></span>
            <span className="text-sm text-gray-700">Unavailable</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 bg-sky-500 rounded-sm border border-sky-600"></span>
            <span className="text-sm text-gray-700">Selected</span>
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-600">Price per seat:</span>
          <span className="ml-1.5 font-semibold text-sky-700 text-lg">${ticketPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Seat Layout - Fixed Width Container */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1500px] bg-slate-50 rounded-lg shadow-inner p-4 border border-slate-200">
          <div className="flex flex-col items-center py-4">
            {/* Stage */}
            <div className="w-full flex justify-center mb-8">
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-8 rounded-lg font-bold text-center w-auto min-w-[250px] shadow-lg text-lg tracking-wider">
              S T A G E
            </div>
            </div>

            {/* Container for all section rows */}
            <div className="w-full flex flex-col items-center gap-y-10 px-2">

              {/* Lower Foyer Sections Row */}
              <div className="flex flex-row justify-center items-start w-full gap-6">
                {/* Left Lower Foyer (Index 0) */}
                {seatingLayout[0] && (
                  <div
                    key={0}
                    className={`w-[28%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSection === 0 ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`}
                    style={seatingLayout[0].style || {}}
                    onClick={() => handleSectionClick(0)}
                  >
                    <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                      {seatingLayout[0].section}
                    </h3>
                    {renderSeatsForSection(seatingLayout[0], 0)}
                  </div>
                )}
                {/* Center Lower Foyer (Index 1) */}
                {seatingLayout[1] && (
                  <div
                    key={1}
                    className={`w-[44%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSection === 1 ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`}
                    style={seatingLayout[1].style || {}}
                    onClick={() => handleSectionClick(1)}
                  >
                    <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                      {seatingLayout[1].section}
                    </h3>
                    {renderSeatsForSection(seatingLayout[1], 1)}
                  </div>
                )}
                {/* Right Lower Foyer (Index 2) */}
                {seatingLayout[2] && (
                  <div
                    key={2}
                    className={`w-[28%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSection === 2 ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`}
                    style={seatingLayout[2].style || {}}
                    onClick={() => handleSectionClick(2)}
                  >
                    <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                      {seatingLayout[2].section}
                    </h3>
                    {renderSeatsForSection(seatingLayout[2], 2)}
                  </div>
                )}
              </div>

              {/* Balcony Sections Row */}
              <div className="flex flex-row justify-center items-start w-full gap-6 mt-8">
                {/* Left Balcony (Index 3) */}
                {seatingLayout[3] && (
                  <div
                    key={3}
                    className={`w-[28%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSection === 3 ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`}
                    style={seatingLayout[3].style || {}}
                    onClick={() => handleSectionClick(3)}
                  >
                    <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                      {seatingLayout[3].section}
                    </h3>
                    {renderSeatsForSection(seatingLayout[3], 3)}
                  </div>
                )}
                {/* Center Balcony (Index 4) */}
                {seatingLayout[4] && (
                  <div
                    key={4}
                    className={`w-[44%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSection === 4 ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`}
                    style={seatingLayout[4].style || {}}
                    onClick={() => handleSectionClick(4)}
                  >
                    <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                      {seatingLayout[4].section}
                    </h3>
                    {renderSeatsForSection(seatingLayout[4], 4)}
                  </div>
                )}
                {/* Right Balcony (Index 5) */}
                {seatingLayout[5] && (
                  <div
                    key={5}
                    className={`w-[28%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSection === 5 ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`}
                    style={seatingLayout[5].style || {}}
                    onClick={() => handleSectionClick(5)}
                  >
                    <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                      {seatingLayout[5].section}
                    </h3>
                    {renderSeatsForSection(seatingLayout[5], 5)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="mt-8 bg-white p-5 rounded-lg shadow-lg border border-gray-200 w-full">
        <h3 className="text-xl font-bold mb-4 text-sky-800 border-b border-gray-200 pb-3">Your Selection</h3>
        <div className="flex flex-col lg:flex-row justify-between w-full mb-5">
          <div className="mb-4 lg:mb-0 lg:w-2/3">
            <span className="font-semibold text-sky-700 text-base">Selected Seats ({selectedSeats.length}):</span>
            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-2.5 mt-2.5">
                {selectedSeats.map((seat, index) => (
                  <span
                    key={index}
                    className="bg-sky-100 text-sky-800 px-3.5 py-2 rounded-md text-sm font-medium shadow-sm border border-sky-200 whitespace-nowrap"
                  >
                    {seat.section} - {seat.row}{seat.seat}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 italic mt-2.5 block">No seats selected. Click on available seats to choose.</span>
            )}
          </div>
          <div className="text-left lg:text-right lg:w-1/3">
            <span className="font-semibold text-sky-700 text-base">Total Price:</span>
            <span className="text-3xl font-bold text-sky-600 mt-1 block">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <button
          className={`w-full lg:w-auto lg:px-12 py-3.5 rounded-lg text-base font-bold transition-all duration-300 relative flex items-center justify-center
            ${selectedSeats.length > 0 ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-lg hover:shadow-xl' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={handleOrder}
          disabled={selectedSeats.length === 0 || isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : selectedSeats.length > 0 ? (
            `Proceed to Checkout (${selectedSeats.length} ${selectedSeats.length === 1 ? "Seat" : "Seats"})`
          ) : (
            'Select Seats to Continue'
          )}
        </button>
      </div>
    </div>
  );
};

export default SeatSelectionPage;