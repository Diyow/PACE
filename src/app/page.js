import React from 'react';
import EventsSection from '../components/EventsSection';
import MyTicketsSection from '../components/MyTicketsSection';
import WaitlistSection from '../components/WaitlistSection';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
     <EventsSection />
     <MyTicketsSection />
     <WaitlistSection />
    </div>
   );
}
