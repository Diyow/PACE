// src/app/organizer/create-event/page.js
'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

const CreateEventPage = () => {
  const router = useRouter();

  const [eventData, setEventData] = useState({
    eventName: '',
    date: '',
    time: '',
    description: '',
  });
  const [eventPoster, setEventPoster] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [ticketTypes, setTicketTypes] = useState([]);
  const [newTicketType, setNewTicketType] = useState({ categoryName: '', price: '' });
  const [editingTicketType, setEditingTicketType] = useState(null);

  const [sectionTicketTypeMap, setSectionTicketTypeMap] = useState(() => {
    const initialMap = {};
    predefinedSeatingLayout.forEach(section => {
      initialMap[section.section] = ''; 
    });
    return initialMap;
  });
  const [selectedVisualSection, setSelectedVisualSection] = useState(null);

  const [promoCodes, setPromoCodes] = useState([]);
  const [newPromoCode, setNewPromoCode] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '',
    expiryDate: '',
  });
  const [editingPromoCode, setEditingPromoCode] = useState(null);

  const [loading, setLoading] = useState(false);
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

  const handleNewTicketTypeChange = (e) => {
    const { name, value } = e.target;
    setNewTicketType(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateTicketTypeLocal = () => {
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
      setTicketTypes(ticketTypes.map(tt =>
        (tt.id || tt._id) === (editingTicketType.id || editingTicketType._id)
          ? { ...editingTicketType, categoryName: newTicketType.categoryName, price: price }
          : tt
      ));
      toast.success("Ticket type updated locally.");
    } else {
      if (ticketTypes.some(tt => tt.categoryName.toLowerCase() === newTicketType.categoryName.toLowerCase())) {
        toast.error(`Ticket type "${newTicketType.categoryName}" already exists.`);
        return;
      }
      setTicketTypes([...ticketTypes, { ...newTicketType, id: generateTempId(), price: price }]);
      toast.success("Ticket type added locally.");
    }
    setNewTicketType({ categoryName: '', price: '' });
    setEditingTicketType(null);
  };

  const handleEditTicketTypeLocal = (ticketType) => {
    setEditingTicketType(ticketType);
    setNewTicketType({ categoryName: ticketType.categoryName, price: ticketType.price.toString() });
  };

  const handleDeleteTicketTypeLocal = (ticketTypeIdToDelete) => {
    const typeToDelete = ticketTypes.find(tt => (tt.id || tt._id) === ticketTypeIdToDelete);
    if (!typeToDelete) return;

    setTicketTypes(prev => prev.filter(tt => (tt.id || tt._id) !== ticketTypeIdToDelete));
    
    setSectionTicketTypeMap(prevMap => {
      const newMap = { ...prevMap };
      for (const sectionName in newMap) {
        if (newMap[sectionName] === typeToDelete.categoryName) {
          newMap[sectionName] = ''; 
        }
      }
      return newMap;
    });
    toast.success(`Ticket type "${typeToDelete.categoryName}" removed locally. Unassigned sections will use the default type.`);
    if (editingTicketType && (editingTicketType.id || editingTicketType._id) === ticketTypeIdToDelete) {
        handleCancelEditTicketTypeLocal();
    }
  };

  const handleCancelEditTicketTypeLocal = () => {
    setEditingTicketType(null);
    setNewTicketType({ categoryName: '', price: '' });
  };

  const handleVisualSectionSelect = (sectionName) => setSelectedVisualSection(sectionName);
  
  const assignTicketTypeToSection = (categoryName) => {
    if (selectedVisualSection) {
      setSectionTicketTypeMap(prev => ({ ...prev, [selectedVisualSection]: categoryName }));
    }
  };
  const handleDoneWithSection = () => setSelectedVisualSection(null);

  const handleNewPromoCodeChange = (e) => {
    const { name, value } = e.target;
    setNewPromoCode(prev => ({ ...prev, [name]: name === 'code' ? value.toUpperCase() : value }));
  };

  const handleAddOrUpdatePromoCodeLocal = () => {
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

    if (editingPromoCode) {
      setPromoCodes(promoCodes.map(pc =>
        (pc.id || pc._id) === (editingPromoCode.id || editingPromoCode._id)
          ? { ...editingPromoCode, ...newPromoCode, discountValue }
          : pc
      ));
      toast.success("Promo code updated locally.");
    } else {
      setPromoCodes([...promoCodes, { ...newPromoCode, id: generateTempId(), discountValue }]);
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
      expiryDate: promoCode.expiryDate || ''
    });
  };

  const handleDeletePromoCodeLocal = (promoCodeId) => {
    setPromoCodes(prev => prev.filter(pc => (pc.id || pc._id) !== promoCodeId));
    toast.success("Promo code removed locally.");
  };

  const handleCancelEditPromoCodeLocal = () => {
    setEditingPromoCode(null);
    setNewPromoCode({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: '' });
  };

  const handleCreateAndPublishEvent = async () => {
    if (!eventData.eventName || !eventData.date || !eventData.time) {
      toast.error("Event name, date, and time are required.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('eventName', eventData.eventName);
    formData.append('date', eventData.date);
    formData.append('time', eventData.time);
    formData.append('description', eventData.description);
    if (eventPoster) {
      formData.append('poster', eventPoster);
    }

    // --- Start of refined logic ---
    let isDefaultCategoryReferencedBySeating = false;
    const finalSeatingLayoutAssignments = predefinedSeatingLayout.map(section => {
      const userAssignedCategoryName = sectionTicketTypeMap[section.section]; 

      let finalAssignedCategoryName;
      if (userAssignedCategoryName && userAssignedCategoryName !== '') {
        finalAssignedCategoryName = userAssignedCategoryName;
      } else {
        finalAssignedCategoryName = DEFAULT_TICKET_CATEGORY_NAME;
        isDefaultCategoryReferencedBySeating = true; // Mark that the default is needed
      }

      return {
        section: section.section,
        rows: section.rows,
        style: section.style,
        assignedCategoryName: finalAssignedCategoryName
      };
    });
    formData.append('seatingLayout', JSON.stringify(finalSeatingLayoutAssignments));

    let finalTicketCategoriesForPayload;
    const userDefinedTicketTypes = ticketTypes.map(tt => ({
      category: tt.categoryName,
      price: parseFloat(tt.price)
    }));

    if (userDefinedTicketTypes.length === 0) {
      // Case 1: No user-defined types. All sections use default. Payload is just default.
      finalTicketCategoriesForPayload = [{ category: DEFAULT_TICKET_CATEGORY_NAME, price: parseFloat(DEFAULT_TICKET_PRICE) }];
    } else {
      // Case 2: User defined some types.
      finalTicketCategoriesForPayload = [...userDefinedTicketTypes];
      const defaultIsDefinedByUser = userDefinedTicketTypes.some(
        tt => tt.category.toLowerCase() === DEFAULT_TICKET_CATEGORY_NAME.toLowerCase()
      );
      // Add default type to payload ONLY if it's referenced by seating AND not already defined by user.
      if (isDefaultCategoryReferencedBySeating && !defaultIsDefinedByUser) {
        finalTicketCategoriesForPayload.push({ category: DEFAULT_TICKET_CATEGORY_NAME, price: parseFloat(DEFAULT_TICKET_PRICE) });
      }
    }
    formData.append('ticketCategories', JSON.stringify(finalTicketCategoriesForPayload));
    // --- End of refined logic ---

    const sanitizedPromoCodes = promoCodes.map(({ id, _id, ...rest }) => rest);
    formData.append('promoCodes', JSON.stringify(sanitizedPromoCodes));

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        body: formData,
      });
      const responseData = await response.json();

      if (response.ok) {
        toast.success('Event created and published successfully!');
        setTimeout(() => {
          router.push('/organizer/dashboard');
        }, 1500);
      } else {
        toast.error(responseData.error || 'Failed to create event.');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };


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
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="mt-2 text-gray-600">Configure all aspects of your new event below.</p>
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
                    onAddOrUpdateTicketType={handleAddOrUpdateTicketTypeLocal}
                    onEditTicketType={handleEditTicketTypeLocal}
                    onDeleteTicketType={handleDeleteTicketTypeLocal}
                    onCancelEditTicketType={handleCancelEditTicketTypeLocal}
                    isLoading={loading}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                )}
                {activeTab === 'seatingArrangement' && (
                  <SeatingArrangement
                    ticketTypes={ticketTypes.length > 0 ? ticketTypes : [{id: 'default', categoryName: DEFAULT_TICKET_CATEGORY_NAME, price: DEFAULT_TICKET_PRICE}]}
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
                    isLoading={loading}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                )}
              </div>
            </div>

            {/* Event Preview & Action Section */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
                  <div className="flex items-center mb-4">
                    <EyeIcon className="h-6 w-6 text-sky-500 mr-2" />
                    <h3 className="text-xl font-medium text-gray-900">Event Preview</h3>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="aspect-[4/3] bg-gradient-to-br from-sky-50 to-blue-50 relative">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Event poster preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
                            <p>Event Poster</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-medium text-gray-900">{eventData.eventName || 'Event Name'}</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {formattedDate || 'Event Date'} {eventData.time ? `at ${eventData.time}` : ''}
                      </p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                        {eventData.description || 'Event description...'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2 text-sky-600" />
                        Create & Publish Event
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Ensure all event details, ticket prices, seating arrangements, and promotional codes are correctly configured.
                    </p>
                    <button
                        type="button"
                        onClick={handleCreateAndPublishEvent}
                        disabled={loading}
                        className={`w-full inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500
                                    ${loading ? 'opacity-50 cursor-not-allowed' : 'transform transition hover:-translate-y-0.5'}`}
                    >
                        {loading ? (
                            <>
                                <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                                Creating Event...
                            </>
                        ) : (
                           'Create and Publish Event'
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

export default CreateEventPage;