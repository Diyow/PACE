'use client';
import React, { useState } from 'react';
import Head from 'next/head';


const CreateEventPage = () => {
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [eventPoster, setEventPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    setEventPoster(file);
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
      const response = await fetch('/api/events', { // Ganti dengan endpoint API Anda
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Event created successfully!');
        // Reset form setelah berhasil
        setEventName('');
        setDate('');
        setTime('');
        setDescription('');
        setEventPoster(null);
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
    <>
      <Head>
        <title>Create Event - PACE</title>
      </Head>
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-md shadow-md w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            Create Event
          </h2>
          {successMessage && (
            <div className="bg-green-200 text-green-800 py-2 px-4 rounded mb-4">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-200 text-red-800 py-2 px-4 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="eventName" className="block text-gray-700 text-sm font-bold mb-2">
                Event Name
              </label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                value={eventName}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="flex mb-4 space-x-4">
              <div className="w-1/2">
                <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">
                  Date
                </label>
                <input
                  type="date" // Menggunakan type="date" untuk input tanggal yang lebih baik
                  id="date"
                  name="date"
                  value={date}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="time" className="block text-gray-700 text-sm font-bold mb-2">
                  Time
                </label>
                <input
                  type="time" // Menggunakan type="time" untuk input waktu yang lebih baik
                  id="time"
                  name="time"
                  value={time}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
              ></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="eventPoster" className="block text-gray-700 text-sm font-bold mb-2">
                Event Poster <span className="italic">*optional</span>
              </label>
              <div className="border-2 border-dashed border-gray-400 rounded-md p-6 text-center text-gray-600">
                {eventPoster ? (
                  <div>
                    <p>Selected File: {eventPoster.name}</p>
                  </div>
                ) : (
                  <label htmlFor="poster-upload" className="cursor-pointer">
                    <p>Drag and drop your image here, or click to browse</p>
                  </label>
                )}
                <input
                  type="file"
                  id="poster-upload"
                  name="poster"
                  onChange={handlePosterChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
            <button
              type="button"
              className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-2"
            >
              Manage Seating (default) {/* Anda bisa menambahkan logika navigasi di sini */}
            </button>
            <button
              type="submit"
              className={`bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateEventPage;