import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { UserIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

const DashboardNavbar = ({ user, onSignOut }) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const pages = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Deals', href: '/deals' },
    { name: 'Clients', href: '/clients' },
    { name: 'Properties', href: '/properties' },
    { name: 'Inquiries', href: '/inquiries' },
	
  ];

  return (
    <nav className="bg-gray-900 p-4 flex items-center justify-between text-white relative">
      {/* Logo on the left */}
      <div className="flex items-center">
       <Image
            src="/fullfav.png"
            alt="Enosh Infra Logo"
            width={112} // 14 (h-14) x 8 for scaling proportionally
            height={56}
            priority // Ensures the logo loads quickly for better LCP
            sizes="(max-width: 768px) 56px, 112px" // Optimizes size for responsiveness 
            style={{ width: "auto", height: "auto" }}
          />
      </div>

      {/* User Icon as a dropdown toggle */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center space-x-2 focus:outline-none"
        >
          <UserIcon className="h-6 w-6 text-white cursor-pointer" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded shadow-lg flex flex-col text-sm z-10" 
	  onMouseLeave={() => setMenuOpen(false)}>
            {/* User email */}
            <div className="px-4 py-2 border-b border-gray-700 text-gray-300">
              {user?.email || 'Guest'}
            </div>

            {/* Navigation Links */}
            {pages.map((page) => (
              <button
                key={page.href}
                onClick={() => {
                  router.push(page.href);
                  setMenuOpen(false); // close menu after navigation
                }}
                className={`px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors ${
                  router.pathname === page.href ? 'font-semibold' : ''
                }`}
              >
                {page.name}
              </button>
            ))}

            {/* Logout Button */}
            <button
              onClick={() => {
                onSignOut();
                setMenuOpen(false);
              }}
              className="px-4 py-2 text-left text-red-500 hover:bg-red-600 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DashboardNavbar;

