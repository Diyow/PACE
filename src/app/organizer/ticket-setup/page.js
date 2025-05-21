'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import SeatingLayoutEditor from '@/components/SeatingLayoutEditor';
import SectionConfigPanel from '@/components/SectionConfigPanel';
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
  const [selectedSeat, setSelectedSeat] = useState('');
  const [activeTab, setActiveTab] = useState('categories');
  const [seatingLayout, setSeatingLayout] = useState(defaultTheaterLayout);
  const [selectedSection, setSelectedSection] = useState(null);
  
  const handleAddCategory = () => {
    if (newCategory && newPriceInput) {
      const formattedPrice = `${newPriceInput}$`;
      setTicketCategories([...ticketCategories, { category: newCategory, price: formattedPrice, seat: selectedSeat || 'Not Selected' }]);
      setNewCategory('');
      setNewPriceInput('');
      setSelectedSeat('');
    } else {
      alert('Category name and price are required.');
    }
  };

  const handlePriceInputChange = (e) => {
    setNewPriceInput(e.target.value);
  };

  const handleSelectSeat = () => {
    setActiveTab('seating');
  };

  const handleEditCategory = (index) => {
    alert(`Edit category at index ${index}`);
    // Implementasikan logika edit
  };

  const handleDeleteCategory = (index) => {
    const updatedCategories = ticketCategories.filter((_, i) => i !== index);
    setTicketCategories(updatedCategories);
  };

  // In the component
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  // Add this useEffect to fetch existing data if editing an existing event
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;
      
      try {
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch event data');
        }
        
        const eventData = await response.json();
        
        // Set seating layout and ticket categories if available
        if (eventData.seatingLayout && eventData.seatingLayout.length > 0) {
          setSeatingLayout(eventData.seatingLayout);
        }
        
        if (eventData.ticketCategories && eventData.ticketCategories.length > 0) {
          setTicketCategories(eventData.ticketCategories);
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
        alert('Failed to load event data. Please try again.');
      }
    };
    
    fetchEventData();
  }, [eventId]);

  // Update the handleSave function
  const handleSave = async () => {
    // Create the data structure to save
    const venueConfig = {
      ticketCategories,
      seatingLayout
    };
    
    try {
      let url = '/api/events';
      let method = 'POST';
      
      // If editing an existing event, use the update endpoint
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
      
      alert('Venue configuration saved successfully!');
      
      // Redirect to the appropriate page
      if (eventId) {
        router.push(`/organizer/edit-event/${eventId}`);
      } else {
        router.push('/organizer/create-event');
      }
    } catch (error) {
      console.error('Error saving venue configuration:', error);
      alert('Failed to save venue configuration. Please try again.');
    }
  };

  const handleCancel = () => {
    alert('Changes cancelled.');
    // Implement cancel logic
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

  return (
    <>
      <Head>
        <title>Ticket Setup - PACE</title>
      </Head>
      <div className="p-6 bg-gray-50 rounded-md min-h-screen">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Ticket Setup</h2>

        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-4">
            <button 
              onClick={() => setActiveTab('categories')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'categories' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Ticket categories
            </button>
            <button 
              onClick={() => setActiveTab('seating')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'seating' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Seating Assignment
            </button>
            <button 
              onClick={() => setActiveTab('promo')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'promo' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Promotional Codes
            </button>
          </nav>
        </div>

        {activeTab === 'categories' && (
          <>
            <div className="bg-white rounded-md shadow-sm p-6 mb-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-1/4">
                  <label htmlFor="categoryName" className="block text-gray-700 text-sm font-bold mb-2">
                    Category name
                  </label>
                  <select
                    id="categoryName"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    <option value="VIP">VIP</option>
                    <option value="Regular">Regular</option>
                    <option value="Economy">Economy</option>
                  </select>
                  <button
                    onClick={handleAddCategory}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2 w-full"
                  >
                    Add
                  </button>
                </div>
                <div className="w-1/4">
                  <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    id="price"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={newPriceInput}
                    onChange={handlePriceInputChange}
                  />
                </div>
                <div className="w-1/4">
                  <label htmlFor="seat" className="block text-gray-700 text-sm font-bold mb-2">
                    Seat
                  </label>
                  <button
                    onClick={handleSelectSeat}
                    className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                  >
                    {selectedSeat || 'Select Seat'}
                  </button>
                </div>
                <div className="w-1/4">
                  {/* Ruang kosong untuk menjaga layout tetap konsisten */}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      CATEGORY
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      PRICE
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SEAT
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ticketCategories.map((ticket, index) => (
                    <tr key={index}>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-800">
                        {ticket.category}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-800">
                        {ticket.price}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-800">
                        {ticket.seat}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleEditCategory(index)}
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15.828 9 18.75V17h2.086l9.414-9.414a2 2 0 11-2.828-2.828L9.172 13.172v-5.086z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'seating' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SeatingLayoutEditor 
              onSectionSelect={handleSectionSelect} 
              selectedSection={selectedSection} 
            />
            <SectionConfigPanel 
              section={selectedSection} 
              onUpdate={handleSectionUpdate} 
              ticketCategories={ticketCategories} 
            />
          </div>
        )}

        {activeTab === 'promo' && (
          <div className="bg-white rounded-md shadow-sm p-6">
            <p className="text-gray-500 italic">Promotional codes feature coming soon...</p>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={handleCancel}
            className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
};

export default TicketSetupPage;