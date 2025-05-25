'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bars3Icon, XMarkIcon, HomeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'



export default function Headers() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Function to get dashboard link based on role
  const getDashboardLink = () => {
    if (!session?.user?.role) return '/'
    switch (session.user.role) {
      case 'admin':
        return '/admin/dashboard'
      case 'organizer':
        return '/organizer/dashboard'
      default:
        return '/'
    }
  }

  return (
    <header className="bg-gradient-to-b from-sky-50/90 to-sky-50/40 backdrop-blur shadow-lg sticky top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        {/* Left: App Name */}
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-2xl tracking-tight text-sky-700 hover:text-sky-900 transition-colors">PACE</Link>
        </div>
        {/* Right: Navigation + User */}
        <div className="flex items-center gap-28">
          {/* Navigation */}
          <div className="hidden md:flex gap-8">
            <Link
              href="/#events"
              className="relative text-sky-700 font-medium text-base hover:text-sky-900 transition-colors after:content-[''] after:block after:h-0.5 after:bg-sky-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left"
            >
              Events
            </Link>
            <Link
              href="/#my-tickets"
              className="relative text-sky-700 font-medium text-base hover:text-sky-900 transition-colors after:content-[''] after:block after:h-0.5 after:bg-sky-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left"
            >
              My Tickets
            </Link>
            <Link
              href="/#waitlist"
              className="relative text-sky-700 font-medium text-base hover:text-sky-900 transition-colors after:content-[''] after:block after:h-0.5 after:bg-sky-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left"
            >
              Waitlist
            </Link>
          </div>
          {/* User section */}
          {status === 'authenticated' ? (
            <div className="relative group flex items-center gap-2 cursor-pointer select-none"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
              tabIndex={0}
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-9 w-9 rounded-full bg-sky-400 text-white font-bold text-lg uppercase ring-2 ring-sky-200 shadow-sm transform transition-transform duration-150 group-hover:scale-105 group-hover:bg-sky-500">
                  {session.user.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                </span>
                <span className="text-sky-700 font-semibold text-base ml-1">{session.user.name}</span>
              </div>
              {/* Dropdown with Framer Motion animation */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-white shadow-lg border border-sky-100 py-2 z-20 pointer-events-auto"
                  >
                    {(session.user.role === 'admin' || session.user.role === 'organizer') && (
                      <Link href={getDashboardLink()} className="flex items-center gap-2 px-4 py-2 text-sky-700 hover:bg-sky-50 transition-colors">
                        <HomeIcon className="h-5 w-5 text-sky-400" /> Dashboard
                      </Link>
                    )}
                    <Link href="/profile" className="block px-4 py-2 text-sky-700 hover:bg-sky-50 transition-colors">Profile</Link>
                    <button
                      onClick={signOut}
                      className="block w-full text-left px-4 py-2 text-sky-700 hover:bg-sky-50 transition-colors"
                    >Sign out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sky-700 font-semibold text-base hover:text-sky-900 transition-colors"
            >
              Log in
            </Link>
          )}
        </div>
        {/* Hamburger for mobile */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-sky-700 hover:bg-sky-100"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </nav>
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 flex flex-col"
          >
            <div className="bg-white shadow-lg rounded-b-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-2xl tracking-tight text-sky-700">PACE</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded hover:bg-sky-100">
                  <XMarkIcon className="h-6 w-6 text-sky-700" />
                </button>
              </div>
              <Link href="/#events" className="block px-2 py-2 rounded hover:bg-sky-50 text-sky-700 font-medium">Events</Link>
              <Link href="/#my-tickets" className="block px-2 py-2 rounded hover:bg-sky-50 text-sky-700 font-medium">My Tickets</Link>
              <Link href="/#waitlist" className="block px-2 py-2 rounded hover:bg-sky-50 text-sky-700 font-medium">Waitlist</Link>
              <div className="border-t pt-4 mt-2">
                {status === 'authenticated' ? (
                  <>
                    {(session.user.role === 'admin' || session.user.role === 'organizer') && (
                      <Link href={getDashboardLink()} className="block px-2 py-2 rounded hover:bg-sky-50 text-sky-700 font-medium">Dashboard</Link>
                    )}
                    <Link href="/profile" className="block px-2 py-2 rounded hover:bg-sky-50 text-sky-700 font-medium">Profile</Link>
                    <button
                      onClick={() => { setMobileMenuOpen(false); signOut(); }}
                      className="block w-full text-left px-2 py-2 rounded hover:bg-sky-50 text-sky-700 font-medium"
                    >Sign out</button>
                  </>
                ) : (
                  <Link href="/login" className="block px-2 py-2 rounded bg-sky-600 text-white font-semibold text-center hover:bg-sky-700">Log in</Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

