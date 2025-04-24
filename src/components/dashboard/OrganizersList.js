import { BuildingOfficeIcon, MagnifyingGlassIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function OrganizersList() {
  const [organizers, setOrganizers] = useState([])
  const [selectedOrganizer, setSelectedOrganizer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const response = await fetch('/api/organizers')
        if (!response.ok) {
          throw new Error('Failed to fetch organizers')
        }
        const data = await response.json()
        setOrganizers(data)
      } catch (error) {
        console.error('Error fetching organizers:', error)
        setError('Failed to load organizers')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizers()
  }, [])

  const handleOrganizerClick = (organizer) => {
    setSelectedOrganizer(organizer)
  }

  const filteredOrganizers = organizers.filter(organizer => {
    if (!organizer) return false

    const searchLower = searchQuery.toLowerCase()
    const fullName = (organizer.fullName || '').toLowerCase()
    const email = (organizer.email || '').toLowerCase()
    const organizationName = (organizer.organizationName || '').toLowerCase()

    return fullName.includes(searchLower) || 
           email.includes(searchLower) || 
           organizationName.includes(searchLower)
  })

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-sky-100">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-sky-100">
        <div className="flex items-center justify-center h-40">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm p-6 border border-sky-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Organizers</h2>
        <motion.button 
          className="text-sky-600 hover:text-sky-700 text-sm font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          View All
        </motion.button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search organizers..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <AnimatePresence>
          {filteredOrganizers.map((organizer) => (
            <motion.div 
              key={organizer._id}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer ${
                selectedOrganizer?._id === organizer._id 
                  ? 'bg-sky-100 border border-sky-200 shadow-sm' 
                  : 'bg-sky-50 hover:bg-sky-100'
              }`}
              onClick={() => handleOrganizerClick(organizer)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <BuildingOfficeIcon className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{organizer.organizationName || 'Unnamed Organization'}</h3>
                  <p className="text-sm text-gray-500">{organizer.email || 'No email'}</p>
                </div>
              </div>
              <motion.button 
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ rotate: 45 }}
                transition={{ duration: 0.2 }}
              >
                <EllipsisVerticalIcon className="h-6 w-6" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedOrganizer && (
          <motion.div 
            className="mt-6"
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
              <h3 className="font-semibold text-gray-900 mb-2">Organizer Details</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Full Name:</span> {selectedOrganizer.fullName || 'No name'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Organization:</span> {selectedOrganizer.organizationName || 'Unnamed Organization'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {selectedOrganizer.email || 'No email'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {selectedOrganizer.phoneNumber || 'No phone'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span> {selectedOrganizer.status || 'Undefined'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Joined:</span> {selectedOrganizer.createdAt ? new Date(selectedOrganizer.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 