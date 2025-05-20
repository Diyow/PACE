import { UserCircleIcon, CalendarIcon, ChartBarIcon, BellIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function RecentActivity() {
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'organizer',
      title: 'New organizer registered',
      time: '2 hours ago',
      icon: UserCircleIcon,
      details: 'Tech Events Co. has been registered as a new organizer.'
    },
    {
      id: 2,
      type: 'event',
      title: 'New event created',
      time: '4 hours ago',
      icon: CalendarIcon,
      details: 'Music Festival 2024 has been created with 500 tickets.'
    },
    {
      id: 3,
      type: 'analytics',
      title: 'Analytics updated',
      time: '6 hours ago',
      icon: ChartBarIcon,
      details: 'Platform analytics have been updated with new metrics.'
    }
  ])

  const [expandedActivity, setExpandedActivity] = useState(null)
  const [filter, setFilter] = useState('all')

  const handleActivityClick = (activity) => {
    setExpandedActivity(expandedActivity?.id === activity.id ? null : activity)
  }

  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.type === filter
  )

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm p-6 border border-sky-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <div className="flex items-center space-x-2">
          {['all', 'organizer', 'event'].map((type) => (
            <motion.button
              key={type}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === type 
                  ? 'bg-sky-100 text-sky-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={() => setFilter(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredActivities.map((activity) => (
            <motion.div 
              key={activity.id}
              className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer ${
                expandedActivity?.id === activity.id 
                  ? 'bg-sky-100 border border-sky-200 shadow-sm' 
                  : 'hover:bg-sky-50'
              }`}
              onClick={() => handleActivityClick(activity)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2 bg-sky-50 rounded-lg">
                <activity.icon className="h-5 w-5 text-sky-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                </div>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
              <motion.button 
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ rotate: 45 }}
                transition={{ duration: 0.2 }}
              >
                <svg 
                  className="h-5 w-5"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {expandedActivity && (
          <motion.div 
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="p-4 bg-sky-50 rounded-lg border border-sky-200"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm text-gray-600">{expandedActivity.details}</p>
              <div className="mt-4 flex items-center justify-between">
                <motion.button 
                  className="text-sky-600 hover:text-sky-700 text-sm font-medium flex items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <BellIcon className="h-4 w-4 mr-1" />
                  Set Reminder
                </motion.button>
                <motion.button 
                  className="text-sky-600 hover:text-sky-700 text-sm font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  View Details
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 