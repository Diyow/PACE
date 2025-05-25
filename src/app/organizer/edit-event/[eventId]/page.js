'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon, EyeIcon, PhotoIcon as HeroPhotoIcon, ArrowPathIcon, TicketIcon,
  KeyIcon, MapIcon, DocumentTextIcon, BellAlertIcon, UsersIcon as WaitlistUsersIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
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
    eventName: '', date: '', time: '', description: '',
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

  const [isNotifyingWaitlist, setIsNotifyingWaitlist] = useState(false);
  const [waitlistStats, setWaitlistStats] = useState({ count: 0, notified: 0, waiting: 0 });

  const inputClass = "w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors py-2 px-3";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const formattedDate = eventData.date ? new Date(eventData.date + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }) : '';

  const fetchAllEventPageData = useCallback(async (currentEventId) => {
    if (!currentEventId) return;
    try {
      const eventResponse = await fetch(`/api/events/${currentEventId}`);
      if (!eventResponse.ok) {
        if (eventResponse.status === 404) throw new Error('Event not found.');
        const errorData = await eventResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch event data');
      }
      const data = await eventResponse.json();
      setEventData({
        ...data, eventName: data.name || '', date: data.date ? data.date.split('T')[0] : '',
        time: data.time || '', description: data.description || '',
      });
      if (data.posterUrl) {
        setPreviewUrl(data.posterUrl); setInitialPosterUrl(data.posterUrl);
      } else {
        setPreviewUrl(null); setInitialPosterUrl(null);
      }
      setUiTicketTypes((data.ticketCategories || []).map(tc => ({
        id: tc._id || generateTempId(), categoryName: tc.category, price: tc.price
      })));
      const initialMap = {};
      const savedSeatingLayout = data.seatingLayout || [];
      predefinedSeatingLayout.forEach(visualSection => {
        const savedSectionData = savedSeatingLayout.find(s => s.section === visualSection.section);
        initialMap[visualSection.section] = savedSectionData?.assignedCategoryName || '';
      });
      setSectionTicketTypeMap(initialMap);

      const promoCodesRes = await fetch(`/api/promo-codes?eventId=${currentEventId}`);
      if (!promoCodesRes.ok) {
        const errorData = await promoCodesRes.json().catch(() => ({error: "Failed to parse promo code error"}));
        console.error("Promo codes fetch error:", errorData);
        toast.error(errorData.error || 'Could not load promo codes.');
        setPromoCodes([]);
      } else {
        const promoCodesData = await promoCodesRes.json();
        setPromoCodes(promoCodesData.map(pc => ({ 
            ...pc, id: pc._id, 
            expiryDate: pc.expiryDate ? new Date(pc.expiryDate).toISOString().split('T')[0] : '' 
        })));
      }
      
      const waitlistRes = await fetch(`/api/waitlist?eventId=${currentEventId}`); 
      if (waitlistRes.ok) {
          const waitlistData = await waitlistRes.json();
          if (Array.isArray(waitlistData)) { 
            setWaitlistStats({
                count: waitlistData.length,
                notified: waitlistData.filter(w => w.status === 'notified').length,
                waiting: waitlistData.filter(w => w.status === 'waiting').length,
            });
          } else {
            console.error("fetchAllEventPageData: Fetched waitlist data is not an array:", waitlistData);
            toast.error("Could not process waitlist statistics (invalid data format).");
            setWaitlistStats({ count: 0, notified: 0, waiting: 0 });
          }
      } else {
          const errorData = await waitlistRes.json().catch(() => ({}));
          console.error("Failed to fetch waitlist stats for event edit page:", errorData.error || `Status: ${waitlistRes.status}`);
          toast.error(errorData.error || "Could not refresh waitlist statistics.");
          setWaitlistStats({ count: 0, notified: 0, waiting: 0 });
      }
    } catch (err) {
      console.error('Error fetching event associated data:', err);
      toast.error(err.message || 'Failed to load event data.');
      if (err.message === 'Event not found.') router.push('/organizer/dashboard');
    }
  }, [router]);


  useEffect(() => {
    if (eventId && fetchLoading) {
      fetchAllEventPageData(eventId).finally(() => {
        setFetchLoading(false);
      });
    }
    const tabFromQuery = queryParams.get('tab');
    if (tabFromQuery) setActiveTab(tabFromQuery);
  }, [eventId, queryParams, fetchAllEventPageData, fetchLoading]);

 useEffect(() => {
    if (eventId && !fetchLoading && activeTab === 'waitlist') {
      const fetchStatsOnly = async () => {
        try {
          const waitlistRes = await fetch(`/api/waitlist?eventId=${eventId}`); 
          if (waitlistRes.ok) {
            const waitlistData = await waitlistRes.json();
            if (Array.isArray(waitlistData)) { 
                setWaitlistStats({
                count: waitlistData.length,
                notified: waitlistData.filter(w => w.status === 'notified').length,
                waiting: waitlistData.filter(w => w.status === 'waiting').length,
                });
            } else {
                console.error("fetchStatsOnly: Fetched waitlist data is not an array:", waitlistData);
                toast.error("Could not update waitlist statistics (invalid data format).");
            }
          } else {
            const errorData = await waitlistRes.json().catch(() => ({}));
            toast.error(errorData.error || "Could not refresh waitlist stats.");
          }
        } catch (e) {
          toast.error("Error refreshing waitlist stats.");
          console.error("Error in fetchStatsOnly:", e);
        }
      };
      fetchStatsOnly();
    }
  }, [activeTab, eventId, fetchLoading]);

  const handleBasicInfoInputChange = (event) => setEventData(prev => ({ ...prev, [event.target.name]: event.target.value }));
  const handlePosterChange = (event) => {
    const file = event.target.files[0];
    if (file) { setEventPoster(file); setPreviewUrl(URL.createObjectURL(file)); }
  };
  const handleRemovePoster = () => { 
    setEventPoster(null); 
    setPreviewUrl(null); 
    const fileInput = document.getElementById('poster-upload'); // Assuming EventBasicInfo has this ID
    if (fileInput) {
      fileInput.value = "";
    }
  };
  const handleNewTicketTypeChange = (e) => setNewTicketType(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handleAddOrUpdateTicketType = () => { 
    if (!newTicketType.categoryName || !newTicketType.price) {
      toast.error("Category name and price are required."); return;
    }
    const price = parseFloat(newTicketType.price);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid positive price."); return;
    }
    if (editingTicketType) {
      setUiTicketTypes(uiTicketTypes.map(tt => tt.id === editingTicketType.id ? { ...tt, categoryName: newTicketType.categoryName, price: price } : tt ));
      toast.success("Ticket type updated locally.");
    } else {
      if (uiTicketTypes.some(tt => tt.categoryName.toLowerCase() === newTicketType.categoryName.toLowerCase())) {
        toast.error(`Ticket type "${newTicketType.categoryName}" already exists.`); return;
      }
      setUiTicketTypes([...uiTicketTypes, { ...newTicketType, price: price, id: generateTempId() }]);
      toast.success("Ticket type added locally.");
    }
    setNewTicketType({ categoryName: '', price: '' }); setEditingTicketType(null);
  };
  const handleEditTicketType = (ticketType) => { setEditingTicketType(ticketType); setNewTicketType({ categoryName: ticketType.categoryName, price: ticketType.price.toString() }); };
  const handleDeleteTicketType = (ticketTypeIdToDelete) => { 
    if (!confirm("Are you sure you want to delete this ticket type? This will also unassign it from any seating sections.")) return;
    const typeToDelete = uiTicketTypes.find(tt => tt.id === ticketTypeIdToDelete);
    setUiTicketTypes(prev => prev.filter(tt => tt.id !== ticketTypeIdToDelete));
    if (typeToDelete) {
        setSectionTicketTypeMap(prevMap => {
            const newMap = { ...prevMap };
            for (const sectionName in newMap) { if (newMap[sectionName] === typeToDelete.categoryName) newMap[sectionName] = ''; }
            return newMap;
          });
    }
    toast.success("Ticket type removed locally.");
    if (editingTicketType && editingTicketType.id === ticketTypeIdToDelete) { setNewTicketType({ categoryName: '', price: '' }); setEditingTicketType(null); }
  };
  const handleCancelEditTicketType = () => { setEditingTicketType(null); setNewTicketType({ categoryName: '', price: '' }); };
  const handleVisualSectionSelect = (sectionName) => setSelectedVisualSection(sectionName);
  const assignTicketTypeToSection = (ticketTypeCategoryName) => { if (selectedVisualSection) setSectionTicketTypeMap(prev => ({ ...prev, [selectedVisualSection]: ticketTypeCategoryName })); };
  const handleDoneWithSection = () => setSelectedVisualSection(null);
  const handleNewPromoCodeChange = (e) => setNewPromoCode(prev => ({ ...prev, [e.target.name]: e.target.name === 'code' ? e.target.value.toUpperCase() : e.target.value }));
  
  const handleAddOrUpdatePromoCodeLocal = () => { 
    if (!newPromoCode.code || !newPromoCode.discountValue) { toast.error("Code and discount value are required."); return; }
    const discountValue = parseFloat(newPromoCode.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) { toast.error("Valid positive discount value required."); return; }
    if (newPromoCode.discountType === 'percentage' && discountValue > 100) { toast.error("Percentage discount cannot exceed 100."); return; }
    const codeExists = promoCodes.some(pc => pc.code.toLowerCase() === newPromoCode.code.toLowerCase() && (!editingPromoCode || pc.id !== editingPromoCode.id));
    if (codeExists) { toast.error(`Promo code "${newPromoCode.code}" already exists.`); return; }
    if (editingPromoCode) {
      setPromoCodes(promoCodes.map(pc => pc.id === editingPromoCode.id ? { ...editingPromoCode, ...newPromoCode, discountValue } : pc ));
      toast.success("Promo code updated locally.");
    } else {
      setPromoCodes([...promoCodes, { ...newPromoCode, discountValue, id: generateTempId(), _isNew: true }]);
      toast.success("Promo code added locally.");
    }
    setNewPromoCode({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: '' }); setEditingPromoCode(null);
  };
  const handleEditPromoCodeLocal = (promoCode) => { setEditingPromoCode(promoCode); setNewPromoCode({ code: promoCode.code, discountType: promoCode.discountType, discountValue: promoCode.discountValue.toString(), maxUses: promoCode.maxUses?.toString() || '', expiryDate: promoCode.expiryDate ? (promoCode.expiryDate.includes('T') ? promoCode.expiryDate.split('T')[0] : promoCode.expiryDate) : '' }); };
  const handleDeletePromoCodeLocal = (promoCodeIdToDelete) => { 
    if (!confirm("Are you sure? This change will be saved when you publish all configurations.")) return;
    setPromoCodes(prev => prev.filter(pc => pc.id !== promoCodeIdToDelete));
    toast.success("Promo code removed locally.");
    if (editingPromoCode && editingPromoCode.id === promoCodeIdToDelete) handleCancelEditPromoCodeLocal();
  };
  const handleCancelEditPromoCodeLocal = () => { setEditingPromoCode(null); setNewPromoCode({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiryDate: '' }); };

  const handleSaveAllConfigurations = async () => { 
    if (!eventId) { toast.error("Event ID missing."); return; }
    setIsSavingAll(true);
    const payloadFormData = new FormData();
    payloadFormData.append('eventName', eventData.eventName);
    payloadFormData.append('date', eventData.date);
    payloadFormData.append('time', eventData.time);
    payloadFormData.append('description', eventData.description);
    if (eventPoster) payloadFormData.append('poster', eventPoster);
    else if (!previewUrl && initialPosterUrl) payloadFormData.append('removePoster', 'true');

    const finalTicketCategories = uiTicketTypes.map(tt => ({ category: tt.categoryName, price: parseFloat(tt.price) }));
    payloadFormData.append('ticketCategories', JSON.stringify(finalTicketCategories));

    const finalSeatingLayout = predefinedSeatingLayout.map(section => ({
        section: section.section, rows: section.rows, style: section.style,
        assignedCategoryName: sectionTicketTypeMap[section.section] || null
    }));
    payloadFormData.append('seatingLayout', JSON.stringify(finalSeatingLayout));
    
    const processedPromoCodes = promoCodes.map(pc => {
      const { id, _isNew, ...rest } = pc; 
      const codePayload = { ...rest };
      if (!_isNew && id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) { 
        codePayload._id = id; 
      }
      return codePayload;
    });
    payloadFormData.append('promoCodes', JSON.stringify(processedPromoCodes));

    try {
      const response = await fetch(`/api/events/${eventId}`, { method: 'PUT', body: payloadFormData });
      if (!response.ok) {
        const errorData = await response.json(); throw new Error(errorData.error || "Failed to save configurations");
      }
      const responseData = await response.json();
      toast.success("Event configurations saved!");
      setEventPoster(null); 
      if (responseData.event?.posterUrl) { setInitialPosterUrl(responseData.event.posterUrl); setPreviewUrl(responseData.event.posterUrl); } 
      else if (responseData.event && !responseData.event.posterUrl) { setInitialPosterUrl(null); setPreviewUrl(null); }
      
      await fetchAllEventPageData(eventId); 
    } catch (error) {
      console.error('Error saving configurations:', error); toast.error(error.message);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleNotifyWaitlist = async () => {
    if (!eventId) {
      toast.error("Event ID is missing.");
      return;
    }
    if (!confirm("Are you sure you want to notify the next batch of users on the waitlist? This will send emails if tickets are available based on the current seat availability in the system.")) {
        return;
    }
    setIsNotifyingWaitlist(true);
    try {
        const response = await fetch('/api/waitlist/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.message || "Failed to trigger waitlist notification.");
        }
        toast.success(data.message || "Waitlist notification process initiated.");
        await fetchAllEventPageData(eventId); 
    } catch (error) {
        console.error("Error notifying waitlist:", error);
        toast.error(error.message);
    } finally {
        setIsNotifyingWaitlist(false);
    }
  };
  
  if (fetchLoading) { 
    return ( <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center"> <ArrowPathIcon className="h-12 w-12 text-sky-500 animate-spin" /> <p className="ml-3 text-sky-700">Loading event details...</p> </div> );
  }
  
  return (
    <RoleGuard allowedRoles={['organizer', 'admin']}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto mb-8">
          <button onClick={() => router.push('/organizer/dashboard')} className="flex items-center text-sky-600 hover:text-sky-700 mb-6 transition-colors font-medium">
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event: {eventData.name || "..."}</h1>
          <p className="mt-2 text-gray-600">Update event details, tickets, seating, promo codes, and manage waitlist.</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 bg-white rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-1 sm:space-x-2 px-2 sm:px-4 overflow-x-auto" aria-label="Tabs"> 
                  {[
                    { name: 'Basic Info', tab: 'basic', icon: EyeIcon },
                    { name: 'Tickets & Pricing', tab: 'ticketTypes', icon: TicketIcon },
                    { name: 'Seating', tab: 'seatingArrangement', icon: MapIcon },
                    { name: 'Promo Codes', tab: 'promoCodes', icon: KeyIcon },
                    { name: 'Waitlist', tab: 'waitlist', icon: WaitlistUsersIcon },
                  ].map((item) => (
                    <button key={item.tab} onClick={() => setActiveTab(item.tab)}
                      className={`whitespace-nowrap py-3 px-1.5 sm:py-4 sm:px-2 md:px-3 border-b-2 font-medium text-xs sm:text-sm focus:outline-none flex items-center gap-1 sm:gap-1.5
                        ${activeTab === item.tab ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5" /> {item.name}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                {activeTab === 'basic' && ( <EventBasicInfo eventData={eventData} onInputChange={handleBasicInfoInputChange} onPosterChange={handlePosterChange} previewUrl={previewUrl} onRemovePoster={handleRemovePoster} /> )}
                {activeTab === 'ticketTypes' && ( <TicketTypesPricing ticketTypes={uiTicketTypes} newTicketType={newTicketType} editingTicketType={editingTicketType} onNewTicketTypeChange={handleNewTicketTypeChange} onAddOrUpdateTicketType={handleAddOrUpdateTicketType} onEditTicketType={handleEditTicketType} onDeleteTicketType={handleDeleteTicketType} onCancelEditTicketType={handleCancelEditTicketType} isLoading={isSavingAll} inputClass={inputClass} labelClass={labelClass} /> )}
                {activeTab === 'seatingArrangement' && ( <SeatingArrangement ticketTypes={uiTicketTypes.length > 0 ? uiTicketTypes : [{id: 'default', categoryName: "Regular", price: "10.00"}]} sectionTicketTypeMap={sectionTicketTypeMap} selectedVisualSection={selectedVisualSection} onVisualSectionSelect={handleVisualSectionSelect} onAssignTicketTypeToSection={assignTicketTypeToSection}  onDoneWithSection={handleDoneWithSection} inputClass={inputClass} labelClass={labelClass} /> )}
                {activeTab === 'promoCodes' && ( <PromotionalCodes promoCodes={promoCodes} newPromoCode={newPromoCode} editingPromoCode={editingPromoCode} onNewPromoCodeChange={handleNewPromoCodeChange} onAddOrUpdatePromoCode={handleAddOrUpdatePromoCodeLocal} onEditPromoCode={handleEditPromoCodeLocal} onDeletePromoCode={handleDeletePromoCodeLocal} onCancelEditPromoCode={handleCancelEditPromoCodeLocal} isLoading={isSavingAll} inputClass={inputClass} labelClass={labelClass} /> )}
                
                {activeTab === 'waitlist' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-sky-700 mb-4 flex items-center">
                      <WaitlistUsersIcon className="h-6 w-6 mr-2" /> Waitlist Management
                    </h3>
                    <div className="bg-sky-50 p-4 rounded-lg border border-sky-200 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                            <div>
                                <p className="text-xs text-sky-600 uppercase tracking-wider">Total on Waitlist</p>
                                <p className="text-2xl font-bold text-sky-800">{waitlistStats.count}</p>
                            </div>
                             <div>
                                <p className="text-xs text-sky-600 uppercase tracking-wider">Awaiting Notification</p>
                                <p className="text-2xl font-bold text-sky-800">{waitlistStats.waiting}</p>
                            </div>
                             <div>
                                <p className="text-xs text-sky-600 uppercase tracking-wider">Notified</p>
                                <p className="text-2xl font-bold text-sky-800">{waitlistStats.notified}</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      If tickets become available (e.g., due to cancellations or increased capacity verified in the system), you can manually trigger notifications to the next users on the waitlist.
                    </p>
                    <button
                      onClick={handleNotifyWaitlist}
                      disabled={isNotifyingWaitlist || fetchLoading || waitlistStats.waiting === 0}
                      className={`w-full inline-flex justify-center items-center py-2.5 px-5 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
                                  ${(isNotifyingWaitlist || waitlistStats.waiting === 0 || fetchLoading) ? 'opacity-50 cursor-not-allowed' : 'transform transition hover:-translate-y-0.5'}`}
                    >
                      {isNotifyingWaitlist ? (
                        <> <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> Notifying... </>
                      ) : (
                        <> <BellAlertIcon className="h-5 w-5 mr-2" /> Notify Next on Waitlist ({waitlistStats.waiting}) </>
                      )}
                    </button>
                    {waitlistStats.waiting === 0 && !isNotifyingWaitlist && !fetchLoading &&(
                        <p className="text-sm text-center text-gray-500 mt-2">No users currently awaiting notification.</p>
                    )}
                     <p className="text-xs text-gray-500 mt-2">
                        Note: This action attempts to send emails to a batch of users if the system detects available seats. Users must act on the email to book.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-8 space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
                  <div className="flex items-center mb-4"> <EyeIcon className="h-6 w-6 text-sky-500 mr-2" /> <h3 className="text-xl font-medium text-gray-900">Event Preview</h3> </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-sky-100 transform hover:scale-[1.02]"> 
                    {/* === IMAGE FIX START === */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-sky-50 to-blue-50 relative overflow-hidden rounded-t-xl"> {/* Added rounded-t-xl and overflow-hidden to parent */}
                      {previewUrl ? ( 
                        <Image 
                          src={previewUrl} 
                          alt="Event poster preview" 
                          fill
                          style={{ objectFit: 'cover' }}
                          priority // Consider adding if it's an LCP element
                        /> 
                      ) : ( 
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 transition-colors"> 
                          <div className="text-center"> 
                            <HeroPhotoIcon className="h-12 w-12 mx-auto mb-2" /> {/* Using HeroPhotoIcon */}
                            <p>Event Poster</p> 
                          </div> 
                        </div> 
                      )}
                    </div>
                    {/* === IMAGE FIX END === */}
                    <div className="p-5">
                      <h3 className="text-lg font-medium text-gray-900 transition-colors"> {eventData.eventName || (eventData.name || 'Event Name')} </h3>
                      <p className="text-sm text-gray-500 mt-2"> {formattedDate || 'Event Date'} {eventData.time ? `at ${eventData.time}` : ''} </p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-3"> {eventData.description || 'Event description will appear here...'} </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"> <DocumentTextIcon className="h-5 w-5 mr-2 text-sky-600" /> Publish Changes </h3>
                    <p className="text-sm text-gray-600 mb-4"> Ensure all event details, ticket prices, seating arrangements, and promotional codes are correctly configured before saving. </p>
                    <button type="button" onClick={handleSaveAllConfigurations} disabled={isSavingAll || fetchLoading}
                        className={`w-full inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 
                                    ${isSavingAll || fetchLoading ? 'opacity-50 cursor-not-allowed' : 'transform transition hover:-translate-y-0.5'}`}>
                        {isSavingAll ? ( <> <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> Saving All... </> ) : ( 'Save All Event Configurations' )}
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
