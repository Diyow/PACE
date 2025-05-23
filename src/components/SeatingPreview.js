import React from 'react';

const SeatingPreview = ({ layout, ticketCategories }) => {
  // Create a color map for ticket categories
  const categoryColors = {};
  const baseColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
  
  ticketCategories.forEach((category, index) => {
    categoryColors[category.category] = baseColors[index % baseColors.length];
  });
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Customer Preview</h3>
      
      <div className="overflow-auto border border-gray-200 rounded-md p-4 bg-gray-50" style={{ height: '400px' }}>
        <div className="relative">
          {/* Stage */}
          <div className="w-full flex justify-center mb-6">
            <div className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-bold text-center w-1/3">
              STAGE
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {ticketCategories.map((category, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-1" 
                  style={{ backgroundColor: categoryColors[category.category] || '#CBD5E0' }}
                ></div>
                <span className="text-xs">{category.category} - {category.price}</span>
              </div>
            ))}
          </div>
          
          {/* Main seating area */}
          <div className="flex flex-wrap justify-center mb-8">
            {layout.slice(0, 10).map((section) => {
              const categoryColor = categoryColors[section.pricing.category] || '#CBD5E0';
              return (
                <div 
                  key={section.id} 
                  className="m-1 p-2 rounded-md text-white"
                  style={{ backgroundColor: categoryColor }}
                >
                  <div className="text-center font-bold">{section.id}</div>
                  <div className="text-xs text-center">{section.rows * section.seatsPerRow} seats</div>
                </div>
              );
            })}
          </div>
          
          {/* Balcony area */}
          <div className="mt-8 pt-4 border-t border-gray-300">
            <div className="text-center font-semibold mb-2">BALCONY</div>
            <div className="flex flex-wrap justify-center">
              {layout.slice(10).map((section) => {
                const categoryColor = categoryColors[section.pricing.category] || '#CBD5E0';
                return (
                  <div 
                    key={section.id} 
                    className="m-1 p-2 rounded-md text-white"
                    style={{ backgroundColor: categoryColor }}
                  >
                    <div className="text-center font-bold">{section.id}</div>
                    <div className="text-xs text-center">{section.rows * section.seatsPerRow} seats</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-800 mb-2">Venue Summary</h4>
        <p className="text-sm text-blue-700">
          Total sections: {layout.length}<br />
          Total capacity: {layout.reduce((sum, section) => sum + (section.rows * section.seatsPerRow), 0)} seats
        </p>
      </div>
    </div>
  );
};

export default SeatingPreview;