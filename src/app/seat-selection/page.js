'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast'; // Assuming you have react-hot-toast installed

// Removed: import { initialSeatingLayout } from './seatingData'; 
// We will fetch the layout or use the one from the event details.

const SeatSelectionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const eventId = searchParams.get('eventId') || '';
  const eventName = searchParams.get('eventName') || 'Event';
  // pricePerSeat from query is a fallback/representative, actual prices come from ticketCategories
  const representativePricePerSeat = parseFloat(searchParams.get('pricePerSeat')) || 0; 

  const [isLoading, setIsLoading] = useState(true); // Combined loading state

  // State for data fetched from API
  const [apiSeatingLayout, setApiSeatingLayout] = useState([]); // Layout from event.seatingLayout
  const [seatStatuses, setSeatStatuses] = useState({}); // Status from /api/seats
  const [ticketCategories, setTicketCategories] = useState([]); // From event.ticketCategories

  // State for user interaction
  const [selectedSeats, setSelectedSeats] = useState([]); // Array of { section, row, seat, price, category }
  const [totalPrice, setTotalPrice] = useState(0);
  const [activeSectionName, setActiveSectionName] = useState(null); // To highlight or focus on a section if needed

  const [error, setError] = useState(null);


  const fetchEventAndSeatData = useCallback(async () => {
    if (!eventId) {
      setError("Event ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      // 1. Fetch event details (includes seatingLayout template and ticketCategories)
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (!eventRes.ok) throw new Error(`Failed to fetch event details: ${eventRes.statusText} (status: ${eventRes.status})`);
      const eventData = await eventRes.json();

      if (!eventData.seatingLayout || eventData.seatingLayout.length === 0) {
        console.warn("No seating layout defined for this event in the database.");
        setError("Seating layout not available for this event.");
        setApiSeatingLayout([]); // Ensure it's an empty array
      } else {
        setApiSeatingLayout(eventData.seatingLayout);
      }

      setTicketCategories(eventData.ticketCategories || []);

      // 2. Fetch seat statuses (availability)
      const seatsStatusRes = await fetch(`/api/seats?eventId=${eventId}`);
      if (!seatsStatusRes.ok) throw new Error(`Failed to fetch seat statuses: ${seatsStatusRes.statusText} (status: ${seatsStatusRes.status})`);
      const seatsStatusData = await seatsStatusRes.json(); 

      const statuses = {};
      seatsStatusData.forEach(seat => {
        // Key should uniquely identify a seat within its section and row.
        // This assumes `seat` object from `/api/seats` has `section`, `row`, and `seatNumber` or similar.
        // Adjust if your API returns a different structure (e.g., seat._id and you map it differently).
        const sectionKey = seat.section || seat.sectionName || "UnknownSection";
        const rowKey = seat.row || seat.rowLetter || "UnknownRow";
        const numberKey = seat.seatNumber || seat.number || "UnknownNumber";
        const key = `${sectionKey}-${rowKey}-${numberKey}`;
        statuses[key] = seat.status;
      });
      setSeatStatuses(statuses);

    } catch (err) {
      console.error("Error fetching data for seat selection:", err);
      setError(err.message || "Could not load seat data.");
      setApiSeatingLayout([]); 
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventAndSeatData();
  }, [fetchEventAndSeatData]);

  // Calculate total price based on selected seats
  useEffect(() => {
    const newTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    setTotalPrice(newTotal);
  }, [selectedSeats]);

  const getSeatPrice = (sectionName) => {
    // Find the section configuration in the fetched API layout
    const sectionConfig = apiSeatingLayout.find(s => s.section === sectionName);
    if (sectionConfig && sectionConfig.assignedCategoryName) {
        const category = ticketCategories.find(tc => tc.category === sectionConfig.assignedCategoryName);
        return category ? parseFloat(category.price) : (ticketCategories[0] ? parseFloat(ticketCategories[0].price) : representativePricePerSeat);
    }
    // Fallback to the first ticket category's price or the representative price from query
    return ticketCategories[0] ? parseFloat(ticketCategories[0].price) : representativePricePerSeat;
  };

  const handleSeatSelect = (sectionName, rowLetter, seatNumber) => {
    const seatKey = `${sectionName}-${rowLetter}-${seatNumber}`;
    const currentStatusFromAPI = seatStatuses[seatKey] || 'available';

    if (currentStatusFromAPI === 'occupied' || currentStatusFromAPI === 'reserved') {
        toast.error("This seat is not available.");
        return;
    }

    const price = getSeatPrice(sectionName);
    const sectionConfig = apiSeatingLayout.find(s => s.section === sectionName);
    const category = sectionConfig?.assignedCategoryName || (ticketCategories[0]?.category || 'Standard');

    const seatIdentifier = { section: sectionName, row: rowLetter, seat: seatNumber };
    const isSelected = selectedSeats.some(
      s => s.section === sectionName && s.row === rowLetter && s.seat === seatNumber
    );

    if (isSelected) {
      setSelectedSeats(prevSeats =>
        prevSeats.filter(
          s => !(s.section === sectionName && s.row === rowLetter && s.seat === seatNumber)
        )
      );
    } else {
      // Add new seat with its details
      setSelectedSeats(prevSeats => [...prevSeats, { ...seatIdentifier, price, category }]);
    }
  };

  const handleConfirmAndProceed = () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat.");
      return;
    }
    setIsLoading(true); // Show loading for navigation feedback
    
    // Prepare data to pass back to the event detail page
    const selectedSeatsData = selectedSeats.map(s => ({ 
        section: s.section, 
        row: s.row, 
        seat: s.seat, 
        category: s.category, 
        price: s.price 
    }));
    
    router.push(`/events/${eventId}?selectedSeatsData=${encodeURIComponent(JSON.stringify(selectedSeatsData))}&totalCost=${totalPrice.toFixed(2)}`);
  };


  const handleSectionClick = (sectionName) => { // Changed from index to name for clarity
    setActiveSectionName(activeSectionName === sectionName ? null : sectionName);
  };

  // Helper to render seats for a given section from API data
  const renderSeatsForSection = (sectionData) => { // sectionData is from apiSeatingLayout
    if (!sectionData || typeof sectionData.rows !== 'object' || sectionData.rows === null) {
        return <div className="p-2 text-xs text-center text-red-500">Seat layout for this section is unavailable or misconfigured.</div>;
    }
    const sectionName = sectionData.section;

    return (
      <div className="flex flex-col items-center w-full">
        {Object.entries(sectionData.rows).map(([rowLetter, seatsInRowArray]) => {
           if (!Array.isArray(seatsInRowArray)) {
            return null; 
          }
          return (
            <div
              key={rowLetter}
              className="flex gap-1 my-1 items-center justify-start flex-nowrap"
            >
              <span className="w-6 h-6 flex items-center justify-center text-[11px] leading-tight font-medium bg-slate-200 text-slate-700 rounded-sm mr-1">{rowLetter}</span>
              {seatsInRowArray.map(seatObj => {
                const seatNumber = seatObj.number;
                const seatKey = `${sectionName}-${rowLetter}-${seatNumber}`;
                const apiStatus = seatStatuses[seatKey]; // Status from /api/seats

                const isCurrentlySelected = selectedSeats.some(
                  s => s.section === sectionName && s.row === rowLetter && s.seat === seatNumber
                );

                let seatDisplayStatus = 'available'; // Default display
                if (apiStatus === 'occupied' || apiStatus === 'reserved') {
                  seatDisplayStatus = 'unavailable';
                }
                if (isCurrentlySelected) {
                  seatDisplayStatus = 'selected';
                }

                return (
                  <button
                    key={`${rowLetter}-${seatNumber}`}
                    className={`text-[11px] leading-tight min-w-[1.3rem] h-[1.3rem] flex items-center justify-center rounded border transition-all duration-150 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400
                      ${seatDisplayStatus === 'available'
                        ? 'bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-300 cursor-pointer'
                        : seatDisplayStatus === 'unavailable'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                        : 'bg-sky-500 text-white border-sky-600 shadow-md' // selected
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (seatDisplayStatus !== 'unavailable') {
                           handleSeatSelect(sectionName, rowLetter, seatNumber);
                      } else {
                          toast.error("This seat is already taken.");
                      }
                    }}
                    disabled={apiStatus === 'occupied' || apiStatus === 'reserved'}
                    title={`${sectionName} - Row ${rowLetter}, Seat ${seatNumber}`}
                  >
                    {seatNumber}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };
  
  if (isLoading && !error && apiSeatingLayout.length === 0) { // Show initial loading screen
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 p-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500 mb-4"></div>
            <p className="text-sky-700 text-xl">Loading Seat Map for {eventName}...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
            {/* <InformationCircleIcon className="h-16 w-16 text-red-500 mb-4" /> You'd need to import this icon */}
            <h2 className="text-2xl font-semibold text-red-700 mb-2">Error Loading Seats</h2>
            <p className="text-red-600 text-center mb-6">{error}</p>
            <button
                onClick={() => router.back()} // Or fetchEventAndSeatData for a retry
                className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center"
            >
                Go Back
            </button>
        </div>
    );
  }
   if (!isLoading && apiSeatingLayout.length === 0 && !error) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <p className="text-xl text-gray-700">Seating information is currently not available for this event.</p>
             <button
                onClick={() => router.back()}
                className="mt-4 px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center"
            >
                Go Back
            </button>
        </div>
    );
  }


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
          {/* Price display can be more dynamic if prices vary by section */}
          {ticketCategories.length > 0 ? (
            <span className="text-sm text-gray-600">
              Prices from: <span className="font-semibold text-sky-700 text-lg">${Math.min(...ticketCategories.map(tc => parseFloat(tc.price))).toFixed(2)}</span>
            </span>
          ) : (
            <span className="text-sm text-gray-600">Price information loading...</span>
          )}
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
            {/* This structure assumes apiSeatingLayout is the direct array of sections like your original initialSeatingLayout */}
            <div className="w-full flex flex-col items-center gap-y-10 px-2">
              {/* Dynamically group sections if needed or render based on your API structure */}
              {/* Example: Rendering based on original group structure (Lower Foyer, Balcony) */}
              {/* You'll need to filter/map `apiSeatingLayout` to fit this visual grouping */}
              
              {/* Lower Foyer Sections Row */}
              <div className="flex flex-row justify-center items-start w-full gap-6">
                {apiSeatingLayout.filter(s => s.section.includes("Left Lower Foyer")).map((sectionData, idx) => (
                    <div key={sectionData.section || idx} className={`w-[28%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSectionName === sectionData.section ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`} style={sectionData.style || {}} onClick={() => handleSectionClick(sectionData.section)}>
                        <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                            {sectionData.section} ({sectionData.assignedCategoryName || 'Std.'}) - ${getSeatPrice(sectionData.section).toFixed(2)}
                        </h3>
                        {renderSeatsForSection(sectionData)}
                    </div>
                ))}
                 {apiSeatingLayout.filter(s => s.section.includes("Center Lower Foyer")).map((sectionData, idx) => (
                    <div key={sectionData.section || idx} className={`w-[44%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSectionName === sectionData.section ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`} style={sectionData.style || {}} onClick={() => handleSectionClick(sectionData.section)}>
                        <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                           {sectionData.section} ({sectionData.assignedCategoryName || 'Std.'}) - ${getSeatPrice(sectionData.section).toFixed(2)}
                        </h3>
                        {renderSeatsForSection(sectionData)}
                    </div>
                ))}
                {apiSeatingLayout.filter(s => s.section.includes("Right Lower Foyer")).map((sectionData, idx) => (
                    <div key={sectionData.section || idx} className={`w-[28%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSectionName === sectionData.section ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`} style={sectionData.style || {}} onClick={() => handleSectionClick(sectionData.section)}>
                        <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                            {sectionData.section} ({sectionData.assignedCategoryName || 'Std.'}) - ${getSeatPrice(sectionData.section).toFixed(2)}
                        </h3>
                        {renderSeatsForSection(sectionData)}
                    </div>
                ))}
              </div>

              {/* Balcony Sections Row */}
              <div className="flex flex-row justify-center items-start w-full gap-6 mt-8">
                 {apiSeatingLayout.filter(s => s.section.includes("Left Balcony")).map((sectionData, idx) => (
                    <div key={sectionData.section || idx} className={`w-[28%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSectionName === sectionData.section ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`} style={sectionData.style || {}} onClick={() => handleSectionClick(sectionData.section)}>
                        <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                            {sectionData.section} ({sectionData.assignedCategoryName || 'Std.'}) - ${getSeatPrice(sectionData.section).toFixed(2)}
                        </h3>
                        {renderSeatsForSection(sectionData)}
                    </div>
                ))}
                {apiSeatingLayout.filter(s => s.section.includes("Center Balcony")).map((sectionData, idx) => (
                    <div key={sectionData.section || idx} className={`w-[44%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSectionName === sectionData.section ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`} style={sectionData.style || {}} onClick={() => handleSectionClick(sectionData.section)}>
                        <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                            {sectionData.section} ({sectionData.assignedCategoryName || 'Std.'}) - ${getSeatPrice(sectionData.section).toFixed(2)}
                        </h3>
                        {renderSeatsForSection(sectionData)}
                    </div>
                ))}
                 {apiSeatingLayout.filter(s => s.section.includes("Right Balcony")).map((sectionData, idx) => (
                    <div key={sectionData.section || idx} className={`w-[28%] flex flex-col items-center transition-all duration-300 p-3 rounded-lg shadow-md ${activeSectionName === sectionData.section ? 'ring-2 ring-sky-500 bg-sky-50' : 'bg-white'}`} style={sectionData.style || {}} onClick={() => handleSectionClick(sectionData.section)}>
                        <h3 className="font-semibold mb-3 text-sky-800 text-center px-2 py-1.5 bg-sky-100 rounded-md shadow-sm w-full text-base">
                           {sectionData.section} ({sectionData.assignedCategoryName || 'Std.'}) - ${getSeatPrice(sectionData.section).toFixed(2)}
                        </h3>
                        {renderSeatsForSection(sectionData)}
                    </div>
                ))}
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
                    {seat.section} - {seat.row}{seat.seat} (${seat.price.toFixed(2)})
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
            ${selectedSeats.length > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={handleConfirmAndProceed}
          disabled={selectedSeats.length === 0 || isLoading}
        >
          {isLoading && selectedSeats.length > 0 ? ( // Show loading only when actually proceeding
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : selectedSeats.length > 0 ? (
            `Confirm Selection (${selectedSeats.length} ${selectedSeats.length === 1 ? "Seat" : "Seats"})`
          ) : (
            'Select Seats to Continue'
          )}
        </button>
      </div>
    </div>
  );
};

export default SeatSelectionPage;