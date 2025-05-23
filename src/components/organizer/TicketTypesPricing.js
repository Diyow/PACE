'use client';
import React from 'react';
import { TicketIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const TicketTypesPricing = ({
  ticketTypes,
  newTicketType,
  editingTicketType,
  onNewTicketTypeChange,
  onAddOrUpdateTicketType,
  onEditTicketType,
  onDeleteTicketType,
  onCancelEditTicketType,
  isLoading,
  inputClass,
  labelClass,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-sky-700 mb-4 flex items-center">
          <TicketIcon className="h-6 w-6 mr-2" /> {editingTicketType ? "Edit" : "Add New"} Ticket Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="categoryName" className={labelClass}>Category Name (e.g., VIP, General)</label>
            <input
              type="text"
              id="categoryName"
              name="categoryName"
              value={newTicketType.categoryName}
              onChange={onNewTicketTypeChange}
              placeholder="e.g., General Admission"
              className={inputClass} />
          </div>
          <div>
            <label htmlFor="price" className={labelClass}>Price ($)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={newTicketType.price}
              onChange={onNewTicketTypeChange}
              placeholder="e.g., 50"
              min="0"
              step="0.01"
              className={inputClass} />
          </div>
          <button
            onClick={onAddOrUpdateTicketType}
            disabled={isLoading}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-md h-10 transition-colors disabled:opacity-50">
            {isLoading ? "Saving..." : (editingTicketType ? "Update Type" : "Add Type")}
          </button>
        </div>
        {editingTicketType && (
          <button
            onClick={onCancelEditTicketType}
            className="mt-2 text-sm text-gray-600 hover:text-sky-700">
            Cancel Edit
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-sky-700 mb-4">Existing Ticket Types</h3>
        {ticketTypes.length > 0 ? (
          <ul className="space-y-3">
            {ticketTypes.map((tt) => (
              <li key={tt.id || tt._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                <div>
                  <span className="font-medium text-gray-800">{tt.categoryName || tt.category}</span>
                  <span className="text-gray-600 ml-2">(${parseFloat(tt.price).toFixed(2)})</span>
                </div>
                <div className="space-x-2">
                  <button onClick={() => onEditTicketType(tt)} className="text-sky-600 hover:text-sky-800 p-1"><PencilIcon className="h-5 w-5" /></button>
                  <button onClick={() => onDeleteTicketType(tt.id || tt._id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-gray-500">No ticket types defined yet.</p>}
      </div>
    </div>
  );
};

export default TicketTypesPricing;