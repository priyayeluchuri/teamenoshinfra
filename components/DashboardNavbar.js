import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const DashboardNavbar = ({ user, onSignOut }) => {
  return (
    <nav className="bg-gray-800 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/dashboard">
          <Image
            src="/fullfav.png"
            alt="Enosh Infra Logo"
            width={112}
            height={56}
            priority
            style={{ width: "auto", height: "auto" }}
            className="cursor-pointer"
          />
        </Link>
        
        {/* Navigation Items */}
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
            Dashboard
          </Link>
          <Link href="/properties" className="hover:text-blue-400 transition-colors">
            Properties
          </Link>
          <Link href="/clients" className="hover:text-blue-400 transition-colors">
            Clients
          </Link>
          <Link href="/reports" className="hover:text-blue-400 transition-colors">
            Reports
          </Link>
        </div>
        
        {/* User Info and Sign Out */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">
            Welcome, <span className="font-semibold text-white">{user?.email}</span>
          </span>
          <button
            onClick={onSignOut}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;