'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initialSeatingLayout as predefinedSeatingLayout } from '../../seat-selection/seatingData'; // Use the layout from seat-selection
import { toast } from 'react-hot-toast';
import {
  TicketIcon,
  CurrencyDollarIcon,
  PlusCircleIcon,
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  TagIcon,
  CalendarDaysIcon,
  KeyIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Helper to generate a simple ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const TicketSetupPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [activeTab, setActiveTab] = useState('ticketTypes'); // 'ticketTypes', 'seatingArrangement', 'promoCodes'

  // State for Ticket Types
  const [ticketTypes, setTicketTypes] = useState([]);
  const [newTicketType, setNewTicketType] = useState({ categoryName: '', price: '' });
  const [editingTicketType, setEditingTicketType] = useState(null); // { id, categoryName, price }

  // State for Seating Arrangement
  const [sectionTicketTypeMap, setSectionTicketTypeMap] = useState({});
  const [selectedVisualSection, setSelectedVisualSection] = useState(null); // Stores the name of the section clicked

  // State for Promotional Codes
  const [promoCodes, setPromoCodes] = useState([]);
  const [newPromoCode, setNewPromoCode] = useState({
    code: '',
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: '',
    maxUses: '',
    expiryDate: '',
  });
  const [editingPromoCode, setEditingPromoCode] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!eventId);

  const fetchEventSetupData = useCallback(async () => {
    if (!eventId) {
      setIsFetching(false);
      const initialMap = {};
      predefinedSeatingLayout.forEach(section => {
        initialMap[section.section] = '';
      });
      setSectionTicketTypeMap(initialMap);
      return;
    }

    setIsFetching(true);
    try {
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (!eventRes.ok) throw new Error('Failed to fetch event details');
      const eventData = await eventRes.json();

      const [ticketTypesRes, promoCodesRes] = await Promise.all([
        fetch(`/api/ticket-types?eventId=${eventId}`),
        fetch(`/api/promo-codes?eventId=${eventId}`)
      ]);

      if (!ticketTypesRes.ok) throw new Error('Failed to fetch ticket types');
      const ticketTypesData = await ticketTypesRes.json();
      setTicketTypes(ticketTypesData.map(tt => ({ ...tt, id: tt._id, categoryName: tt.category })));

      if (!promoCodesRes.ok) throw new Error('Failed to fetch promo codes');
      const promoCodesData = await promoCodesRes.json();
      setPromoCodes(promoCodesData.map(pc => ({ ...pc, id: pc._id, expiryDate: pc.expiryDate ? new Date(pc.expiryDate).toISOString().split('T')[0] : '' })));

      const initialMap = {};
      const savedSeatingLayout = eventData.seatingLayout || []; // This is the layout that has section-to-ticketType assignments
      
      predefinedSeatingLayout.forEach(visualSection => {
        const savedSectionData = savedSeatingLayout.find(s => s.section === visualSection.section);
        initialMap[visualSection.section] = savedSectionData?.assignedticketCategories || '';
      });
      setSectionTicketTypeMap(initialMap);

    } catch (error) {
      console.error("Error fetching event setup data:", error);
      toast.error(error.message || "Failed to load event configuration.");
    } finally {
      setIsFetching(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventSetupData();
  }, [fetchEventSetupData]);

  const handleAddOrUpdateTicketType = async () => {
    if (!newTicketType.categoryName || !newTicketType.price) {
      toast.error("Category name and price are required.");
      return;
    }
    const price = parseFloat(newTicketType.price);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid positive price.");
      return;
    }

    setIsLoading(true);
    try {
      let response;
      // API expects 'category' not 'categoryName'
      const payload = { category: newTicketType.categoryName, price, eventId }; 

      if (editingTicketType) {
        response = await fetch(`/api/ticket-types/${editingTicketType.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/ticket-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingTicketType ? 'update' : 'add'} ticket type`);
      }
      
      const savedData = await response.json();

      if (editingTicketType) {
        setTicketTypes(ticketTypes.map(tt => tt.id === editingTicketType.id ? { ...payload, id: editingTicketType.id, categoryName: payload.category } : tt));
        toast.success("Ticket type updated!");
      } else {
        setTicketTypes([...ticketTypes, { ...payload, id: savedData.ticketTypeId || generateId(), categoryName: payload.category }]);
        toast.success("Ticket type added!");
      }
      setNewTicketType({ categoryName: '', price: '' });
      setEditingTicketType(null);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTicketType = (ticketType) => {
    setEditingTicketType(ticketType);
    setNewTicketType({ categoryName: ticketType.categoryName || ticketType.category, price: ticketType.price.toString() });
  };

  const handleDeleteTicketType = async (ticketTypeId) => {
    if (!confirm("Are you sure you want to delete this ticket type?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ticket-types/${ticketTypeId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete ticket type");
      }
      setTicketTypes(ticketTypes.filter(tt => tt.id !== ticketTypeId));
      const newMap = { ...sectionTicketTypeMap };
      for (const sectionName in newMap) {
        if (newMap[sectionName] === ticketTypeId) {
          newMap[sectionName] = '';
        }
      }
      setSectionTicketTypeMap(newMap);
      toast.success("Ticket type deleted!");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualSectionSelect = (sectionName) => {
    setSelectedVisualSection(sectionName);
  };

  const assignTicketTypeToSection = (ticketTypeId) => {
    if (selectedVisualSection) {
      setSectionTicketTypeMap(prev => ({
        ...prev,
        [selectedVisualSection]: ticketTypeId
      }));
    }
  };
  
  const handleAddOrUpdatePromoCode = async () => {
    if (!newPromoCode.code || !newPromoCode.discountValue) {
      toast.error("Code and discount value are required.");
      return;
    }
    const discountValue = parseFloat(newPromoCode.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      toast.error("Please enter a valid positive discount value.");
      return;
    }
    if (newPromoCode.discountType === 'percentage' && discountValue > 100) {
        toast.error("Percentage discount cannot exceed 100.");
        return;
    }

    setIsLoading(true);
    try {
      let response;
      const payload = { ...newPromoCode, discountValue, eventId, maxUses: newPromoCode.maxUses ? parseInt(newPromoCode.maxUses) : null };
      
      if (editingPromoCode) {
        // TODO: Implement PUT /api/promo-codes/[promoCodeId] if needed
        // This API might not exist yet in your backend setup based on provided files.
        // For now, it updates local state and shows a toast.
        const updatedPromoCodes = promoCodes.map(pc => 
          pc.id === editingPromoCode.id ? { ...payload, id: editingPromoCode.id } : pc
        );
        setPromoCodes(updatedPromoCodes);
        toast.success("Promo code updated locally (API update needed if not implemented).");
      } else {
         response = await fetch('/api/promo-codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to add promo code");
        }
        const savedPromoCode = await response.json();
        setPromoCodes([...promoCodes, { ...payload, id: savedPromoCode.promoCodeId || generateId() }]);
        toast.success("Promo code added!");
      }

      setNewPromoCode({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: '' });
      setEditingPromoCode(null);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditPromoCode = (promoCode) => {
    setEditingPromoCode(promoCode);
    setNewPromoCode({
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue.toString(),
      maxUses: promoCode.maxUses?.toString() || '',
      expiryDate: promoCode.expiryDate || ''
    });
  };

  const handleDeletePromoCode = async (promoCodeId) => {
    // TODO: Implement DELETE /api/promo-codes/[promoCodeId] if needed
    // For now, just remove from local state
    if (!confirm("Are you sure you want to delete this promo code? This action might require a dedicated API endpoint to persist.")) return;
    // const response = await fetch(`/api/promo-codes/${promoCodeId}`, { method: 'DELETE' });
    // if (!response.ok) { /* handle error */ }
    setPromoCodes(promoCodes.filter(pc => pc.id !== promoCodeId));
    toast.success("Promo code removed locally (API delete needed if not implemented).");
  };

  const handleSaveConfiguration = async () => {
    if (!eventId) {
      toast.error("Event ID is missing. Cannot save configuration.");
      return;
    }
    setIsLoading(true);
    try {
      // Prepare the seatingLayout with assigned ticketTypeIds
      const finalSeatingLayoutWithAssignments = predefinedSeatingLayout.map(section => ({
        section: section.section, // Keep the original section name
        rows: section.rows,       // Keep the original rows data
        style: section.style,     // Keep the original style
        assignedticketCategories: sectionTicketTypeMap[section.section] || null
      }));

      const payload = {
        ticketCategories: ticketTypes.map(({ id, _id, categoryName, ...rest}) => ({...rest, category: categoryName, eventId})), // API expects 'category'
        seatingLayout: finalSeatingLayoutWithAssignments,
      };
      
      const response = await fetch(`/api/events/${eventId}/tickets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save configuration");
      }

      // Promo codes should be saved via their own API when created/updated.
      // If you need a batch save for promo codes here, the backend API would need to support it.

      toast.success("Configuration saved successfully!");
      router.push(`/organizer/edit-event/${eventId}?tab=tickets`);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputClass = "w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors py-2 px-3";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-6 flex items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 text-sky-600 animate-spin" />
        <p className="ml-2 text-sky-700">Loading event configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-sky-800">Event Ticket & Seating Setup</h2>
            {eventId ? <p className="text-sm text-gray-600">Editing configuration for Event ID: {eventId}</p> : <p className="text-sm text-gray-600">Configure for a new event.</p>}
          </div>
           <button
            onClick={() => eventId ? router.push(`/organizer/edit-event/${eventId}`) : router.push('/organizer/create-event')}
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            &larr; Back to Event Details
          </button>
        </div>

        <div className="mb-6 border-b border-sky-200">
          <nav className="-mb-px flex space-x-6">
            {['ticketTypes', 'seatingArrangement', 'promoCodes'].map((tabName) => (
              <button
                key={tabName}
                onClick={() => setActiveTab(tabName)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors ${
                  activeTab === tabName ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-sky-700 hover:border-sky-300'
                }`}
              >
                {tabName === 'ticketTypes' && 'Ticket Types & Pricing'}
                {tabName === 'seatingArrangement' && 'Seating Arrangement'}
                {tabName === 'promoCodes' && 'Promotional Codes'}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'ticketTypes' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-sky-700 mb-4 flex items-center">
                <TicketIcon className="h-6 w-6 mr-2" /> {editingTicketType ? "Edit" : "Add New"} Ticket Type
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label htmlFor="categoryName" className={labelClass}>Category Name (e.g., VIP, General)</label>
                  <input type="text" id="categoryName" value={newTicketType.categoryName} onChange={(e) => setNewTicketType({...newTicketType, categoryName: e.target.value})} placeholder="e.g., General Admission" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="price" className={labelClass}>Price ($)</label>
                  <input type="number" id="price" value={newTicketType.price} onChange={(e) => setNewTicketType({...newTicketType, price: e.target.value})} placeholder="e.g., 50" min="0" step="0.01" className={inputClass} />
                </div>
                <button onClick={handleAddOrUpdateTicketType} disabled={isLoading} className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-md h-10 transition-colors disabled:opacity-50">
                  {isLoading ? "Saving..." : (editingTicketType ? "Update Type" : "Add Type")}
                </button>
              </div>
              {editingTicketType && <button onClick={() => {setEditingTicketType(null); setNewTicketType({categoryName: '', price: ''})}} className="mt-2 text-sm text-gray-600 hover:text-sky-700">Cancel Edit</button>}
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
                        <button onClick={() => handleEditTicketType(tt)} className="text-sky-600 hover:text-sky-800 p-1"><PencilIcon className="h-5 w-5"/></button>
                        <button onClick={() => handleDeleteTicketType(tt.id || tt._id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5"/></button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No ticket types defined yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'seatingArrangement' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-sky-700 mb-4">Assign Ticket Types to Sections</h3>
              <p className="text-sm text-gray-600 mb-4">Click on a section in the layout below to assign a ticket type to it.</p>
              
              <div className="bg-gray-100 p-4 rounded-md text-center text-gray-700 font-semibold mb-6 mx-auto" style={{width: 'fit-content', minWidth: '150px'}}>STAGE</div>
              
              {/* 3x2 Grid for Seating Sections */}
              <div className="grid grid-cols-3 gap-4">
                {predefinedSeatingLayout.map((section, sectionIdx) => (
                  <div key={sectionIdx} className="w-full">
                    <button
                      onClick={() => handleVisualSectionSelect(section.section)}
                      className={`p-3 border-2 rounded-md text-center text-sm w-full h-24 transition-all flex flex-col justify-center items-center
                                  ${selectedVisualSection === section.section ? 'border-sky-500 bg-sky-100 ring-2 ring-sky-500' : 'border-gray-300 hover:border-sky-400'}
                                  ${sectionTicketTypeMap[section.section] ? 'bg-green-100 border-green-400' : 'bg-white'}`}
                    >
                      <span>{section.section}</span>
                      {sectionTicketTypeMap[section.section] && ticketTypes.find(tt => (tt.id || tt._id) === sectionTicketTypeMap[section.section]) && (
                        <span className="block text-xs text-green-700 mt-1">
                          ({ticketTypes.find(tt => (tt.id || tt._id) === sectionTicketTypeMap[section.section]).categoryName || ticketTypes.find(tt => (tt.id || tt._id) === sectionTicketTypeMap[section.section]).category})
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {selectedVisualSection && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h4 className="text-lg font-semibold text-sky-600 mb-3">Configure: {selectedVisualSection}</h4>
                <label htmlFor="ticketTypeAssignment" className={labelClass}>Assign Ticket Type:</label>
                <select
                  id="ticketTypeAssignment"
                  value={sectionTicketTypeMap[selectedVisualSection] || ''}
                  onChange={(e) => assignTicketTypeToSection(e.target.value)}
                  className={`${inputClass} mb-4`}
                >
                  <option value="">-- Select Ticket Type --</option>
                  {ticketTypes.map(tt => (
                    <option key={tt.id || tt._id} value={tt.id || tt._id}>{tt.categoryName || tt.category} (${parseFloat(tt.price).toFixed(2)})</option>
                  ))}
                </select>
                <button onClick={() => setSelectedVisualSection(null)} className="text-sm text-gray-600 hover:text-sky-700 w-full text-center mt-2">Done with this section</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'promoCodes' && (
          // ... (promo code UI remains the same as previous response) ...
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-semibold text-sky-700 mb-4 flex items-center">
                    <TagIcon className="h-6 w-6 mr-2" /> {editingPromoCode ? "Edit" : "Add New"} Promotional Code
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="promoCode" className={labelClass}>Promo Code</label>
                        <input type="text" id="promoCode" value={newPromoCode.code} onChange={(e) => setNewPromoCode({...newPromoCode, code: e.target.value.toUpperCase()})} placeholder="e.g., SUMMER20" className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="discountType" className={labelClass}>Discount Type</label>
                        <select id="discountType" value={newPromoCode.discountType} onChange={(e) => setNewPromoCode({...newPromoCode, discountType: e.target.value})} className={inputClass}>
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="discountValue" className={labelClass}>Discount Value</label>
                        <input type="number" id="discountValue" value={newPromoCode.discountValue} onChange={(e) => setNewPromoCode({...newPromoCode, discountValue: e.target.value})} placeholder={newPromoCode.discountType === 'percentage' ? "e.g., 10 for 10%" : "e.g., 5 for $5"} min="0" step="0.01" className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="maxUses" className={labelClass}>Max Uses (optional)</label>
                        <input type="number" id="maxUses" value={newPromoCode.maxUses} onChange={(e) => setNewPromoCode({...newPromoCode, maxUses: e.target.value})} placeholder="e.g., 100" min="1" className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="expiryDate" className={labelClass}>Expiry Date (optional)</label>
                        <input type="date" id="expiryDate" value={newPromoCode.expiryDate} onChange={(e) => setNewPromoCode({...newPromoCode, expiryDate: e.target.value})} className={inputClass} />
                    </div>
                    <button onClick={handleAddOrUpdatePromoCode} disabled={isLoading} className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-md h-10 transition-colors disabled:opacity-50">
                       {isLoading ? "Saving..." : (editingPromoCode ? "Update Code" : "Add Code")}
                    </button>
                </div>
                 {editingPromoCode && <button onClick={() => {setEditingPromoCode(null); setNewPromoCode({code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: ''})}} className="mt-2 text-sm text-gray-600 hover:text-sky-700">Cancel Edit</button>}
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
                            <button onClick={() => handleEditPromoCode(pc)} className="text-sky-600 hover:text-sky-800 p-1"><PencilIcon className="h-5 w-5"/></button>
                            <button onClick={() => handleDeletePromoCode(pc.id || pc._id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                        </li>
                    ))}
                    </ul>
                ) : <p className="text-gray-500">No promotional codes created yet.</p>}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSaveConfiguration}
            disabled={isLoading || isFetching}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-md transition-colors disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save All Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketSetupPage;