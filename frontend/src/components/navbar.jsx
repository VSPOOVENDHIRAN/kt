import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ArrowPathIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function NavigationBar({ active }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // Don't show navbar if not authenticated
  if (!token) {
    return null;
  }

  // Don't show navbar on login or register pages
  if (location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/") {
    return null;
  }

  const navItems = [
    { name: "Dashboard", icon: <HomeIcon className="w-6 h-6" />, route: "/dashboard" },
    { name: "Trade", icon: <ArrowPathIcon className="w-6 h-6" />, route: "/trade" },
    { name: "History", icon: <ClockIcon className="w-6 h-6" />, route: "/history" },
    { name: "Profile", icon: <UserIcon className="w-6 h-6" />, route: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-gray-700 flex justify-around p-3 z-50">
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.route}
          className={`tab-button flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer text-xs font-semibold
            ${item.name === active
              ? "active text-solar bg-energy-subtle"
              : "text-gray-400 hover:text-energy"
            }
          `}
        >
          {item.icon}
          {item.name}
        </Link>
      ))}
    </div>
  );
}
