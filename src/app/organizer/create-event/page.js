'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CalendarIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  ArrowLeftIcon,
  PlusCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import RoleGuard from '@/components/RoleGuard';

const CreateEventPage = () => {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [eventPoster, setEventPoster] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  
  // Format date for display in the preview
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '';

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    switch (name) {
      case 'eventName':
        setEventName(value);
        break;
      case 'date':
        setDate(value);
        break;
      case 'time':
        setTime(value);
        break;
      case 'description':
        setDescription(value);
        break;
      default:
        break;
    }
  };

  const handlePosterChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setEventPoster(file);
      // Create a preview URL for the image
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('eventName', eventName);
    formData.append('date', date);
    formData.append('time', time);
    formData.append('description', description);
    if (eventPoster) {
      formData.append('poster', eventPoster);
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Event created successfully!');
        // Reset form after success
        setEventName('');
        setDate('');
        setTime('');
        setDescription('');
        setEventPoster(null);
        setPreviewUrl(null);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/organizer/dashboard');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create event');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['organizer', 'admin']}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="max-w-5xl mx-auto mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sky-600 hover:text-sky-700 mb-6 transition-colors font-medium"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="mt-2 text-gray-600">Fill in the details to create your new event</p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
              {/* Tabs Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('basic')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'basic' 
                      ? 'border-sky-500 text-sky-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Basic Information
                  </button>
                  <button
                    onClick={() => setActiveTab('seating')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'seating' 
                      ? 'border-sky-500 text-sky-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Seating & Tickets
                  </button>
                </nav>
              </div>
              
              {/* Form Content */}
              <div className="p-6 md:p-8">
                {successMessage && (
                  <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p>{successMessage}</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p>{error}</p>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  {activeTab === 'basic' && (
                    <div className="space-y-6">
                      {/* Event Name */}
                      <div>
                        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
                          Event Name
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <input
                            type="text"
                            id="eventName"
                            name="eventName"
                            value={eventName}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 py-3 px-4 focus:border-sky-500 focus:ring-sky-500 text-gray-900"
                            placeholder="Enter event name"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <CalendarIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              id="date"
                              name="date"
                              value={date}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-gray-300 pl-10 py-3 focus:border-sky-500 focus:ring-sky-500 text-gray-900"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                            Time
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <ClockIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="time"
                              id="time"
                              name="time"
                              value={time}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-gray-300 pl-10 py-3 focus:border-sky-500 focus:ring-sky-500 text-gray-900"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={handleInputChange}
                            rows="4"
                            className="block w-full rounded-md border-gray-300 pl-10 py-3 focus:border-sky-500 focus:ring-sky-500 text-gray-900"
                            placeholder="Describe your event..."
                          ></textarea>
                        </div>
                      </div>
                      
                      {/* Event Poster */}
                      <div>
                        <label htmlFor="eventPoster" className="block text-sm font-medium text-gray-700 mb-1">
                          Event Poster <span className="text-gray-500 text-xs italic ml-1">(optional)</span>
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md hover:border-sky-300 transition-colors">
                          <div className="space-y-1 text-center">
                            {previewUrl ? (
                              <div className="relative">
                                <img 
                                  src={previewUrl} 
                                  alt="Event poster preview" 
                                  className="mx-auto h-48 object-contain rounded-md" 
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEventPoster(null);
                                    setPreviewUrl(null);
                                  }}
                                  className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <>
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                  <label
                                    htmlFor="poster-upload"
                                    className="relative cursor-pointer rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none"
                                  >
                                    <span>Upload a file</span>
                                    <input
                                      id="poster-upload"
                                      name="poster"
                                      type="file"
                                      className="sr-only"
                                      onChange={handlePosterChange}
                                      accept="image/*"
                                    />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'seating' && (
                    <div className="py-8 text-center">
                      <div className="mx-auto max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Seating & Tickets Setup</h3>
                        <p className="text-gray-500 mb-6">Configure your event's seating arrangement and ticket pricing</p>
                        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <PlusCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-600 mb-4">You'll be able to set up seating after creating the basic event details</p>
                          <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                            onClick={() => setActiveTab('basic')}
                          >
                            Return to Basic Information
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'additional' && (
                    <div className="py-8 text-center">
                      <div className="mx-auto max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Details</h3>
                        <p className="text-gray-500 mb-6">Add more information about your event</p>
                        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <PlusCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-600 mb-4">You'll be able to add additional details after creating the basic event</p>
                          <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                            onClick={() => setActiveTab('basic')}
                          >
                            Return to Basic Information
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Form Actions */}
                  <div className="mt-8 pt-5 border-t border-gray-200">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 mr-3"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || activeTab !== 'basic'}
                        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${loading || activeTab !== 'basic' ? 'opacity-50 cursor-not-allowed' : 'transform transition hover:-translate-y-0.5'}`}
                      >
                        {loading ? 'Creating...' : 'Create Event'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Event Preview Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
                  <div className="flex items-center mb-4">
                    <EyeIcon className="h-5 w-5 text-sky-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Event Preview</h3>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-sky-100">
                    <div className="aspect-[4/3] bg-gradient-to-br from-sky-50 to-blue-50 relative">
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Event poster preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 transition-colors">
                          Event Poster
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 transition-colors">
                        {eventName || 'Event Name'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formattedDate || 'Event Date'} {time ? `at ${time}` : ''}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {description || 'Event description will appear here...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    <p>This is how your event will appear to users browsing events.</p>
                  </div>
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