'use client';

import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  TicketIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

const StatCard = ({ icon: Icon, label, value, trend, trendValue, bgColor }) => (
  <motion.div 
    variants={item} 
    className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${bgColor}`}
    whileHover={{ y: -2 }}
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-sky-100 rounded-lg">
        <Icon className="h-6 w-6 text-sky-600" />
      </div>
      <div className="flex-1">
        <p className="text-gray-600 text-sm">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <div className="flex items-center mt-1">
          <ArrowTrendingUpIcon className={`h-4 w-4 ${trend === 'up' ? 'text-green-500' : 'text-red-500'} mr-1`} />
          <p className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trendValue}
          </p>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function AnalyticsCards() {
  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Today\'s Sales', value: '12', trend: 'up' },
          { label: 'Active Events', value: '8', trend: 'up' },
          { label: 'Total Tickets', value: '1.2k', trend: 'up' },
          { label: 'Avg. Rating', value: '4.8', trend: 'up' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
          >
            <p className="text-sm text-gray-600">{stat.label}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-semibold text-gray-900">{stat.value}</span>
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Stats Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <StatCard
          icon={CurrencyDollarIcon}
          label="Total Revenue"
          value="$24,500"
          trend="up"
          trendValue="+15% from last month"
          bgColor="hover:bg-sky-50/50"
        />
        <StatCard
          icon={TicketIcon}
          label="Total Attendees"
          value="1,234"
          trend="up"
          trendValue="+8% from last month"
          bgColor="hover:bg-blue-50/50"
        />
        <StatCard
          icon={ChartBarIcon}
          label="Event Performance"
          value="95%"
          trend="up"
          trendValue="+12% improvement"
          bgColor="hover:bg-indigo-50/50"
        />
      </motion.div>
    </div>
  );
} 