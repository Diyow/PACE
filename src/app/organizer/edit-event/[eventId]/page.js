// src/app/organizer/edit-event/[eventId]/page.js
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  EyeIcon,
  PhotoIcon,
  ArrowPathIcon,
  TicketIcon,
  KeyIcon,
  MapIcon, // Using MapIcon for Seating
  CheckCircleIcon, // For success messages
  ExclamationCircleIcon, // For error messages
  DocumentTextIcon, // For save all button
} from '@heroicons/react/24/outline';
import RoleGuard from '@/components/RoleGuard';
import EventBasicInfo from '@/components/organizer/EventBasicInfo';
import TicketTypesPricing from '@/components/organizer/TicketTypesPricing';
import SeatingArrangement from '@/components/organizer/SeatingArrangement';
import PromotionalCodes from '@/components/organizer/PromotionalCodes';
import { toast } from 'react-hot-toast';
import { initialSeatingLayout as predefinedSeatingLayout } from '@/app/seat-selection/seatingData';

const EditEventPage = () => {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId;

  // Basic Info State
  const [eventData, setEventData] = useState({
    eventName: '',
    date: '',
    time: '',
    description: '',
  });
  const [eventPoster, setEventPoster] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [initialPosterUrl, setInitialPosterUrl] = useState(null);


  // Ticket Types State
  const [ticketTypes, setTicketTypes] = useState([]);
  const [newTicketType, setNewTicketType] = useState({ categoryName: '', price: '' });
  const [editingTicketType, setEditingTicketType] = useState(null);

  // Seating Arrangement State
  const [sectionTicketTypeMap, setSectionTicketTypeMap] = useState({});
  const [selectedVisualSection, setSelectedVisualSection] = useState(null);

  // Promo Codes State
  const [promoCodes, setPromoCodes] = useState([]);
  const [newPromoCode, setNewPromoCode] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '',
    expiryDate: '',
  });
  const [editingPromoCode, setEditingPromoCode] = useState(null);

  // General State
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  const DEFAULT_TICKET_CATEGORY_NAME = "Regular";
  const DEFAULT_TICKET_PRICE = "10.00";


  const inputClass = "w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors py-2 px-3";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";


  const formattedDate = eventData.date ? new Date(eventData.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '';

  const fetchEventData = useCallback(async () => {
    if (!eventId) {
      setFetchLoading(false);
      // If it's a new event scenario (though this page is for edit, good for robustness)
      // Initialize sectionTicketTypeMap for a fresh setup
      const initialMap = {};
      predefinedSeatingLayout.forEach(section => {
        initialMap[section.section] = ''; // No default assignment on initial load
      });
      setSectionTicketTypeMap(initialMap);
      return;
    }
    setFetchLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event data');
      const data = await response.json();
      setEventData({
        eventName: data.name || '',
        date: data.date || '',
        time: data.time || '',
        description: data.description || '',
      });
      if (data.posterUrl) {
        setPreviewUrl(data.posterUrl);
        setInitialPosterUrl(data.posterUrl);
      } else {
        setPreviewUrl(null);
        setInitialPosterUrl(null);
      }

      // Fetch related ticket and seating data
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
      const savedSeatingLayout = data.seatingLayout || [];
      predefinedSeatingLayout.forEach(visualSection => {
        const savedSectionData = savedSeatingLayout.find(s => s.section === visualSection.section);
        initialMap[visualSection.section] = savedSectionData?.assignedticketCategories || '';
      });
      setSectionTicketTypeMap(initialMap);

    } catch (err) {
      console.error('Error fetching event data:', err);
      toast.error(err.message || 'Failed to load event data.');
    } finally {
      setFetchLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);


  const handleBasicInfoInputChange = (event) => {
    const { name, value } = event.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handlePosterChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setEventPoster(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemovePoster = () => {
    setEventPoster(null);
    setPreviewUrl(null);
  };

  // --- Ticket Types Handlers ---
  const handleNewTicketTypeChange = (e) => {
    const { name, value } = e.target;
    setNewTicketType(prev => ({ ...prev, [name]: value }));
  };

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

    setIsSavingAll(true); // Indicate loading for any save operation
    try {
      const payload = { category: newTicketType.categoryName, price, eventId };
      let response;
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
      await fetchEventData(); // Re-fetch to update list and ensure seating can use new IDs
      toast.success(`Ticket type ${editingTicketType ? 'updated' : 'added'}!`);
      setNewTicketType({ categoryName: '', price: '' });
      setEditingTicketType(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleEditTicketType = (ticketType) => {
    setEditingTicketType(ticketType);
    setNewTicketType({ categoryName: ticketType.categoryName || ticketType.category, price: ticketType.price.toString() });
  };

  const handleDeleteTicketType = async (ticketTypeIdToDelete) => {
    if (!confirm("Are you sure you want to delete this ticket type? This will also unassign it from any seating sections.")) return;
    setIsSavingAll(true);
    try {
      const response = await fetch(`/api/ticket-types/${ticketTypeIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete ticket type");
      }
      // Update local state immediately for UI responsiveness
      setTicketTypes(prev => prev.filter(tt => (tt.id || tt._id) !== ticketTypeIdToDelete));
      setSectionTicketTypeMap(prevMap => {
        const newMap = { ...prevMap };
        for (const sectionName in newMap) {
          if (newMap[sectionName] === ticketTypeIdToDelete) {
            newMap[sectionName] = ''; // Unassign
          }
        }
        return newMap;
      });
      toast.success("Ticket type deleted! Save all configurations to persist seating changes.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSavingAll(false);
    }
  };
  const handleCancelEditTicketType = () => {
    setEditingTicketType(null);
    setNewTicketType({ categoryName: '', price: '' });
  }

  // --- Seating Arrangement Handlers ---
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
  const handleDoneWithSection = () => {
      setSelectedVisualSection(null);
  }

  // --- Promo Codes Handlers ---
  const handleNewPromoCodeChange = (e) => {
    const { name, value } = e.target;
    setNewPromoCode(prev => ({ ...prev, [name]: name === 'code' ? value.toUpperCase() : value }));
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
    setIsSavingAll(true);
    try {
      const payload = { ...newPromoCode, discountValue, eventId, maxUses: newPromoCode.maxUses ? parseInt(newPromoCode.maxUses) : null };
      let response;
      if (editingPromoCode) {
        response = await fetch(`/api/promo-codes/${editingPromoCode.id || editingPromoCode._id}`, { // Ensure API endpoint exists for PUT
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/promo-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingPromoCode ? 'update' : 'add'} promo code`);
      }
      await fetchEventData(); // Re-fetch
      toast.success(`Promo code ${editingPromoCode ? 'updated' : 'added'}!`);
      setNewPromoCode({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: '' });
      setEditingPromoCode(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSavingAll(false);
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
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    setIsSavingAll(true);
    try {
        const response = await fetch(`/api/promo-codes/${promoCodeId}`, { method: 'DELETE' }); // Ensure API endpoint exists
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete promo code");
        }
        await fetchEventData(); // Re-fetch
        toast.success("Promo code deleted!");
    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsSavingAll(false);
    }
  };
  const handleCancelEditPromoCode = () => {
    setEditingPromoCode(null);
    setNewPromoCode({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: '' });
  };

  // --- Save All Configurations ---
  const handleSaveAllConfigurations = async () => {
    if (!eventId) {
      toast.error("Event ID is missing. Cannot save configurations.");
      return;
    }
    setIsSavingAll(true);
    let currentErrors = [];
    let currentSuccesses = [];

    // Step 1: Save Basic Event Info
    const basicInfoFormData = new FormData();
    basicInfoFormData.append('eventName', eventData.eventName);
    basicInfoFormData.append('date', eventData.date);
    basicInfoFormData.append('time', eventData.time);
    basicInfoFormData.append('description', eventData.description);
    if (eventPoster) {
      basicInfoFormData.append('poster', eventPoster);
    } else if (!previewUrl && initialPosterUrl) {
      basicInfoFormData.append('posterUrl', ''); // Signal to remove poster
    }
    // Append existing seating and ticket categories to ensure they are not wiped out by basic info update
    // if the PUT /api/events/[eventId] expects them or overwrites them.
    // This depends heavily on how your PUT /api/events/[eventId] is implemented.
    // For safety, we might need to fetch fresh event data before this step if basic info can be edited separately.
    // However, for a "Save All", it's assumed we're saving the current state.

    try {
      const basicInfoResponse = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        body: basicInfoFormData,
      });
      if (!basicInfoResponse.ok) {
        const errorData = await basicInfoResponse.json();
        currentErrors.push(errorData.error || 'Failed to save basic event information');
      } else {
        currentSuccesses.push('Basic event information saved.');
        const updatedEventData = await basicInfoResponse.json();
         if (updatedEventData.event && updatedEventData.event.posterUrl) {
            setInitialPosterUrl(updatedEventData.event.posterUrl);
            setPreviewUrl(updatedEventData.event.posterUrl);
        } else if (basicInfoFormData.get('posterUrl') === '') {
            setInitialPosterUrl(null);
            setPreviewUrl(null);
        }
        setEventPoster(null);
      }
    } catch (e) {
      currentErrors.push(`Error saving basic info: ${e.message}`);
    }

    // Step 2: Manage Ticket Types (Create default if none exist)
    let currentTicketTypes = [...ticketTypes];
    let defaultTicketTypeId = null;

    if (currentTicketTypes.length === 0) {
      try {
        const defaultTicketPayload = { category: DEFAULT_TICKET_CATEGORY_NAME, price: parseFloat(DEFAULT_TICKET_PRICE), eventId };
        const ttResponse = await fetch('/api/ticket-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(defaultTicketPayload),
        });
        if (!ttResponse.ok) {
          const errorData = await ttResponse.json();
          currentErrors.push(errorData.error || 'Failed to create default ticket type');
        } else {
          const savedDefaultTicket = await ttResponse.json();
          defaultTicketTypeId = savedDefaultTicket.ticketTypeId;
          // Add to local state for seating assignment
          currentTicketTypes.push({ ...defaultTicketPayload, id: defaultTicketTypeId, categoryName: DEFAULT_TICKET_CATEGORY_NAME });
          currentSuccesses.push('Default ticket type "Regular" created.');
        }
      } catch (e) {
        currentErrors.push(`Error creating default ticket type: ${e.message}`);
      }
    }
     // Ensure all current ticket types are persisted (if any were added/edited but not individually saved through their component buttons)
    // This part is tricky with a single "Save All" if individual C/U is also possible.
    // For now, we assume ticket types are managed by their individual buttons,
    // and this "Save All" mainly persists the *assignment* to seating.
    // If ticketTypes array changed significantly, those changes should ideally be PUT/POSTed individually first,
    // or the event API needs to handle a full array of ticket types.

    // Step 3: Prepare and Save Seating Arrangement Assignments
    const finalSeatingLayoutAssignments = predefinedSeatingLayout.map(section => {
      let assignedCategory = sectionTicketTypeMap[section.section] || '';
      if (!assignedCategory && defaultTicketTypeId) { // If no assignment and default was created
        assignedCategory = defaultTicketTypeId;
      } else if (!assignedCategory && currentTicketTypes.length > 0) { // If no assignment and other types exist, use first as fallback
         const regularOrFirstType = currentTicketTypes.find(tt => (tt.categoryName || tt.category) === DEFAULT_TICKET_CATEGORY_NAME) || currentTicketTypes[0];
         if(regularOrFirstType) assignedCategory = regularOrFirstType.id || regularOrFirstType._id;
      }
      return {
        section: section.section,
        rows: section.rows,
        style: section.style,
        assignedticketCategories: assignedCategory || null
      };
    });

    const ticketsAndSeatingPayload = {
      seatingLayout: finalSeatingLayoutAssignments,
      // Optionally, send the full list of ticketCategories if your API updates/replaces them for the event
      // ticketCategories: currentTicketTypes.map(tt => ({ category: tt.categoryName || tt.category, price: tt.price, eventId, _id: tt.id || tt._id /* if updating existing */ }))
    };

    try {
      const seatingResponse = await fetch(`/api/events/${eventId}/tickets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketsAndSeatingPayload),
      });
      if (!seatingResponse.ok) {
        const errorData = await seatingResponse.json();
        currentErrors.push(errorData.error || "Failed to save seating configuration");
      } else {
        currentSuccesses.push('Seating configuration saved.');
      }
    } catch (e) {
      currentErrors.push(`Error saving seating configuration: ${e.message}`);
    }
    
    // Promo codes are managed by their own buttons. If "Save All" needs to batch save them,
    // it would require sending the `promoCodes` array to a specific backend endpoint for the event.

    if (currentErrors.length > 0) {
      toast.error(<div>Errors occurred:<ul>{currentErrors.map((err, i) => <li key={i}>- {err}</li>)}</ul></div>, { duration: 6000 });
    }
    if (currentSuccesses.length > 0 && currentErrors.length === 0) {
      toast.success("All configurations saved successfully!");
    } else if (currentSuccesses.length > 0) {
      toast.success(<div>Saved some parts:<ul>{currentSuccesses.map((succ, i) => <li key={i}>- {succ}</li>)}</ul></div>, { duration: 5000 });
    }

    await fetchEventData(); // Refresh all data from backend
    setIsSavingAll(false);
  };


  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
        <ArrowPathIcon className="h-12 w-12 text-sky-500 animate-spin" />
        <p className="ml-3 text-sky-700">Loading event details...</p>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['organizer', 'admin']}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto mb-8">
          <button
            onClick={() => router.push('/organizer/dashboard')}
            className="flex items-center text-sky-600 hover:text-sky-700 mb-6 transition-colors font-medium"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="mt-2 text-gray-600">Update your event details, tickets, seating, and promo codes.</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-2 sm:space-x-4 px-3 sm:px-6 overflow-x-auto" aria-label="Tabs">
                  {[
                    { name: 'Basic Info', tab: 'basic', icon: EyeIcon },
                    { name: 'Tickets & Pricing', tab: 'ticketTypes', icon: TicketIcon },
                    { name: 'Seating', tab: 'seatingArrangement', icon: MapIcon },
                    { name: 'Promo Codes', tab: 'promoCodes', icon: KeyIcon },
                  ].map((item) => (
                    <button
                      key={item.tab}
                      onClick={() => setActiveTab(item.tab)}
                      className={`whitespace-nowrap py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm focus:outline-none flex items-center gap-1.5
                        ${activeTab === item.tab
                          ? 'border-sky-500 text-sky-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      {item.name}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6 md:p-8">
                {/* Content for each tab */}
                {activeTab === 'basic' && (
                    <EventBasicInfo
                      eventData={eventData}
                      onInputChange={handleBasicInfoInputChange}
                      onPosterChange={handlePosterChange}
                      previewUrl={previewUrl}
                      onRemovePoster={handleRemovePoster}
                    />
                )}
                {activeTab === 'ticketTypes' && (
                  <TicketTypesPricing
                    ticketTypes={ticketTypes}
                    newTicketType={newTicketType}
                    editingTicketType={editingTicketType}
                    onNewTicketTypeChange={handleNewTicketTypeChange}
                    onAddOrUpdateTicketType={handleAddOrUpdateTicketType}
                    onEditTicketType={handleEditTicketType}
                    onDeleteTicketType={handleDeleteTicketType}
                    onCancelEditTicketType={handleCancelEditTicketType}
                    isLoading={isSavingAll}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                )}
                {activeTab === 'seatingArrangement' && (
                  <SeatingArrangement
                    ticketTypes={ticketTypes}
                    sectionTicketTypeMap={sectionTicketTypeMap}
                    selectedVisualSection={selectedVisualSection}
                    onVisualSectionSelect={handleVisualSectionSelect}
                    onAssignTicketTypeToSection={assignTicketTypeToSection}
                    onDoneWithSection={handleDoneWithSection}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                )}
                {activeTab === 'promoCodes' && (
                  <PromotionalCodes
                    promoCodes={promoCodes}
                    newPromoCode={newPromoCode}
                    editingPromoCode={editingPromoCode}
                    onNewPromoCodeChange={handleNewPromoCodeChange}
                    onAddOrUpdatePromoCode={handleAddOrUpdatePromoCode}
                    onEditPromoCode={handleEditPromoCode}
                    onDeletePromoCode={handleDeletePromoCode}
                    onCancelEditPromoCode={handleCancelEditPromoCode}
                    isLoading={isSavingAll}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                )}
              </div>
            </div>

            {/* Event Preview Section */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
                  <div className="flex items-center mb-4">
                    <EyeIcon className="h-6 w-6 text-sky-500 mr-2" />
                    <h3 className="text-xl font-medium text-gray-900">Event Preview</h3>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-sky-100 transform hover:scale-[1.02]">
                    <div className="aspect-[4/3] bg-gradient-to-br from-sky-50 to-blue-50 relative">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Event poster preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 transition-colors">
                          <div className="text-center">
                            <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
                            <p>Event Poster</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-medium text-gray-900 transition-colors">
                        {eventData.eventName || 'Event Name'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {formattedDate || 'Event Date'} {eventData.time ? `at ${eventData.time}` : ''}
                      </p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                        {eventData.description || 'Event description will appear here...'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>This is how your event will appear to users Browse events.</p>
                  </div>
                </div>
                 {/* Save All Button */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2 text-sky-600" />
                        Publish Changes
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Ensure all event details, ticket prices, seating arrangements, and promotional codes are correctly configured before saving.
                    </p>
                    <button
                        type="button"
                        onClick={handleSaveAllConfigurations}
                        disabled={isSavingAll || fetchLoading}
                        className={`w-full inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                                    ${isSavingAll || fetchLoading ? 'opacity-50 cursor-not-allowed' : 'transform transition hover:-translate-y-0.5'}`}
                    >
                        {isSavingAll ? (
                            <>
                                <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                                Saving All...
                            </>
                        ) : (
                           'Save All Event Configurations'
                        )}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default EditEventPage;