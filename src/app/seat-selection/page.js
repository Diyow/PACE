'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const SeatSelectionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketPrice = parseFloat(searchParams.get('ticketPrice')) || 0;
  const scrollContainerRef = useRef(null);

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
      style: {
        transform: 'rotate(10deg)',
        transformOrigin: 'top right',
        marginTop: '100px',
        marginLeft: '35px',
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
      style: { marginTop: '100px' },
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
      style: {
        transform: 'rotate(-10deg)',
        transformOrigin: 'top left',
        marginTop: '100px',
      },
    },
    {
      section: 'Balcony',
      rows: {
        AA: Array.from({ length: 50 }, (_, i) => ({ number: 50 - i, status: 'available' })),
        BB: Array.from({ length: 50 }, (_, i) => ({ number: 50 - i, status: 'available' })),
        CC: Array.from({ length: 50 }, (_, i) => ({ number: 50 - i, status: 'available' })),
        DD: Array.from({ length: 49 }, (_, i) => ({ number: 49 - i, status: 'available' })),
        EE: Array.from({ length: 48 }, (_, i) => ({ number: 48 - i, status: 'available' })),
      },
      style: { marginLeft: 'auto', marginRight: 'auto' }, // Attempt to center the balcony
    },
  ]);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

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
    console.log('Order button clicked');
    router.push(`/ticket-booking?selectedSeats=${JSON.stringify(selectedSeats)}`);
  };

  const getRowRotation = (section, rowIndex, totalRows) => {
    const baseAngle = 5;
    const maxIndex = totalRows - 1;
    const normalizedIndex = rowIndex / maxIndex;

    if (section === 'Left Lower Foyer') {
      return `${-baseAngle * normalizedIndex}deg`;
    } else if (section === 'Right Lower Foyer') {
      return `${baseAngle * normalizedIndex}deg`;
    }
    return '0deg';
  };

  return (
    <div className="font-sans max-w-7xl mx-auto p-4 bg-gray-100 rounded-md">
      {/* Legend with improved responsive design */}
      <div className="flex flex-wrap gap-4 mb-4">
        <span className="bg-gray-300 text-gray-800 px-3 py-1 rounded-md text-sm">Available</span>
        <span className="bg-gray-700 text-white px-3 py-1 rounded-md text-sm">Not Available</span>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">Selected</span>
      </div>

      {/* Responsive container */}
      <div ref={scrollContainerRef} className="overflow-auto max-h-[70vh] w-full md:min-w-[800px] lg:min-w-[1000px]">
        <div className="flex flex-col justify-center px-4">
          <div className="w-full flex justify-center mb-6">
            <div className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-bold text-center w-full md:w-1/2 lg:w-1/3">
              STAGE
            </div>
          </div>

          {/* Add a mini-map for orientation */}
          <div className="hidden md:block absolute top-4 right-4 bg-white p-2 rounded-md shadow-md">
            <h4 className="text-xs font-bold mb-1">Venue Overview</h4>
            <div className="w-[100px] h-[80px] bg-gray-100 relative">
              <div className="absolute top-0 w-full h-[10px] bg-gray-300 flex justify-center items-center text-[8px]">STAGE</div>
              <div className="absolute top-[15px] left-[5px] w-[25px] h-[25px] bg-blue-100 transform rotate-10 text-[6px] flex items-center justify-center">Left</div>
              <div className="absolute top-[15px] left-[35px] w-[30px] h-[25px] bg-blue-100 text-[6px] flex items-center justify-center">Center</div>
              <div className="absolute top-[15px] right-[5px] w-[25px] h-[25px] bg-blue-100 transform -rotate-10 text-[6px] flex items-center justify-center">Right</div>
              <div className="absolute bottom-[5px] left-[20px] right-[20px] h-[15px] bg-blue-100 text-[6px] flex items-center justify-center">Balcony</div>
            </div>
          </div>
          <div className="flex items-start gap-8 mb-8">
            {seatingLayout.slice(0, 3).map((sectionData, sectionIndex) => (
              <div key={sectionIndex} className="flex flex-col items-center" style={sectionData.style}>
                <h3 className="font-semibold mb-2">{sectionData.section}</h3>
                <div className="flex flex-col items-center">
                  {Object.entries(sectionData.rows).map(([rowLetter, seats], rowIndex) => (
                    <div
                      key={rowLetter}
                      className="flex gap-0.5 my-0.5 items-center"
                      style={{
                        transform:
                          sectionData.section === 'Left Lower Foyer' || sectionData.section === 'Right Lower Foyer'
                            ? getRowRotation(sectionData.section, rowIndex, Object.keys(sectionData.rows).length)
                            : 'none',
                        transformOrigin:
                          sectionData.section === 'Left Lower Foyer'
                            ? 'top right'
                            : sectionData.section === 'Right Lower Foyer'
                            ? 'top left'
                            : 'top',
                      }}
                    >
                      <span className="w-6 text-center text-xs">{rowLetter}</span>
                      {seats.map(seat => (
                        <button
                          key={`${rowLetter}-${seat.number}`}
                          className={`text-xs min-w-[2rem] h-[2rem] text-center py-0.5 rounded-md border border-gray-400
                            ${seat.status === 'available'
                              ? 'bg-gray-300 text-gray-800 hover:bg-gray-400 cursor-pointer'
                              : seat.status === 'unavailable'
                              ? 'bg-gray-700 text-white cursor-not-allowed'
                              : 'bg-blue-500 text-white'}`}
                          onClick={() => handleSeatSelect(sectionIndex, rowLetter, seat.number)}
                          disabled={seat.status === 'unavailable'}
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

          {/* Balcony Section */}
          <div className="flex flex-col items-center mb-8" style={seatingLayout[3].style}>
            <h3 className="font-semibold mb-2">{seatingLayout[3].section}</h3>
            <div className="flex flex-col items-center">
              {Object.entries(seatingLayout[3].rows).map(([rowLetter, seats]) => (
                <div key={rowLetter} className="flex gap-0.5 my-0.5 items-center">
                  <span className="w-6 text-center text-xs">{rowLetter}</span>
                  {seats.map(seat => (
                    <button
                      key={`${rowLetter}-${seat.number}`}
                      className={`text-xs sm:min-w-[1.5rem] md:min-w-[2rem] min-w-[1.25rem] h-[1.5rem] sm:h-[1.75rem] md:h-[2rem] text-center py-0.5 rounded-md border border-gray-400
                            ${seat.status === 'available'
                              ? 'bg-gray-300 text-gray-800 hover:bg-gray-400 cursor-pointer'
                              : seat.status === 'unavailable'
                              ? 'bg-gray-700 text-white cursor-not-allowed'
                              : 'bg-blue-500 text-white'}`}
                      onClick={() => handleSeatSelect(3, rowLetter, seat.number)}
                      disabled={seat.status === 'unavailable'}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-4 rounded-md border border-gray-200 w-full flex flex-col">
        <h3 className="text-lg font-bold mb-4">Your Selection</h3>
        <div className="flex flex-col md:flex-row justify-between w-full mb-4">
          <div className="mb-2 md:mb-0">
            <span className="font-semibold block">Selected Seats:</span>
            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedSeats.map((seat, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {seat.section.charAt(0)}-{seat.row}{seat.seat}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 italic">No seats selected</span>
            )}
          </div>
          <div className="text-right">
            <span className="font-semibold block">Total Price:</span>
            <span className="text-xl font-bold text-green-600">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <button
          className={`py-3 rounded-md cursor-pointer text-base font-bold self-center w-full md:w-1/2 ${selectedSeats.length > 0 ? 'bg-green-500 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={handleOrder}
          disabled={selectedSeats.length === 0}
        >
          {selectedSeats.length > 0 ? `Order (${selectedSeats.length})` : 'Select seats to continue'}
        </button>
      </div>
    </div>
  );
};

export default SeatSelectionPage;
