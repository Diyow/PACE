import React from 'react';

const SectionConfigPanel = ({ section, onUpdate, ticketCategories }) => {
  if (!section) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <svg className="w-16 h-16 text-sky-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Section Selected</h3>
          <p className="text-gray-500 max-w-xs">Click on any section in the seating layout to configure its details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-sky-800">Configure Section {section.id}</h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
            <input
              type="text"
              value={section.name}
              onChange={(e) => onUpdate({ ...section, name: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Category</label>
            <select
              value={section.pricing.category}
              onChange={(e) => onUpdate({ 
                ...section, 
                pricing: { ...section.pricing, category: e.target.value } 
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors"
            >
              {ticketCategories.map(category => (
                <option key={category.category} value={category.category}>
                  {category.category} ({category.price})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rows</label>
            <input
              type="number"
              min="1"
              max="20"
              value={section.rows}
              onChange={(e) => onUpdate({ ...section, rows: parseInt(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seats Per Row</label>
            <input
              type="number"
              min="1"
              max="50"
              value={section.seatsPerRow}
              onChange={(e) => onUpdate({ ...section, seatsPerRow: parseInt(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starting Seat Number</label>
            <input
              type="number"
              min="1"
              value={section.startingSeatNumber}
              onChange={(e) => onUpdate({ ...section, startingSeatNumber: parseInt(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-sky-50 rounded-md border border-sky-100">
          <h4 className="font-medium text-sky-800 mb-2">Section Summary</h4>
          <p className="text-sm text-sky-700">
            <span className="block mb-1"><span className="font-semibold">Section:</span> {section.id} ({section.name})</span>
            <span className="block mb-1"><span className="font-semibold">Configuration:</span> {section.rows} rows with {section.seatsPerRow} seats each</span>
            <span className="block mb-1"><span className="font-semibold">Starting seat:</span> #{section.startingSeatNumber}</span>
            <span className="block mb-1"><span className="font-semibold">Total capacity:</span> {section.rows * section.seatsPerRow} seats</span>
            <span className="block"><span className="font-semibold">Price category:</span> {section.pricing.category}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SectionConfigPanel;