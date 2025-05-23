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
      <div className="flex gap-4 mb-4">
        <span className="bg-gray-300 text-gray-800 px-3 py-1 rounded-md text-sm">Available</span>
        <span className="bg-gray-700 text-white px-3 py-1 rounded-md text-sm">Not Available</span>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">Selected</span>
      </div>

      <div className="w-full flex justify-center mb-4">
        <div className="bg-gray-200 text-gray-700 py-2 rounded-md font-bold text-center w-full">
          STAGE
        </div>
      </div>

      {/* Scrollable Container */}
      <div ref={scrollContainerRef} className="overflow-auto max-h-[500px] min-w-[1200px]">
        <div className="flex flex-col justify-center px-4">
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
                      className={`text-xs min-w-[2rem] h-[2rem] text-center py-0.5 rounded-md border border-gray-400
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

      <div className="mt-8 bg-white p-4 rounded-md border border-gray-200 w-full flex flex-col items-end">
        <div className="flex justify-between w-full mb-2 text-lg font-semibold">
          <span>Total Price</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between w-full mb-4 text-sm">
          <span>Seat</span>
          <span>{selectedSeats.map(seat => `${seat.row}${seat.seat}`).join(', ')}</span>
        </div>
        <button
          className="bg-green-500 text-white py-3 rounded-md cursor-pointer text-base font-bold self-center w-1/2 hover:bg-green-700"
          onClick={handleOrder}
        >
          Order ({selectedSeats.length})
        </button>
      </div>
    </div>
  );
};

export default SeatSelectionPage;