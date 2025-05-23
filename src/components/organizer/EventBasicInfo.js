'use client';
import React from 'react';
import {
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const EventBasicInfo = ({ eventData, onInputChange, onPosterChange, previewUrl, onRemovePoster }) => {
  const { eventName, date, time, description } = eventData;

  return (
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
            value={eventName || ''}
            onChange={onInputChange}
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
              value={date || ''}
              onChange={onInputChange}
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
              value={time || ''}
              onChange={onInputChange}
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
            value={description || ''}
            onChange={onInputChange}
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
                  onClick={onRemovePoster}
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
                      onChange={onPosterChange}
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
  );
};

export default EventBasicInfo;