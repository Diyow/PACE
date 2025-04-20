// app/dashboard/components/OverviewCard.js
export default function OverviewCard({ title, value, icon }) {
    return (
      <div className="bg-white p-4 rounded-md shadow-md">
        <div className="flex items-center mb-2">
          <span className="text-xl mr-2">{icon}</span>
          <h4 className="text-md font-semibold">{title}</h4>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    );
  }