// app/dashboard/components/SalesChart.js
// In a real scenario, you would use a charting library like Chart.js or Recharts
const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [50, 65, 80, 70, 95, 110],
  };
  
  export default function SalesChart() {
    return (
      <div className="bg-white p-4 rounded-md shadow-md">
        <h5 className="font-semibold mb-2">Sales Performance</h5>
        {/* Placeholder for a chart */}
        <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-500">
          Placeholder for Sales Chart
        </div>
        {/* In a real app, you'd render a chart based on salesData */}
      </div>
    );
  }