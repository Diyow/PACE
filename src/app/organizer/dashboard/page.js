'use client';

 import { useState, useEffect, useRef } from 'react';
 import { useRouter } from 'next/navigation';

 export default function OrganizerDashboard() {
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();
  const isMounted = useRef(false);

  useEffect(() => {
   isMounted.current = true;

   const getRole = async () => {
    try {
     const response = await fetch('/api/user', {
      method: 'GET',
      headers: {
       'Content-Type': 'application/json',
      },
     });

     if (isMounted.current) {
      if (response.ok) {
       const data = await response.json();
       setUserRole(data.role);
      } else if (response.status === 401) {
       router.push('/login');
      } else {
       console.error('Error fetching user data:', response.status, response.statusText);
       router.push('/');
      }
     }
    } catch (error) {
     console.error('Error fetching user data:', error);
     if (isMounted.current) {
      router.push('/login');
     }
    }
   };

   getRole();

   return () => {
    isMounted.current = false;
   };
  }, [router]);

  useEffect(() => {
   if (userRole && userRole !== 'organizer') {
    router.push('/');
   }
  }, [userRole, router]); // Run this effect whenever userRole changes

  if (!userRole) {
   return <div>Loading...</div>;
  }

  if (userRole !== 'organizer') {
   return null; // We've already triggered the redirect in the useEffect
  }

  return (
   <div>
    <h1>Organizer Dashboard</h1>
    {/* ... */}
   </div>
  );
 }