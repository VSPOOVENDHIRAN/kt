import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    WalletIcon,
    BoltIcon,
    CubeIcon,
    UserIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

import LineChart from "../components/LineChart.jsx";
import { init3DCardTilt } from "../card-3d-tilt.js";


export default function Dashboard() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBookIntro, setShowBookIntro] = useState(false);
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [ledgerData, setLedgerData] = useState([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [searchUserId, setSearchUserId] = useState("");
    const [filteredLedger, setFilteredLedger] = useState([]);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    // Check if book intro should play (only once ever)
    useEffect(() => {
        const hasSeenBookIntro = localStorage.getItem("dashboard_book_intro_seen");
        if (!hasSeenBookIntro) {
            setShowBookIntro(true);
            localStorage.setItem("dashboard_book_intro_seen", "true");
            // Auto-hide after animation completes (7 seconds total)
            setTimeout(() => {
                setShowBookIntro(false);
            }, 7000);
        }
    }, []);

    // Fetch user data
    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const res = await fetch("http://localhost:5001/api/auth/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    setUserData(data.data);
                } else {
                    // Invalid token - redirect to login
                    localStorage.removeItem("token");
                    localStorage.removeItem("user_id");
                    navigate("/login");
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, navigate]);

    // Initialize 3D card tilt after dashboard loads
    useEffect(() => {
        if (userData) {
            // Small delay to ensure cards are rendered
            const timer = setTimeout(() => {
                init3DCardTilt();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [userData]);

    // Generate realistic chart data with logical trends
    const generateChartData = (type, days = 30) => {
        const data = [];
        const today = new Date();

        // Base values and trends
        const baseValue = type === 'sold' ? 45 : 30;
        const trendDirection = type === 'sold' ? 1.02 : 0.98; // Sold increasing, bought stable

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Create realistic pattern with:
            // - Weekly cycles (higher on weekdays)
            // - Gradual trend
            // - Small random variation
            const dayOfWeek = date.getDay();
            const weekdayMultiplier = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 1.2 : 0.8;
            const trendMultiplier = Math.pow(trendDirection, days - i);
            const randomVariation = 0.85 + Math.random() * 0.3; // ±15%

            const value = baseValue * weekdayMultiplier * trendMultiplier * randomVariation;

            // Format label
            let label;
            if (i === 0) {
                label = 'Today';
            } else if (i === 1) {
                label = 'Yesterday';
            } else if (i <= 7) {
                label = `${i}d ago`;
            } else if (i === days - 1) {
                label = `${days}d ago`;
            } else if (i % 5 === 0) {
                label = `${i}d`;
            } else {
                label = '';
            }

            data.push({
                label,
                value: Math.max(0, value)
            });
        }

        return data;
    };

    const energySoldData = generateChartData('sold', 30);
    const energyBoughtData = generateChartData('bought', 30);

    // Calculate totals
    const totalSold = energySoldData.reduce((sum, d) => sum + d.value, 0);
    const totalBought = energyBoughtData.reduce((sum, d) => sum + d.value, 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
                    <p className="text-xl font-semibold text-gray-300">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="energy-card max-w-md text-center">
                    <p className="text-red-400 text-lg">Unable to load dashboard. Please try again.</p>
                </div>
            </div>
        );
    }

    // Open Ledger Modal
    const openLedger = async () => {
        setShowLedgerModal(true);
        setLedgerLoading(true);
        console.log("[LEDGER] Fetching EB bills from backend...");
        try {
            const res = await fetch("http://localhost:5001/api/gov/eb-bills", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            console.log("[LEDGER] Response status:", res.ok, "Data:", data);
            if (res.ok && data.success) {
                console.log("[LEDGER] Setting ledger data, count:", data.count);
                setLedgerData(data.data || []);
                setFilteredLedger(data.data || []);
            } else {
                console.error("[LEDGER] API returned error:", data);
            }
        } catch (err) {
            console.error("[LEDGER] Error fetching ledger:", err);
        } finally {
            setLedgerLoading(false);
        }
    };

    const handleLedgerSearch = (userId) => {
        setSearchUserId(userId);
        if (!userId.trim()) {
            setFilteredLedger(ledgerData);
        } else {
            const filtered = ledgerData.filter(item =>
                item.user_id.toLowerCase().includes(userId.toLowerCase())
            );
            setFilteredLedger(filtered);
        }
    };

    // Shorten wallet address
    const shortenAddress = (address) => {
        console.log("Shortening address:", address);
        if (!address) return "N/A";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <>
            {/* ONE-TIME 3D BOOK INTRO ANIMATION */}
            {showBookIntro && (
                <div className="dashboard-3d-intro-overlay">
                    {/* The Compressed Book */}
                    <div className="intro-compressed-book"></div>

                    {/* Dashboard Sections - Start compressed, then scatter */}
                    <div className="intro-dashboard-section intro-section-1">
                        <div className="intro-section-icon" style={{ background: '#10b981' }}>
                            <WalletIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">Welcome</div>
                    </div>

                    <div className="intro-dashboard-section intro-section-2">
                        <div className="intro-section-icon" style={{ background: '#3b82f6' }}>
                            <UserIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">User Info</div>
                    </div>

                    <div className="intro-dashboard-section intro-section-3">
                        <div className="intro-section-icon" style={{ background: '#fbbf24' }}>
                            <CubeIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">Statistics</div>
                    </div>

                    <div className="intro-dashboard-section intro-section-4">
                        <div className="intro-section-icon" style={{ background: '#22c55e' }}>
                            <ArrowTrendingUpIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">Charts</div>
                    </div>

                    <div className="intro-dashboard-section intro-section-5">
                        <div className="intro-section-icon" style={{ background: '#f59e0b' }}>
                            <BoltIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">Activity</div>
                    </div>

                    <div className="intro-dashboard-section intro-section-6">
                        <div className="intro-section-icon" style={{ background: '#6366f1' }}>
                            <ArrowTrendingDownIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">Navigation</div>
                    </div>
                </div>
            )}

            {/* MAIN DASHBOARD CONTENT */}
            <div className={`min-h-screen p-6 pb-24 max-w-7xl mx-auto ${showBookIntro ? 'dashboard-3d-expand-settle' : 'dashboard-entrance'}`}>
                {/* Welcome Message - ONLY IN DASHBOARD */}
                <div className="mb-6 card-stagger card-stagger-1">
                    <h2 className="text-xl font-semibold text-gray-300">
                        Welcome, <span className="text-solar">{userData.name || "User"}</span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Here's your energy trading overview
                    </p>
                </div>

                {/* Government Ledger Card - AT THE TOP */}
                <div className="mb-6 card-stagger card-stagger-2">
                    <div className="energy-card energy-card-blockchain p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-200">Government Ledger</h3>
                                    <p className="text-sm text-gray-400">Blockchain verified smart meter transactions for EB officials</p>
                                </div>
                            </div>
                            <button
                                onClick={openLedger}
                                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                                Open Ledger
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-8 card-stagger card-stagger-2">
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-solar">Dash</span>
                        <span className="text-energy">board</span>
                    </h1>
                </div>


                {/* User Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Wallet Address */}
                    <div className="energy-card energy-card-blockchain card-stagger card-stagger-3">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <WalletIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="data-label text-xs">Wallet Address</p>
                                <p className="text-sm font-mono text-blue-400">
                                    {shortenAddress(userData.wallet_address)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="energy-card energy-card-solar card-stagger card-stagger-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="data-label text-xs">Role</p>
                                <p className="text-sm font-semibold text-solar">
                                    Seller / Buyer
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Token Balance */}
                    <div className="energy-card card-stagger card-stagger-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <CubeIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="data-label text-xs">Token Balance</p>
                                <p className="data-value text-lg data-value-energy counter-animate">
                                    {userData.token_balance}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Energy Balance */}
                    <div className="energy-card card-stagger card-stagger-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <BoltIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="data-label text-xs">Energy Balance</p>
                                <p className="data-value text-lg data-value-solar counter-animate">
                                    {userData.energy_balance} kWh
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Sold */}
                    <div className="energy-card energy-card-solar card-stagger card-stagger-7">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="data-label">Total Energy Sold (30d)</p>
                                <p className="data-value data-value-solar">{totalSold.toFixed(1)} kWh</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <ArrowTrendingUpIcon className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">
                            Avg: {(totalSold / 30).toFixed(1)} kWh/day
                        </p>
                    </div>

                    {/* Total Bought */}
                    <div className="energy-card energy-card-blockchain card-stagger card-stagger-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="data-label">Total Energy Bought (30d)</p>
                                <p className="data-value text-blue-400">{totalBought.toFixed(1)} kWh</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <ArrowTrendingDownIcon className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">
                            Avg: {(totalBought / 30).toFixed(1)} kWh/day
                        </p>
                    </div>

                    {/* Net Balance */}
                    <div className="energy-card card-stagger card-stagger-9">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="data-label">Net Energy (30d)</p>
                                <p className={`data-value ${totalSold > totalBought ? 'text-energy' : 'text-blue-400'}`}>
                                    {(totalSold - totalBought).toFixed(1)} kWh
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${totalSold > totalBought ? 'bg-green-500/20' : 'bg-blue-500/20'
                                }`}>
                                <BoltIcon className={`w-6 h-6 ${totalSold > totalBought ? 'text-green-500' : 'text-blue-500'}`} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">
                            {totalSold > totalBought ? 'Net Seller' : 'Net Buyer'}
                        </p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Energy Sold Chart */}
                    <div className="energy-card energy-card-solar card-stagger card-stagger-10">
                        <h3 className="chart-title flex items-center gap-2">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-solar" />
                            Energy Sold (Last 30 Days)
                        </h3>
                        <div className="chart-container">
                            <LineChart
                                data={energySoldData}
                                color="#10b981"
                                label="kWh Sold"
                                height={250}
                            />
                        </div>
                    </div>

                    {/* Energy Bought Chart */}
                    <div className="energy-card energy-card-blockchain card-stagger card-stagger-10">
                        <h3 className="chart-title flex items-center gap-2">
                            <ArrowTrendingDownIcon className="w-5 h-5 text-blue-400" />
                            Energy Bought (Last 30 Days)
                        </h3>
                        <div className="chart-container">
                            <LineChart
                                data={energyBoughtData}
                                color="#3b82f6"
                                label="kWh Bought"
                                height={250}
                            />
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="energy-card card-stagger card-stagger-10">
                    <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {[
                            { type: 'sell', amount: '45 kWh', tokens: '135', time: '2 hours ago', status: 'completed' },
                            { type: 'buy', amount: '30 kWh', tokens: '90', time: '5 hours ago', status: 'completed' },
                            { type: 'sell', amount: '60 kWh', tokens: '180', time: '1 day ago', status: 'completed' },
                        ].map((activity, i) => (
                            <div
                                key={i}
                                className={`activity-item flex items-center justify-between p-4 bg-energy-subtle rounded-lg border border-energy`}
                                style={{ animationDelay: `${(i + 1) * 50}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center dashboard-icon ${activity.type === 'sell' ? 'bg-green-500/20' : 'bg-blue-500/20'
                                        }`}>
                                        {activity.type === 'sell' ? (
                                            <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <ArrowTrendingDownIcon className="w-5 h-5 text-blue-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            {activity.type === 'sell' ? 'Sold' : 'Bought'} {activity.amount}
                                        </p>
                                        <p className="text-sm text-gray-400">{activity.time}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-solar">{activity.tokens} Tokens</p>
                                    <span className="status-badge status-completed text-xs">
                                        {activity.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


            </div>

            {/* Government Ledger Modal */}
            {showLedgerModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLedgerModal(false)}>
                    <div className="energy-card max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-200">Government Ledger</h2>
                                <p className="text-sm text-gray-400 mt-1">EB Bill Verification Data</p>
                            </div>
                            <button
                                onClick={() => setShowLedgerModal(false)}
                                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {/* Search */}
                            <div className="mb-6 flex items-center gap-3 p-4 bg-energy-subtle rounded-lg border border-energy">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by User ID..."
                                    value={searchUserId}
                                    onChange={(e) => handleLedgerSearch(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-gray-300 placeholder-gray-500"
                                />
                            </div>

                            {/* Total Users */}
                            <div className="mb-4 text-sm text-gray-400">
                                Total Users: <span className="text-solar font-semibold">{filteredLedger.length}</span>
                            </div>

                            {/* Table */}
                            {ledgerLoading ? (
                                <div className="text-center py-12">
                                    <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading ledger data...</p>
                                </div>
                            ) : filteredLedger.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    No data available
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-700">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">User ID</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">EB Bill Number</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">No. of Units Used (kWh)</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Amount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLedger.map((item, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-b border-gray-800 hover:bg-energy-subtle transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-sm font-mono text-blue-400">
                                                        {item.user_id}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-300">
                                                        {item.eb_bill_number}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-right text-solar">
                                                        {item.total_units.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-right text-energy">
                                                        ₹{item.total_amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
