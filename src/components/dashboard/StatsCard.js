import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

export default function StatsCard({ title, value, icon: Icon, trend, trendValue }) {
  const isPositive = trendValue.startsWith('+')

  return (
    <motion.div 
      className="bg-white p-6 rounded-xl shadow-sm border border-sky-100"
      whileHover={{ 
        scale: 1.01,
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-600">{title}</p>
          <motion.p 
            className="text-3xl font-bold text-gray-900 mt-2"
            whileHover={{ color: "#0284c7" }}
            transition={{ duration: 0.2 }}
          >
            {value}
          </motion.p>
        </div>
        <div className="p-3">
          <Icon className="h-12 w-12 text-sky-600" />
        </div>
      </div>

      <div className="mt-4 flex items-center text-sm">
        {isPositive ? (
          <ArrowTrendingUpIcon className="h-4 w-4 mr-1 text-green-600" />
        ) : (
          <ArrowTrendingDownIcon className="h-4 w-4 mr-1 text-red-600" />
        )}
        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
          {trendValue}
        </span>
      </div>
    </motion.div>
  )
} 