// src/app/organizer/edit-event/[eventId]/page.js
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation'; // Added useSearchParams
import {
  ArrowLeftIcon,
  EyeIcon,
  PhotoIcon,
  ArrowPathIcon,
  TicketIcon,
  KeyIcon,
  MapIcon, 
  DocumentTextIcon,
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
  const queryParams = useSearchParams(); // To read query parameters
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
      toast.error("Event ID is missing.");
      router.push('/organizer/dashboard'); // Redirect if no eventId
      return;
    }
    setFetchLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Event not found.');
        throw new Error('Failed to fetch event data');
      }
      const data = await response.json();
      setEventData({
        eventName: data.name || '',
        date: data.date ? data.date.split('T')[0] : '', // Ensure date is in YYYY-MM-DD format for input
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
      if (err.message === 'Event not found.') {
        router.push('/organizer/dashboard');
      }
    } finally {
      setFetchLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchEventData();
    const tabFromQuery = queryParams.get('tab');
    if (tabFromQuery) {
        setActiveTab(tabFromQuery);
    }
  }, [fetchEventData, queryParams]);


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
    setPreviewUrl(null); // This signals removal to the backend if initialPosterUrl existed
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

    // Use a general loading state for individual actions too for consistency
    const generalLoadingSetter = setIsSavingAll; // Or a new dedicated state if preferred
    generalLoadingSetter(true);
    try {
      const payload = { category: newTicketType.categoryName, price, eventId };
      let response;
      if (editingTicketType) {
        response = await fetch(`/api/ticket-types/${editingTicketType.id || editingTicketType._id}`, {
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
      await fetchEventData(); 
      toast.success(`Ticket type ${editingTicketType ? 'updated' : 'added'}!`);
      setNewTicketType({ categoryName: '', price: '' });
      setEditingTicketType(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      generalLoadingSetter(false);
    }
  };

  const handleEditTicketType = (ticketType) => {
    setEditingTicketType(ticketType);
    setNewTicketType({ categoryName: ticketType.categoryName || ticketType.category, price: ticketType.price.toString() });
  };

  const handleDeleteTicketType = async (ticketTypeIdToDelete) => {
    if (!confirm("Are you sure you want to delete this ticket type? This will also unassign it from any seating sections.")) return;
    const generalLoadingSetter = setIsSavingAll;
    generalLoadingSetter(true);
    try {
      const response = await fetch(`/api/ticket-types/${ticketTypeIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete ticket type");
      }
      // Re-fetch data to update UI correctly, including seating map
      await fetchEventData();
      toast.success("Ticket type deleted!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      generalLoadingSetter(false);
    }
  };
  const handleCancelEditTicketType = () => {
    setEditingTicketType(null);
    setNewTicketType({ categoryName: '', price: '' });
  };

  // --- Seating Arrangement Handlers ---
  const handleVisualSectionSelect = (sectionName) => setSelectedVisualSection(sectionName);
  const assignTicketTypeToSection = (ticketTypeId) => {
    if (selectedVisualSection) {
      setSectionTicketTypeMap(prev => ({ ...prev, [selectedVisualSection]: ticketTypeId }));
    }
  };
  const handleDoneWithSection = () => setSelectedVisualSection(null);

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
    const generalLoadingSetter = setIsSavingAll;
    generalLoadingSetter(true);
    try {
      const payload = { ...newPromoCode, discountValue, eventId, maxUses: newPromoCode.maxUses ? parseInt(newPromoCode.maxUses) : null };
      let response;
      if (editingPromoCode) {
        response = await fetch(`/api/promo-codes/${editingPromoCode.id || editingPromoCode._id}`, {
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
      await fetchEventData(); 
      toast.success(`Promo code ${editingPromoCode ? 'updated' : 'added'}!`);
      setNewPromoCode({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: '' });
      setEditingPromoCode(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      generalLoadingSetter(false);
    }
  };

  const handleEditPromoCode = (promoCode) => {
    setEditingPromoCode(promoCode);
    setNewPromoCode({
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue.toString(),
      maxUses: promoCode.maxUses?.toString() || '',
      expiryDate: promoCode.expiryDate ? new Date(promoCode.expiryDate).toISOString().split('T')[0] : ''
    });
  };

  const handleDeletePromoCode = async (promoCodeId) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    const generalLoadingSetter = setIsSavingAll;
    generalLoadingSetter(true);
    try {
        const response = await fetch(`/api/promo-codes/${promoCodeId}`, { method: 'DELETE' }); 
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete promo code");
        }
        await fetchEventData();
        toast.success("Promo code deleted!");
    } catch (error) {
        toast.error(error.message);
    } finally {
        generalLoadingSetter(false);
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
    } else if (!previewUrl && initialPosterUrl) { // If previewUrl is null and there was an initial poster, it means remove
      basicInfoFormData.append('posterUrl', ''); // Signal to backend to remove poster
    }
    // If posterUrl is not null and no new eventPoster, the backend should keep the existing initialPosterUrl

    try {
      const basicInfoResponse = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        body: basicInfoFormData,
      });
      const updatedEventResponse = await basicInfoResponse.json();
      if (!basicInfoResponse.ok) {
        currentErrors.push(updatedEventResponse.error || 'Failed to save basic event information');
      } else {
        currentSuccesses.push('Basic event information saved.');
         if (updatedEventResponse.event && updatedEventResponse.event.posterUrl) {
            setInitialPosterUrl(updatedEventResponse.event.posterUrl); // Update initialPosterUrl with the one from DB
            setPreviewUrl(updatedEventResponse.event.posterUrl);
        } else if (basicInfoFormData.get('posterUrl') === '') { // If removal was signaled and successful
            setInitialPosterUrl(null);
            setPreviewUrl(null);
        }
        setEventPoster(null); // Clear staged file
      }
    } catch (e) {
      currentErrors.push(`Error saving basic info: ${e.message}`);
    }
    
    // Step 2: Ticket Types and Promo Codes are assumed to be managed by their individual buttons
    // which already make API calls. The "Save All" focuses on basic info and seating assignments.
    // If you need "Save All" to also batch-update ticket types/promo codes that were changed locally
    // but not submitted via their own buttons, the logic here and in the backend would need to be more complex.

    // Step 3: Prepare and Save Seating Arrangement Assignments
    let currentTicketTypesForSeating = [...ticketTypes]; // Use the latest state of ticketTypes
    let defaultTicketTypeIdForSeating = null;

    if (currentTicketTypesForSeating.length === 0) {
      // If user deleted all ticket types, we might need to handle how seating is saved.
      // For now, if a section was assigned to a now-deleted type, it will be unassigned.
      // If you want a default to be created, that logic would go here or in the backend.
      // Consider creating a default "Regular" ticket type if none exist and sections need assignment.
      // This part is complex if user can delete all types then hit "save all".
      // For now, we'll proceed with currentTicketTypesForSeating as is.
    } else {
        const regularOrFirstType = currentTicketTypesForSeating.find(tt => (tt.categoryName || tt.category) === DEFAULT_TICKET_CATEGORY_NAME) || currentTicketTypesForSeating[0];
        if(regularOrFirstType) defaultTicketTypeIdForSeating = regularOrFirstType.id || regularOrFirstType._id;
    }

    const finalSeatingLayoutAssignments = predefinedSeatingLayout.map(section => {
      let assignedCategoryId = sectionTicketTypeMap[section.section] || '';
      
      // If the section is unassigned, but we have ticket types, assign the default/first one.
      if (!assignedCategoryId && defaultTicketTypeIdForSeating) {
          assignedCategoryId = defaultTicketTypeIdForSeating;
      }
      // If the assigned category ID is no longer in our currentTicketTypes (e.g., was deleted), unassign it.
      if (assignedCategoryId && !currentTicketTypesForSeating.find(tt => (tt.id || tt._id) === assignedCategoryId)) {
          assignedCategoryId = '';
      }

      return {
        section: section.section,
        rows: section.rows, // Keep original rows structure
        style: section.style, // Keep original style
        assignedticketCategories: assignedCategoryId || null // Send actual ID of the ticket type
      };
    });

    const ticketsAndSeatingPayload = {
      seatingLayout: finalSeatingLayoutAssignments,
      // ticketCategories: currentTicketTypesForSeating.map(tt => ({ // Only send if API updates/replaces all
      //   _id: tt.id || tt._id, // Include ID for existing types
      //   category: tt.categoryName || tt.category,
      //   price: tt.price,
      //   eventId // Ensure eventId is associated
      // }))
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
    
    setIsSavingAll(false); // Set loading to false before toast and redirect

    if (currentErrors.length > 0) {
      const errorMessages = currentErrors.map((err, i) => <li key={i}>- {err}</li>);
      toast.error(<div>Errors occurred:<ul>{errorMessages}</ul></div>, { duration: 7000 });
    }
    // Only redirect if all parts were successful or if only non-critical parts had issues
    // For now, redirect if at least basic info and seating were successful.
    if (currentSuccesses.includes('Basic event information saved.') && currentSuccesses.includes('Seating configuration saved.') && currentErrors.length === 0) {
      toast.success("All configurations saved successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.push('/organizer/dashboard');
      }, 2000);
    } else if (currentSuccesses.length > 0) {
       const successMessages = currentSuccesses.map((succ, i) => <li key={i}>- {succ}</li>);
       toast.success(<div>Saved some parts:<ul>{successMessages}</ul></div>, { duration: 5000 });
       await fetchEventData(); // Refresh data if not redirecting fully
    } else if (currentErrors.length === 0 && currentSuccesses.length === 0) {
        toast.info("No changes detected to save."); // Or handle as a success if no changes were made
    }


    // await fetchEventData(); // Refresh all data from backend - moved to only if not fully successful redirect
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
                    isLoading={isSavingAll} // Use general saving state for individual button loading
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
                    isLoading={isSavingAll} // Use general saving state
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
                    <p>This is how your event will appear to users.</p>
                  </div>
                </div>
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
                        className={`w-full inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 
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