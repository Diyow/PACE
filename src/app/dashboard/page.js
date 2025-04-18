// app/dashboard/page.js
import OverviewCard from './components/OverviewCard';
import SalesChart from './components/SalesChart';
import RecentOrdersTable from './components/RecentOrdersTable';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <OverviewCard title="Total Revenue" value="$12,500" icon="💰" />
        <OverviewCard title="New Users" value="350" icon="👤" />
        <OverviewCard title="Active Sessions" value="78" icon="🔥" />
      </div>
      <div className="mb-6">
        <SalesChart />
      </div>
      <div>
        <RecentOrdersTable />
      </div>
    </div>
  );
}