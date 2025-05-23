'use client';
import React from 'react';
import { initialSeatingLayout as predefinedSeatingLayout } from '../../app/seat-selection/seatingData'; // Adjusted path

const SeatingArrangement = ({
  ticketTypes,
  sectionTicketTypeMap,
  selectedVisualSection,
  onVisualSectionSelect,
  onAssignTicketTypeToSection,
  onDoneWithSection,
  inputClass,
  labelClass,
}) => {

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
                  // This component is for assigning types, not selecting individual seats for purchase
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-sky-700 mb-4">Assign Ticket Types to Sections</h3>
        <p className="text-sm text-gray-600 mb-4">Click on a section in the layout below to assign a ticket type to it.</p>

        <div className="bg-gray-100 p-4 rounded-md text-center text-gray-700 font-semibold mb-6 mx-auto" style={{ width: 'fit-content', minWidth: '150px' }}>STAGE</div>

        <div className="grid grid-cols-3 gap-4">
          {predefinedSeatingLayout.map((section, sectionIdx) => (
            <div key={sectionIdx} className="w-full">
              <button
                onClick={() => onVisualSectionSelect(section.section)}
                className={`p-3 border-2 rounded-md text-center text-sm w-full h-24 transition-all flex flex-col justify-center items-center
                            ${selectedVisualSection === section.section ? 'border-sky-500 bg-sky-100 ring-2 ring-sky-500' : 'border-gray-300 hover:border-sky-400'}
                            ${sectionTicketTypeMap[section.section] ? 'bg-green-100 border-green-400' : 'bg-white'}`}
              >
                <span>{section.section}</span>
                {sectionTicketTypeMap[section.section] && ticketTypes.find(tt => (tt.id || tt._id) === sectionTicketTypeMap[section.section]) && (
                  <span className="block text-xs text-green-700 mt-1">
                    ({ticketTypes.find(tt => (tt.id || tt._id) === sectionTicketTypeMap[section.section]).categoryName || ticketTypes.find(tt => (tt.id || tt._id) === sectionTicketTypeMap[section.section]).category})
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedVisualSection && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h4 className="text-lg font-semibold text-sky-600 mb-3">Configure: {selectedVisualSection}</h4>
          <label htmlFor="ticketTypeAssignment" className={labelClass}>Assign Ticket Type:</label>
          <select
            id="ticketTypeAssignment"
            value={sectionTicketTypeMap[selectedVisualSection] || ''}
            onChange={(e) => onAssignTicketTypeToSection(e.target.value)}
            className={`${inputClass} mb-4`}
          >
            <option value="">-- Select Ticket Type --</option>
            {ticketTypes.map(tt => (
              <option key={tt.id || tt._id} value={tt.id || tt._id}>{tt.categoryName || tt.category} (${parseFloat(tt.price).toFixed(2)})</option>
            ))}
          </select>
          <button onClick={onDoneWithSection} className="text-sm text-gray-600 hover:text-sky-700 w-full text-center mt-2">Done with this section</button>
        </div>
      )}
    </div>
  );
};
export default SeatingArrangement;