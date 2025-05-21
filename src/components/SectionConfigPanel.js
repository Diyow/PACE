import React from 'react';

const SectionConfigPanel = ({ section, onUpdate, ticketCategories }) => {
  if (!section) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-gray-500 italic">Select a section to configure</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Configure Section {section.id}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
          <input
            type="text"
            value={section.name}
            onChange={(e) => onUpdate({ ...section, name: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {ticketCategories.map(category => (
              <option key={category.category} value={category.category}>
                {category.category} (${category.price.replace('$', '')})
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
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Starting Seat Number</label>
          <input
            type="number"
            min="1"
            value={section.startingSeatNumber}
            onChange={(e) => onUpdate({ ...section, startingSeatNumber: parseInt(e.target.value) })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-800 mb-2">Section Summary</h4>
        <p className="text-sm text-blue-700">
          Section {section.id} ({section.name}) will have {section.rows} rows with {section.seatsPerRow} seats each,
          starting from seat number {section.startingSeatNumber}.
          <br />
          Total capacity: <span className="font-bold">{section.rows * section.seatsPerRow} seats</span>
          <br />
          Price category: <span className="font-bold">{section.pricing.category}</span>
        </p>
      </div>
    </div>
  );
};

export default SectionConfigPanel;