import React, { useState } from 'react';

const SeatingLayoutEditor = ({ onSectionSelect, selectedSection, layout }) => {
  const [scale, setScale] = useState(1);
  
  // Handle zoom in/out
  const handleZoom = (zoomIn) => {
    setScale(prev => zoomIn ? Math.min(prev + 0.1, 2) : Math.max(prev - 0.1, 0.5));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-sky-800">Seating Layout Editor</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => handleZoom(false)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={() => handleZoom(true)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="overflow-auto p-4 bg-sky-50" style={{ height: '400px' }}>
        <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.2s' }}>
          {/* Stage */}
          <div className="w-full flex justify-center mb-6">
            <div className="bg-sky-200 text-sky-800 py-2 px-4 rounded-md font-bold text-center w-1/3 shadow-sm">
              STAGE
            </div>
          </div>
          
          {/* Main seating area (A-K) */}
          <div className="flex flex-wrap justify-center mb-8">
            {layout.slice(0, 10).map((section) => (
              <div 
                key={section.id} 
                className={`m-1 p-2 rounded-md cursor-pointer transition-colors ${selectedSection?.id === section.id ? 'bg-sky-200 border-2 border-sky-500 shadow-md' : 'bg-white hover:bg-sky-100 border border-gray-200'}`}
                onClick={() => onSectionSelect(section)}
              >
                <div className="text-center font-bold text-sky-800">{section.id}</div>
                <div className="text-xs text-center text-gray-600">{section.rows} rows</div>
              </div>
            ))}
          </div>
          
          {/* Balcony area (AA-EE) */}
          <div className="mt-8 pt-4 border-t border-gray-300">
            <div className="text-center font-semibold mb-2 text-sky-700">BALCONY</div>
            <div className="flex flex-wrap justify-center">
              {layout.slice(10).map((section) => (
                <div 
                  key={section.id} 
                  className={`m-1 p-2 rounded-md cursor-pointer transition-colors ${selectedSection?.id === section.id ? 'bg-sky-200 border-2 border-sky-500 shadow-md' : 'bg-white hover:bg-sky-100 border border-gray-200'}`}
                  onClick={() => onSectionSelect(section)}
                >
                  <div className="text-center font-bold text-sky-800">{section.id}</div>
                  <div className="text-xs text-center text-gray-600">{section.rows} rows</div>
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