// app/dashboard/components/Sidebar.js
import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-300 p-4">
      <h3 className="text-lg font-semibold mb-4">Navigation</h3>
      <ul>
        {navItems.map((item) => (
          <li key={item.href} className="mb-2">
            <Link href={item.href} className="block p-2 rounded-md hover:bg-gray-400">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}