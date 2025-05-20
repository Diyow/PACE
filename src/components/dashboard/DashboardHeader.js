'use client';

import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-between items-center mb-8"
    >
      <h1 className="text-3xl font-bold text-gray-900">Event Organizer Dashboard</h1>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
      >
        <PlusIcon className="h-5 w-5" />
        Create New Event
      </motion.button>
    </motion.div>
  );
} 