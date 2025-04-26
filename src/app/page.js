import React from 'react';
import EventsSection from '../components/EventsSection';
import MyTicketsSection from '../components/MyTicketsSection';
import WaitlistSection from '../components/WaitlistSection';
import ScrollToTopButton from '../components/ScrollToTopButton';
import Footer from '../components/Footer';
import { CalendarIcon, TicketIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl animate-fade-in">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-sky-200">PACE</span>
            </h1>
            <p className="mt-6 text-xl text-sky-100 max-w-3xl mx-auto animate-fade-in animation-delay-200">
              Discover exciting events, manage your tickets, and join waitlists all in one place.
            </p>
            
            {/* Feature highlights */}
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 animate-fade-in animation-delay-400">
              <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
                <CalendarIcon className="h-8 w-8 text-sky-200" />
                <h3 className="mt-4 text-lg font-semibold">Discover Events</h3>
                <p className="mt-2 text-sm text-sky-100">Find and explore exciting events</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
                <TicketIcon className="h-8 w-8 text-sky-200" />
                <h3 className="mt-4 text-lg font-semibold">Manage Tickets</h3>
                <p className="mt-2 text-sm text-sky-100">Keep track of all your event tickets</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
                <ClockIcon className="h-8 w-8 text-sky-200" />
                <h3 className="mt-4 text-lg font-semibold">Join Waitlists</h3>
                <p className="mt-2 text-sm text-sky-100">Never miss out on sold-out events</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-4 text-sm text-gray-500">Featured Events</span>
          </div>
        </div>
        
        <div id="events">
          <EventsSection />
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-4 text-sm text-gray-500">Your Tickets</span>
          </div>
        </div>
        
        <div id="my-tickets">
          <MyTicketsSection />
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-4 text-sm text-gray-500">Waitlist</span>
          </div>
        </div>
        
        <div id="waitlist">
          <WaitlistSection />
        </div>
      </div>

      <ScrollToTopButton />
      <Footer />
    </main>
  );
}
