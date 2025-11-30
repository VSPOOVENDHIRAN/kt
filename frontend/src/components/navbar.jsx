import React from "react";
import { Link } from "react-router-dom";
import {
  HomeIcon,
  ArrowPathIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function NavigationBar({ active }) {
  const navItems = [
    { name: "Dashboard", icon: <HomeIcon className="w-6 h-6" />, route: "/dashboard" },
    { name: "Trade", icon: <ArrowPathIcon className="w-6 h-6" />, route: "/trade" },
    { name: "History", icon: <ClockIcon className="w-6 h-6" />, route: "/history" },
    { name: "Profile", icon: <UserIcon className="w-6 h-6" />, route: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md shadow-2xl border-t border-emerald-500/50 flex justify-around p-3 z-50">
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.route}
          className={`flex flex-col items-center gap-1 transition duration-300 p-2 rounded-xl cursor-pointer text-xs font-semibold
            ${
              item.name === active
                ? "text-yellow-300 bg-emerald-700/50 shadow-md"
                : "text-gray-400 hover:text-emerald-300"
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
