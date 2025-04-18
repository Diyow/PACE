// app/dashboard/layout.js
import Sidebar from './components/Sidebar';
import Header from './components/Header'; // You might have a specific dashboard header

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-gray-200 p-6">
        <Header />
        <main className="py-4">{children}</main>
      </div>
    </div>
  );
}