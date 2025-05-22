'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image'; // Import the Image component

const SeatSelectionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketPrice = parseFloat(searchParams.get('ticketPrice')) || 0;
  const eventId = searchParams.get('eventId') || '';
  const eventName = searchParams.get('eventName') || 'Event';
  const scrollContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [seatingLayout, setSeatingLayout] = useState([
    {
      section: 'Left Lower Foyer',
      rows: {
        A: Array.from({ length: 8 }, (_, i) => ({ number: 36 + (8 - 1 - i), status: 'available' })),
        B: Array.from({ length: 9 }, (_, i) => ({ number: 36 + (9 - 1 - i), status: 'available' })),
        C: Array.from({ length: 11 }, (_, i) => ({ number: 36 + (11 - 1 - i), status: 'available' })),
        D: Array.from({ length: 12 }, (_, i) => ({ number: 36 + (12 - 1 - i), status: 'available' })),
        E: Array.from({ length: 12 }, (_, i) => ({ number: 36 + (12 - 1 - i), status: 'available' })),
        F: Array.from({ length: 12 }, (_, i) => ({ number: 36 + (12 - 1 - i), status: 'available' })),
        G: Array.from({ length: 12 }, (_, i) => ({ number: 36 + (12 - 1 - i), status: 'available' })),
        H: Array.from({ length: 11 }, (_, i) => ({ number: 36 + (11 - 1 - i), status: 'available' })),
        J: Array.from({ length: 10 }, (_, i) => ({ number: 36 + (10 - 1 - i), status: 'available' })),
        K: Array.from({ length: 8 }, (_, i) => ({ number: 36 + (8 - 1 - i), status: 'available' })),
        L: Array.from({ length: 5 }, (_, i) => ({ number: 36 + (5 - 1 - i), status: 'available' })),
      },
      style: { // Simplified style
        marginTop: '20px',
        marginRight: 'md:10px', // Only apply margin on medium screens and up for grid layout
      },
    },
    {
      section: 'Center Lower Foyer',
      rows: {
        A: Array.from({ length: 19 }, (_, i) => ({ number: 15 + (19 - 1 - i), status: 'available' })),
        B: Array.from({ length: 20 }, (_, i) => ({ number: 15 + (20 - 1 - i), status: 'available' })),
        C: Array.from({ length: 19 }, (_, i) => ({ number: 15 + (19 - 1 - i), status: 'available' })),
        D: Array.from({ length: 20 }, (_, i) => ({ number: 15 + (20 - 1 - i), status: 'available' })),
        E: Array.from({ length: 17 }, (_, i) => ({ number: 15 + (17 - 1 - i), status: 'available' })),
        F: Array.from({ length: 18 }, (_, i) => ({ number: 15 + (18 - 1 - i), status: 'available' })),
        G: Array.from({ length: 17 }, (_, i) => ({ number: 15 + (17 - 1 - i), status: 'available' })),
        H: Array.from({ length: 18 }, (_, i) => ({ number: 15 + (18 - 1 - i), status: 'available' })),
        J: Array.from({ length: 15 }, (_, i) => ({ number: 15 + (15 - 1 - i), status: 'available' })),
        K: Array.from({ length: 16 }, (_, i) => ({ number: 15 + (16 - 1 - i), status: 'available' })),
      },
      style: { // Simplified style
        marginTop: '20px',
      },
    },
    {
      section: 'Right Lower Foyer',
      rows: {
        A: Array.from({ length: 8 }, (_, i) => ({ number: 1 + (8 - 1 - i), status: 'available' })),
        B: Array.from({ length: 10 }, (_, i) => ({ number: 1 + (10 - 1 - i), status: 'available' })),
        C: Array.from({ length: 11 }, (_, i) => ({ number: 1 + (11 - 1 - i), status: 'available' })),
        D: Array.from({ length: 12 }, (_, i) => ({ number: 1 + (12 - 1 - i), status: 'available' })),
        E: Array.from({ length: 12 }, (_, i) => ({ number: 1 + (12 - 1 - i), status: 'available' })),
        F: Array.from({ length: 12 }, (_, i) => ({ number: 1 + (12 - 1 - i), status: 'available' })),
        G: Array.from({ length: 12 }, (_, i) => ({ number: 1 + (12 - 1 - i), status: 'available' })),
        H: Array.from({ length: 11 }, (_, i) => ({ number: 1 + (11 - 1 - i), status: 'available' })),
        J: Array.from({ length: 10 }, (_, i) => ({ number: 1 + (10 - 1 - i), status: 'available' })),
        K: Array.from({ length: 8 }, (_, i) => ({ number: 1 + (8 - 1 - i), status: 'available' })),
        L: Array.from({ length: 5 }, (_, i) => ({ number: 1 + (5 - 1 - i), status: 'available' })),
      },
      style: { // Simplified style
        marginTop: '20px',
        marginLeft: 'md:10px', // Only apply margin on medium screens and up for grid layout
      },
    },
    {
      section: 'Left Balcony',
      rows: {
        AA: Array.from({ length: 14 }, (_, i) => ({ number: 50 - i, status: 'available' })),
        BB: Array.from({ length: 14 }, (_, i) => ({ number: 50 - i, status: 'available' })),
        CC: Array.from({ length: 14 }, (_, i) => ({ number: 50 - i, status: 'available' })),
        DD: Array.from({ length: 13 }, (_, i) => ({ number: 49 - i, status: 'available' })),
        EE: Array.from({ length: 12 }, (_, i) => ({ number: 48 - i, status: 'available' })),
      },
      style: { marginRight: 'md:10px' }, // Simplified
    },
    {
      section: 'Center Balcony',
      rows: {
        AA: Array.from({ length: 22 }, (_, i) => ({ number: 36 - i, status: 'available' })),
        BB: Array.from({ length: 22 }, (_, i) => ({ number: 36 - i, status: 'available' })),
        CC: Array.from({ length: 22 }, (_, i) => ({ number: 36 - i, status: 'available' })),
        DD: Array.from({ length: 22 }, (_, i) => ({ number: 36 - i, status: 'available' })),
        EE: Array.from({ length: 21 }, (_, i) => ({ number: 35 - i, status: 'available' })),
      },
      style: { }, // Let grid and flex handle centering. items-center on section div helps.
    },
    {
      section: 'Right Balcony',
      rows: {
        AA: Array.from({ length: 13 }, (_, i) => ({ number: 13 - i, status: 'available' })),
        BB: Array.from({ length: 13 }, (_, i) => ({ number: 13 - i, status: 'available' })),
        CC: Array.from({ length: 13 }, (_, i) => ({ number: 13 - i, status: 'available' })),
        DD: Array.from({ length: 13 }, (_, i) => ({ number: 13 - i, status: 'available' })),
        EE: Array.from({ length: 12 }, (_, i) => ({ number: 12 - i, status: 'available' })),
      },
      style: { marginLeft: 'md:10px' }, // Simplified
    },
  ]);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    setTotalPrice(selectedSeats.length * ticketPrice);
  }, [selectedSeats, ticketPrice]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    }
  }, []);

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

    const currentSection = seatingLayout[sectionIndex].section;
    const isSelected = selectedSeats.some(
      seat => seat.section === currentSection && seat.row === rowLetter && seat.seat === seatNumber
    );

    if (isSelected) {
      setSelectedSeats(
        selectedSeats.filter(
          seat => !(seat.section === currentSection && seat.row === rowLetter && seat.seat === seatNumber)
        )
      );
    } else {
      setSelectedSeats([...selectedSeats, { section: currentSection, row: rowLetter, seat: seatNumber }]);
    }
  };

  const handleOrder = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/ticket-booking?selectedSeats=${JSON.stringify(selectedSeats)}&eventId=${eventId}`);
    }, 800);
  };

  const handleZoom = (zoomIn) => {
    setZoomLevel(prev => zoomIn ? Math.min(prev + 0.1, 1.5) : Math.max(prev - 0.1, 0.5)); // Min zoom 0.5
  };

  const handleSectionClick = (sectionIndex) => {
    setActiveSection(activeSection === sectionIndex ? null : sectionIndex);
  };

  return (
    <div className="font-sans max-w-7xl mx-auto p-4 bg-gradient-to-b from-sky-50 to-white rounded-lg shadow-xl"> {/* Shadow on main container */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-sky-800">{eventName}</h1> {/* Larger title */}
        <p className="text-sky-600 text-lg">Select your seats</p> {/* Larger subtitle */}
      </div>

      {/* Add the seat mapping image here */}
      <div className="mb-6 flex justify-center">
        <Image 
          src="/seat-mapping.png" 
          alt="Seat Mapping Reference" 
          width={800} // Adjust width as needed
          height={400} // Adjust height as needed
          className="rounded-lg shadow-md"
        />
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-md"> {/* Controls shadow & padding */}
        <div className="flex items-center space-x-3 mb-3 sm:mb-0">
          <button
            onClick={() => handleZoom(false)}
            className="p-2.5 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors shadow-sm"
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm text-gray-700 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => handleZoom(true)}
            className="p-2.5 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors shadow-sm"
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 sm:mb-0">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 bg-sky-100 rounded-sm border border-sky-300"></span>
            <span className="text-sm text-gray-700">Available</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 bg-gray-300 rounded-sm border border-gray-400"></span> {/* Lighter gray */}
            <span className="text-sm text-gray-700">Unavailable</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 bg-sky-500 rounded-sm border border-sky-600"></span> {/* Darker selected */}
            <span className="text-sm text-gray-700">Selected</span>
          </span>
        </div>

        <div className="text-right">
          <span className="text-sm text-gray-600">Price per seat:</span>
          <span className="ml-1.5 font-semibold text-sky-700 text-lg">${ticketPrice.toFixed(2)}</span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="overflow-auto max-h-[70vh] w-full bg-slate-50 rounded-lg shadow-inner p-4 border border-slate-200 custom-scrollbar" // Added custom-scrollbar class if you have one
      >
        <div
          className="flex flex-col items-center justify-center transition-transform duration-300 ease-in-out py-4" // Added padding top/bottom
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }} // Center origin for zoom
        >
          <div className="w-full flex justify-center mb-8"> {/* Increased margin bottom */}
            <div className="bg-gradient-to-r from-slate-600 to-slate-800 text-white py-3 px-8 rounded-lg font-bold text-center w-auto min-w-[250px] shadow-lg text-lg tracking-wider"> {/* Enhanced stage */}
              S T A G E
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-y-8 md:gap-y-12"> {/* Consistent gap */}
            {/* Lower Foyer Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-x-8 px-2">
              {seatingLayout.slice(0, 3).map((sectionData, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className={`flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSection === sectionIndex ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`}
                  style={sectionData.style} // Simplified style application
                  onClick={() => handleSectionClick(sectionIndex)}
                >
                  <h3 className="font-semibold mb-3 text-sky-800 text-center px-3 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                    {sectionData.section}
                  </h3>
                  <div className="flex flex-col items-center w-full">
                    {Object.entries(sectionData.rows).map(([rowLetter, seats]) => (
                      <div
                        key={rowLetter}
                        className="flex gap-1 my-1 items-center justify-start flex-wrap" // Changed justify-center to justify-start and flex-wrap to flex-nowrap
                        style={{
                          transform: seats.length > 18 ? 'scale(0.8)' : (seats.length > 12 ? 'scale(0.9)' : 'none'), // Adjusted scaling
                          transformOrigin: 'center',
                        }}
                      >
                        <span className="w-7 h-7 flex items-center justify-center text-xs font-medium bg-slate-200 text-slate-700 rounded-sm mr-1">{rowLetter}</span>
                        {seats.map(seat => (
                          <button
                            key={`${rowLetter}-${seat.number}`}
                            className={`text-xs min-w-[2rem] h-[2rem] flex items-center justify-center rounded border transition-all duration-150 transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-sky-400
                              ${seat.status === 'available'
                                ? 'bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-300 cursor-pointer'
                                : seat.status === 'unavailable'
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                                : 'bg-sky-500 text-white border-sky-600 shadow-lg scale-110'}`} // Enhanced selected state
                            onClick={(e) => {
                              e.stopPropagation();
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
                </div>
              ))}
            </div>

            {/* Balcony Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-x-8 px-2 mt-6 md:mt-8">
              {seatingLayout.slice(3, 6).map((sectionData, idx) => (
                <div
                  key={idx + 3}
                  className={`flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSection === idx + 3 ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`}
                  style={sectionData.style} // Simplified style application
                  onClick={() => handleSectionClick(idx + 3)}
                >
                  <h3 className="font-semibold mb-3 text-sky-800 text-center px-3 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                    {sectionData.section}
                  </h3>
                  <div className="flex flex-col items-center w-full">
                    {Object.entries(sectionData.rows).map(([rowLetter, seats]) => (
                      <div
                        key={rowLetter}
                        className="flex gap-1 my-1 items-center justify-center flex-wrap" // Added justify-center & flex-wrap
                        style={{
                            transform: seats.length > 18 ? 'scale(0.8)' : (seats.length > 12 ? 'scale(0.9)' : 'none'), // Adjusted scaling
                            transformOrigin: 'center',
                        }}
                      >
                        <span className="w-7 h-7 flex items-center justify-center text-xs font-medium bg-slate-200 text-slate-700 rounded-sm mr-1">{rowLetter}</span>
                        {seats.map(seat => (
                          <button
                            key={`${rowLetter}-${seat.number}`}
                            className={`text-xs min-w-[2rem] h-[2rem] flex items-center justify-center rounded border transition-all duration-150 transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-sky-400
                              ${seat.status === 'available'
                                ? 'bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-300 cursor-pointer'
                                : seat.status === 'unavailable'
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                                : 'bg-sky-500 text-white border-sky-600 shadow-lg scale-110'}`} // Enhanced selected state
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeatSelect(idx + 3, rowLetter, seat.number);
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-5 rounded-lg shadow-lg border border-gray-200 w-full"> {/* Enhanced summary */}
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