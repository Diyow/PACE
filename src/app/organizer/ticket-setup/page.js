'use client';

import React, { useState, useEffect } from 'react';
import SeatingLayoutEditor from '@/components/SeatingLayoutEditor';
import SectionConfigPanel from '@/components/SectionConfigPanel';
import SeatingPreview from '@/components/SeatingPreview';
import { defaultTheaterLayout } from './seatingModel';

// Add this import
import { useRouter, useSearchParams } from 'next/navigation';

const TicketSetupPage = () => {
  const [ticketCategories, setTicketCategories] = useState([
    { category: 'VIP', price: '100$', seat: 'A15-A33' },
    { category: 'Regular', price: '50$', seat: 'B15-B34' },
  ]);
  const [newCategory, setNewCategory] = useState('');
  const [newPriceInput, setNewPriceInput] = useState('');
  const [activeTab, setActiveTab] = useState('categories');
  const [seatingLayout, setSeatingLayout] = useState(defaultTheaterLayout);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch event data');
        }
        
        const eventData = await response.json();
        
        if (eventData.seatingLayout && eventData.seatingLayout.length > 0) {
          setSeatingLayout(eventData.seatingLayout);
        }
        
        if (eventData.ticketCategories && eventData.ticketCategories.length > 0) {
          setTicketCategories(eventData.ticketCategories);
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
        setErrorMessage('Failed to load event data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);

  const handleAddCategory = () => {
    if (newCategory && newPriceInput) {
      const formattedPrice = `${newPriceInput}$`;
      setTicketCategories([...ticketCategories, { category: newCategory, price: formattedPrice, seat: 'Not Selected' }]);
      setNewCategory('');
      setNewPriceInput('');
      setSuccessMessage('Category added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage('Category name and price are required.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleDeleteCategory = (index) => {
    const updatedCategories = ticketCategories.filter((_, i) => i !== index);
    setTicketCategories(updatedCategories);
    setSuccessMessage('Category deleted successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  const handleSectionSelect = (section) => {
    setSelectedSection(section);
  };
  
  const handleSectionUpdate = (updatedSection) => {
    setSeatingLayout(prevLayout => 
      prevLayout.map(section => 
        section.id === updatedSection.id ? updatedSection : section
      )
    );
  };

  const handleSave = async () => {
    const venueConfig = {
      ticketCategories,
      seatingLayout
    };
    
    try {
      setIsLoading(true);
      let url = '/api/events';
      let method = 'POST';
      
      if (eventId) {
        url = `/api/events/${eventId}/tickets`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(venueConfig),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save venue configuration');
      }
      
      setSuccessMessage('Venue configuration saved successfully!');
      
      setTimeout(() => {
        if (eventId) {
          router.push(`/organizer/edit-event/${eventId}`);
        } else {
          router.push('/organizer/create-event');
        }
      }, 1500);
    } catch (error) {
      console.error('Error saving venue configuration:', error);
      setErrorMessage('Failed to save venue configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (eventId) {
      router.push(`/organizer/edit-event/${eventId}`);
    } else {
      router.push('/organizer/create-event');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-sky-800">Ticket Setup {eventId ? '- Edit Mode' : ''}</h2>
        <p className="text-sky-600">Configure seating layout and ticket categories for your event</p>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md shadow-lg flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-sky-200">
        <nav className="-mb-px flex space-x-6">
          <button 
            onClick={() => setActiveTab('categories')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'categories' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-sky-700 hover:border-sky-300'}`}
          >
            Ticket Categories
          </button>
          <button 
            onClick={() => setActiveTab('seating')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'seating' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-sky-700 hover:border-sky-300'}`}
          >
            Seating Layout
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category Form */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-medium text-sky-800 mb-4">Add Ticket Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <select
                  id="categoryName"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  <option value="VIP">VIP</option>
                  <option value="Premium">Premium</option>
                  <option value="Regular">Regular</option>
                  <option value="Economy">Economy</option>
                  <option value="Student">Student</option>
                </select>
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  id="price"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors"
                  value={newPriceInput}
                  onChange={(e) => setNewPriceInput(e.target.value)}
                  placeholder="Enter price"
                  min="0"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddCategory}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>

          {/* Categories Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-sky-800">Ticket Categories</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ticketCategories.length > 0 ? (
                    ticketCategories.map((ticket, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteCategory(index)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                        No ticket categories added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seating' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <SeatingLayoutEditor 
                onSectionSelect={handleSectionSelect} 
                selectedSection={selectedSection} 
                layout={seatingLayout}
              />
              
              <SeatingPreview 
                layout={seatingLayout} 
                ticketCategories={ticketCategories} 
              />
            </div>
            
            <SectionConfigPanel 
              section={selectedSection} 
              onUpdate={handleSectionUpdate} 
              ticketCategories={ticketCategories} 
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-8">
        <button
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default TicketSetupPage;