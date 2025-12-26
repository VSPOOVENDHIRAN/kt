import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default function GovtLedger() {
    const [ledgerData, setLedgerData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchUserId, setSearchUserId] = useState("");
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetchLedgerData();
    }, [token, navigate]);

    const fetchLedgerData = async () => {
        try {
            const res = await fetch("http://localhost:5001/api/gov/eb-bills", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setLedgerData(data.data || []);
                setFilteredData(data.data || []);
            } else {
                console.error("Failed to fetch ledger data");
            }
        } catch (err) {
            console.error("Error fetching ledger data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (userId) => {
        setSearchUserId(userId);
        if (!userId.trim()) {
            setFilteredData(ledgerData);
        } else {
            const filtered = ledgerData.filter(item =>
                item.user_id.toLowerCase().includes(userId.toLowerCase())
            );
            setFilteredData(filtered);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
                    <p className="text-xl font-semibold text-gray-300">Loading Govt Ledger...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 pb-24 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                    <span className="text-solar">Govt</span>
                    <span className="text-energy"> Ledger</span>
                </h1>
                <p className="text-gray-500 text-sm">
                    Government verification of EB bill data
                </p>
            </div>

            {/* Search Filter */}
            <div className="energy-card mb-6">
                <div className="flex items-center gap-3">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by User ID..."
                        value={searchUserId}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-gray-300 placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Ledger Table */}
            <div className="energy-card">
                <div className="flex items-center gap-2 mb-4">
                    <DocumentTextIcon className="w-6 h-6 text-solar" />
                    <h2 className="text-xl font-semibold">EB Bill Records</h2>
                    <span className="ml-auto text-sm text-gray-400">
                        Total: {filteredData.length} users
                    </span>
                </div>

                {filteredData.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        No data available
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">User ID</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">EB Bill Number</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Total Units (kWh)</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Total Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((item, index) => (
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
    );
}
