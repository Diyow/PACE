'use client';
import React from 'react';
import { TagIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const PromotionalCodes = ({
  promoCodes,
  newPromoCode,
  editingPromoCode,
  onNewPromoCodeChange,
  onAddOrUpdatePromoCode,
  onEditPromoCode,
  onDeletePromoCode,
  onCancelEditPromoCode,
  isLoading,
  inputClass,
  labelClass,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-sky-700 mb-4 flex items-center">
          <TagIcon className="h-6 w-6 mr-2" /> {editingPromoCode ? "Edit" : "Add New"} Promotional Code
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="promoCode" className={labelClass}>Promo Code</label>
            <input
              type="text"
              id="promoCode"
              name="code"
              value={newPromoCode.code}
              onChange={onNewPromoCodeChange}
              placeholder="e.g., SUMMER20"
              className={inputClass} />
          </div>
          <div>
            <label htmlFor="discountType" className={labelClass}>Discount Type</label>
            <select
              id="discountType"
              name="discountType"
              value={newPromoCode.discountType}
              onChange={onNewPromoCodeChange}
              className={inputClass}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <div>
            <label htmlFor="discountValue" className={labelClass}>Discount Value</label>
            <input
              type="number"
              id="discountValue"
              name="discountValue"
              value={newPromoCode.discountValue}
              onChange={onNewPromoCodeChange}
              placeholder={newPromoCode.discountType === 'percentage' ? "e.g., 10 for 10%" : "e.g., 5 for $5"}
              min="0"
              step="0.01"
              className={inputClass} />
          </div>
          <div>
            <label htmlFor="maxUses" className={labelClass}>Max Uses (optional)</label>
            <input
              type="number"
              id="maxUses"
              name="maxUses"
              value={newPromoCode.maxUses}
              onChange={onNewPromoCodeChange}
              placeholder="e.g., 100"
              min="1"
              className={inputClass} />
          </div>
          <div>
            <label htmlFor="expiryDate" className={labelClass}>Expiry Date (optional)</label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={newPromoCode.expiryDate}
              onChange={onNewPromoCodeChange}
              className={inputClass} />
          </div>
          <button
            onClick={onAddOrUpdatePromoCode}
            disabled={isLoading}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-md h-10 transition-colors disabled:opacity-50">
            {isLoading ? "Saving..." : (editingPromoCode ? "Update Code" : "Add Code")}
          </button>
        </div>
        {editingPromoCode && (
          <button
            onClick={onCancelEditPromoCode}
            className="mt-2 text-sm text-gray-600 hover:text-sky-700">
            Cancel Edit
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-sky-700 mb-4">Existing Promotional Codes</h3>
        {promoCodes.length > 0 ? (
          <ul className="space-y-3">
            {promoCodes.map((pc) => (
              <li key={pc.id || pc._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                <div>
                  <span className="font-mono text-gray-800 bg-gray-200 px-2 py-1 rounded-sm text-sm">{pc.code}</span>
                  <span className="text-gray-600 ml-2 text-sm">
                    ({pc.discountType === 'percentage' ? `${pc.discountValue}%` : `$${parseFloat(pc.discountValue).toFixed(2)}`} off)
                  </span>
                  {pc.expiryDate && <span className="text-xs text-gray-500 ml-2">(Expires: {new Date(pc.expiryDate).toLocaleDateString()})</span>}
                </div>
                <div className="space-x-2">
                  <button onClick={() => onEditPromoCode(pc)} className="text-sky-600 hover:text-sky-800 p-1"><PencilIcon className="h-5 w-5" /></button>
                  <button onClick={() => onDeletePromoCode(pc.id || pc._id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-gray-500">No promotional codes created yet.</p>}
      </div>
    </div>
  );
};

export default PromotionalCodes;