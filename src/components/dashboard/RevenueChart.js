'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CalendarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

const mockData = [
  { name: 'Jan', revenue: 4000, tickets: 240, expenses: 2400 },
  { name: 'Feb', revenue: 3000, tickets: 180, expenses: 1800 },
  { name: 'Mar', revenue: 6000, tickets: 360, expenses: 3600 },
  { name: 'Apr', revenue: 8000, tickets: 480, expenses: 4800 },
  { name: 'May', revenue: 5000, tickets: 300, expenses: 3000 },
  { name: 'Jun', revenue: 9000, tickets: 540, expenses: 5400 },
];

const timeRanges = ['Last 6 Months', 'Last Month', 'Last Week', 'All Time'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
  const [timeRange, setTimeRange] = useState('Last 6 Months');
  const [hoveredData, setHoveredData] = useState(null);

  const totalRevenue = mockData.reduce((sum, item) => sum + item.revenue, 0);
  const averageRevenue = totalRevenue / mockData.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">Revenue Overview</h2>
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm">{timeRange}</span>
            </div>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            {timeRanges.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-sky-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</h3>
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Average Monthly Revenue</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-gray-900">${averageRevenue.toLocaleString()}</h3>
              <span className="text-sm text-green-600">+12.5%</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={mockData}
              onMouseMove={(data) => {
                if (data && data.activePayload) {
                  setHoveredData(data.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredData(null)}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0284c7"
                fill="url(#colorRevenue)"
                strokeWidth={2}
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                fill="url(#colorExpenses)"
                strokeWidth={2}
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
} 