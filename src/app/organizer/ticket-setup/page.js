'use client';

import React, { useState } from 'react';
import Head from 'next/head';

const TicketSetupPage = () => {
  const [ticketCategories, setTicketCategories] = useState([
    { category: 'VIP', price: '100$', seat: 'A15-A33' },
    { category: 'Regular', price: '50$', seat: 'B15-B34' },
  ]);
  const [newCategory, setNewCategory] = useState('');
  const [newPriceInput, setNewPriceInput] = useState(''); // State untuk input harga tanpa dolar
  const [selectedSeat, setSelectedSeat] = useState('');

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
    alert('Seat selection logic will be implemented here.');
    // Implementasikan logika pemilihan kursi dan update selectedSeat
  };

  const handleEditCategory = (index) => {
    alert(`Edit category at index ${index}`);
    // Implementasikan logika edit
  };

  const handleDeleteCategory = (index) => {
    const updatedCategories = ticketCategories.filter((_, i) => i !== index);
    setTicketCategories(updatedCategories);
  };

  const handleSave = () => {
    console.log('Saving ticket configuration:', ticketCategories);
    alert('Ticket configuration saved!');
    // Implementasikan logika penyimpanan
  };

  const handleCancel = () => {
    alert('Changes cancelled.');
    // Implementasikan logika pembatalan
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
            <button className="whitespace-nowrap py-4 px-1 border-b-2 border-indigo-500 font-medium text-sm text-indigo-600 focus:outline-none">
              Ticket categories
            </button>
            <button className="whitespace-nowrap py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none">
              Seating Assignment
            </button>
            <button className="whitespace-nowrap py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none">
              Promotional Codes
            </button>
          </nav>
        </div>

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
                {/* Tambahkan opsi lain sesuai kebutuhan */}
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

        <div className="flex justify-end space-x-2">
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