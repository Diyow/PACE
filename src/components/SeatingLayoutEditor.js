import React, { useState, useEffect } from 'react';
import { defaultTheaterLayout } from '../app/organizer/ticket-setup/seatingModel';

const SeatingLayoutEditor = ({ onSectionSelect, selectedSection }) => {
  const [layout, setLayout] = useState(defaultTheaterLayout);
  const [scale, setScale] = useState(1);
  
  // Handle zoom in/out
  const handleZoom = (zoomIn) => {
    setScale(prev => zoomIn ? Math.min(prev + 0.1, 2) : Math.max(prev - 0.1, 0.5));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold">Seating Layout</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => handleZoom(false)}
            className="bg-gray-200 p-2 rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={() => handleZoom(true)}
            className="bg-gray-200 p-2 rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="overflow-auto border border-gray-200 rounded-md p-4 bg-gray-50" style={{ height: '400px' }}>
        <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.2s' }}>
          {/* Stage */}
          <div className="w-full flex justify-center mb-6">
            <div className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-bold text-center w-1/3">
              STAGE
            </div>
          </div>
          
          {/* Main seating area (A-K) */}
          <div className="flex flex-wrap justify-center mb-8">
            {layout.slice(0, 10).map((section) => (
              <div 
                key={section.id} 
                className={`m-1 p-2 rounded-md cursor-pointer transition-colors ${selectedSection?.id === section.id ? 'bg-blue-200 border-2 border-blue-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                onClick={() => onSectionSelect(section)}
              >
                <div className="text-center font-bold">{section.id}</div>
                <div className="text-xs text-center">{section.rows} rows</div>
              </div>
            ))}
          </div>
          
          {/* Balcony area (AA-EE) */}
          <div className="mt-8 pt-4 border-t border-gray-300">
            <div className="text-center font-semibold mb-2">BALCONY</div>
            <div className="flex flex-wrap justify-center">
              {layout.slice(10).map((section) => (
                <div 
                  key={section.id} 
                  className={`m-1 p-2 rounded-md cursor-pointer transition-colors ${selectedSection?.id === section.id ? 'bg-blue-200 border-2 border-blue-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                  onClick={() => onSectionSelect(section)}
                >
                  <div className="text-center font-bold">{section.id}</div>
                  <div className="text-xs text-center">{section.rows} rows</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingLayoutEditor;