// src/app/organizer/edit-event/[eventId]/page.js
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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

const generateTempId = () => `temp_${Math.random().toString(36).substr(2, 9)}`;

const EditEventPage = () => {
  const router = useRouter();
  const params = useParams();
  const queryParams = useSearchParams();
  const eventId = params.eventId;

  const [eventData, setEventData] = useState({
    eventName: '',
    date: '',
    time: '',
    description: '',
  });
  const [eventPoster, setEventPoster] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [initialPosterUrl, setInitialPosterUrl] = useState(null);

  const [uiTicketTypes, setUiTicketTypes] = useState([]);
  const [newTicketType, setNewTicketType] = useState({ categoryName: '', price: '' });
  const [editingTicketType, setEditingTicketType] = useState(null);

  const [sectionTicketTypeMap, setSectionTicketTypeMap] = useState({});
  const [selectedVisualSection, setSelectedVisualSection] = useState(null);

  const [promoCodes, setPromoCodes] = useState([]);
  const [newPromoCode, setNewPromoCode] = useState({
    code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: '',
  });
  const [editingPromoCode, setEditingPromoCode] = useState(null); 

  const [isSavingAll, setIsSavingAll] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  const inputClass = "w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors py-2 px-3";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const formattedDate = eventData.date ? new Date(eventData.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }) : '';

  const fetchEventData = useCallback(async () => {
    if (!eventId) {
      toast.error("Event ID is missing.");
      router.push('/organizer/dashboard');
      return;
    }
    setFetchLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Event not found.');
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch event data');
      }
      const data = await response.json();

      setEventData({
        ...data,
        eventName: data.name || '',
        date: data.date ? data.date.split('T')[0] : '',
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

      setUiTicketTypes((data.ticketCategories || []).map(tc => ({
        id: tc._id || generateTempId(), 
        categoryName: tc.category, 
        price: tc.price
      })));

      const promoCodesRes = await fetch(`/api/promo-codes?eventId=${eventId}`);
      if (!promoCodesRes.ok) throw new Error('Failed to fetch promo codes for event.');
      const promoCodesData = await promoCodesRes.json();
      setPromoCodes(promoCodesData.map(pc => ({ 
          ...pc, 
          id: pc._id, 
          expiryDate: pc.expiryDate ? new Date(pc.expiryDate).toISOString().split('T')[0] : '' 
      })));

      const initialMap = {};
      const savedSeatingLayout = data.seatingLayout || [];
      predefinedSeatingLayout.forEach(visualSection => {
        const savedSectionData = savedSeatingLayout.find(s => s.section === visualSection.section);
        initialMap[visualSection.section] = savedSectionData?.assignedCategoryName || '';
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
    if (eventId) {
      fetchEventData();
    }
    const tabFromQuery = queryParams.get('tab');
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    }
  }, [eventId, fetchEventData, queryParams]);


  const handleBasicInfoInputChange = (event) => {
    const { name, value } = event.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handlePosterChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setEventPoster(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePoster = () => {
    setEventPoster(null);
    setPreviewUrl(null);
  };

  const handleNewTicketTypeChange = (e) => {
    const { name, value } = e.target;
    setNewTicketType(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateTicketType = () => {
    if (!newTicketType.categoryName || !newTicketType.price) {
      toast.error("Category name and price are required.");
      return;
    }
    const price = parseFloat(newTicketType.price);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid positive price.");
      return;
    }

    if (editingTicketType) {
      setUiTicketTypes(uiTicketTypes.map(tt =>
        tt.id === editingTicketType.id
          ? { ...tt, categoryName: newTicketType.categoryName, price: price }
          : tt
      ));
      toast.success("Ticket type updated locally.");
    } else {
      setUiTicketTypes([...uiTicketTypes, { ...newTicketType, price: price, id: generateTempId() }]);
      toast.success("Ticket type added locally.");
    }
    setNewTicketType({ categoryName: '', price: '' });
    setEditingTicketType(null);
  };

  const handleEditTicketType = (ticketType) => {
    setEditingTicketType(ticketType);
    setNewTicketType({ categoryName: ticketType.categoryName, price: ticketType.price.toString() });
  };

  const handleDeleteTicketType = (ticketTypeIdToDelete) => {
    if (!confirm("Are you sure you want to delete this ticket type? This will also unassign it from any seating sections.")) return;
    const typeToDelete = uiTicketTypes.find(tt => tt.id === ticketTypeIdToDelete);
    setUiTicketTypes(prev => prev.filter(tt => tt.id !== ticketTypeIdToDelete));
    if (typeToDelete) {
        setSectionTicketTypeMap(prevMap => {
            const newMap = { ...prevMap };
            for (const sectionName in newMap) {
              if (newMap[sectionName] === typeToDelete.categoryName) {
                newMap[sectionName] = '';
              }
            }
            return newMap;
          });
    }
    toast.success("Ticket type removed locally.");
    if (editingTicketType && editingTicketType.id === ticketTypeIdToDelete) {
        setNewTicketType({ categoryName: '', price: '' });
        setEditingTicketType(null);
    }
  };

  const handleCancelEditTicketType = () => {
    setEditingTicketType(null);
    setNewTicketType({ categoryName: '', price: '' });
  };

  const handleVisualSectionSelect = (sectionName) => setSelectedVisualSection(sectionName);

  const assignTicketTypeToSection = (ticketTypeCategoryName) => { 
    if (selectedVisualSection) {
      setSectionTicketTypeMap(prev => ({ ...prev, [selectedVisualSection]: ticketTypeCategoryName }));
    }
  };
  const handleDoneWithSection = () => setSelectedVisualSection(null);

  const handleNewPromoCodeChange = (e) => {
    const { name, value } = e.target;
    setNewPromoCode(prev => ({ ...prev, [name]: name === 'code' ? value.toUpperCase() : value }));
  };

  const handleAddOrUpdatePromoCodeLocal = () => {
    if (!newPromoCode.code || !newPromoCode.discountValue) {
      toast.error("Code and discount value are required."); return;
    }
    const discountValue = parseFloat(newPromoCode.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      toast.error("Please enter a valid positive discount value."); return;
    }
    if (newPromoCode.discountType === 'percentage' && discountValue > 100) {
      toast.error("Percentage discount cannot exceed 100."); return;
    }

    const codeExists = promoCodes.some(pc => 
        pc.code.toLowerCase() === newPromoCode.code.toLowerCase() &&
        (!editingPromoCode || pc.id !== editingPromoCode.id)
    );
    if (codeExists) {
        toast.error(`Promo code "${newPromoCode.code}" already exists for this event.`);
        return;
    }

    if (editingPromoCode) {
      setPromoCodes(promoCodes.map(pc =>
        pc.id === editingPromoCode.id
          ? { ...editingPromoCode, ...newPromoCode, discountValue } 
          : pc
      ));
      toast.success("Promo code updated locally.");
    } else {
      setPromoCodes([...promoCodes, { ...newPromoCode, discountValue, id: generateTempId(), _isNew: true }]); 
      toast.success("Promo code added locally.");
    }
    setNewPromoCode({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: '' });
    setEditingPromoCode(null);
  };

  const handleEditPromoCodeLocal = (promoCode) => {
    setEditingPromoCode(promoCode);
    setNewPromoCode({
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue.toString(),
      maxUses: promoCode.maxUses?.toString() || '',
      expiryDate: promoCode.expiryDate ? (promoCode.expiryDate.includes('T') ? promoCode.expiryDate.split('T')[0] : promoCode.expiryDate) : ''
    });
  };

  const handleDeletePromoCodeLocal = (promoCodeIdToDelete) => {
    if (!confirm("Are you sure you want to delete this promo code? This change will be saved when you publish all configurations.")) return;
    setPromoCodes(prev => prev.filter(pc => pc.id !== promoCodeIdToDelete));
    toast.success("Promo code removed locally.");
    if (editingPromoCode && editingPromoCode.id === promoCodeIdToDelete) {
        handleCancelEditPromoCodeLocal();
    }
  };

  const handleCancelEditPromoCodeLocal = () => {
    setEditingPromoCode(null);
    setNewPromoCode({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: '' });
  };


  const handleSaveAllConfigurations = async () => {
    if (!eventId) {
      toast.error("Event ID is missing. Cannot save configurations.");
      return;
    }
    setIsSavingAll(true);

    const payloadFormData = new FormData();
    // MODIFIED LINE for eventName:
    payloadFormData.append('eventName', eventData.eventName); // Use eventData.eventName directly

    payloadFormData.append('date', eventData.date);
    payloadFormData.append('time', eventData.time);
    payloadFormData.append('description', eventData.description);
    if (eventPoster) {
      payloadFormData.append('poster', eventPoster);
    } else if (!previewUrl && initialPosterUrl) {
      payloadFormData.append('removePoster', 'true');
    }

    const finalTicketCategories = uiTicketTypes.map(tt => ({
      category: tt.categoryName,
      price: parseFloat(tt.price)
    }));
    payloadFormData.append('ticketCategories', JSON.stringify(finalTicketCategories));

    const finalSeatingLayout = predefinedSeatingLayout.map(section => ({
      section: section.section,
      rows: section.rows,
      style: section.style,
      assignedCategoryName: sectionTicketTypeMap[section.section] || null // Sends null for unassigned
    }));
    payloadFormData.append('seatingLayout', JSON.stringify(finalSeatingLayout));

    const processedPromoCodes = promoCodes.map(pc => {
      const { id, _isNew, ...rest } = pc;
      const codePayload = { ...rest };
      if (!_isNew && id) { 
        codePayload._id = id;
      }
      return codePayload;
    });
    payloadFormData.append('promoCodes', JSON.stringify(processedPromoCodes));


    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        body: payloadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save event configurations");
      }

      toast.success("Event configurations saved successfully!");
      setEventPoster(null); 
      // router.push will be called after fetchEventData if you keep it,
      // or you can remove fetchEventData if immediate redirect is preferred.
      await fetchEventData(); // Re-fetch data to update UI if not redirecting immediately
      router.push('/organizer/dashboard'); 

    } catch (error) {
      console.error('Error saving configurations:', error);
      toast.error(error.message);
    } finally {
      setIsSavingAll(false);
    }
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
                    ticketTypes={uiTicketTypes}
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
                    ticketTypes={uiTicketTypes}
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
                    onAddOrUpdatePromoCode={handleAddOrUpdatePromoCodeLocal}
                    onEditPromoCode={handleEditPromoCodeLocal}
                    onDeletePromoCode={handleDeletePromoCodeLocal}
                    onCancelEditPromoCode={handleCancelEditPromoCodeLocal}
                    isLoading={isSavingAll}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                )}
              </div>
            </div>

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
                        {eventData.eventName || (eventData.name || 'Event Name')}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {formattedDate || 'Event Date'} {eventData.time ? `at ${eventData.time}` : ''}
                      </p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                        {eventData.description || 'Event description will appear here...'}
                      </p>
                    </div>
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
                            <> <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> Saving All... </>
                        ) : ( 'Save All Event Configurations' )}
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