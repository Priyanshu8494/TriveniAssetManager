import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { ref, onValue, set, push, remove } from "firebase/database";

function SpareItems() {
    const [items, setItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ category: 'Peripherals', name: '', qty: 0 });

    // Predefined Categories based on user request
    const categories = [
        "Peripherals", // Mouse, KB, HP, Camera
        "Printers",    // Printer, Cartridge
        "Cables",      // HDMI, VGA, Power
        "Components",  // RAM, HDD, SSD
        "Power",       // UPS
        "Laptops"      // Laptop
    ];

    const defaultItems = [
        { category: "Peripherals", name: "Mouse (Wired)" },
        { category: "Peripherals", name: "Mouse (Wireless)" },
        { category: "Peripherals", name: "Keyboard (Wired)" },
        { category: "Peripherals", name: "Keyboard (Wireless)" },
        { category: "Peripherals", name: "Headphones" },
        { category: "Peripherals", name: "Webcam" },
        { category: "Printers", name: "Printer" },
        { category: "Printers", name: "Cartridge" },
        { category: "Cables", name: "HDMI Cable" },
        { category: "Cables", name: "VGA Cable" },
        { category: "Cables", name: "Power Cord" },
        { category: "Components", name: "RAM 8GB" },
        { category: "Components", name: "RAM 16GB" },
        { category: "Components", name: "HDD 1TB" },
        { category: "Components", name: "SSD 256GB" },
        { category: "Components", name: "SSD 512GB" },
        { category: "Power", name: "UPS" },
        { category: "Laptops", name: "Laptop" },
    ];

    useEffect(() => {
        const sparesRef = ref(db, 'spares/');
        const unsubscribe = onValue(sparesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setItems(data);
            } else {
                // Initialize with default items if empty
                const initialData = {};
                defaultItems.forEach(item => {
                    // Create a unique key for default items
                    const key = item.name.replace(/\s+/g, '_').toLowerCase();
                    initialData[key] = { ...item, qty: 0 };
                });
                setItems(initialData);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateQty = (key, delta) => {
        const item = items[key];
        const newQty = (item.qty || 0) + delta;
        if (newQty < 0) return;

        set(ref(db, `spares/${key}`), { ...item, qty: newQty });
    };

    const handleAddNew = (e) => {
        e.preventDefault();
        if (!newItem.name) return;
        const key = newItem.name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
        set(ref(db, `spares/${key}`), { ...newItem, qty: parseInt(newItem.qty) || 0 });
        setNewItem({ category: 'Peripherals', name: '', qty: 0 });
    };

    const handleDelete = (key) => {
        if (confirm("Delete this item?")) {
            remove(ref(db, `spares/${key}`));
        }
    };

    // Group items by category
    const groupedItems = categories.reduce((acc, cat) => {
        acc[cat] = Object.entries(items).filter(([k, v]) => v.category === cat);
        return acc;
    }, {});

    // Handle custom categories that might be added later
    const customItems = Object.entries(items).filter(([k, v]) => !categories.includes(v.category));
    if (customItems.length > 0) {
        groupedItems["Others"] = customItems;
    }

    return (
        <div className="animation-fade-in">
            {/* New Item Form */}
            <div className="glass-card p-6 mb-8 border-t-4 border-green-500">
                <h3 className="text-lg font-bold text-white mb-4">➕ Add Custom Spare Item</h3>
                <form onSubmit={handleAddNew} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-xs text-gray-400 uppercase">Category</label>
                        <select
                            className="glass-input bg-slate-800 w-full"
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            <option value="Others">Others</option>
                        </select>
                    </div>
                    <div className="flex-[2] w-full">
                        <label className="text-xs text-gray-400 uppercase">Item Name</label>
                        <input
                            type="text"
                            className="glass-input w-full"
                            placeholder="e.g. Screwdriver Set"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        />
                    </div>
                    <div className="w-24">
                        <label className="text-xs text-gray-400 uppercase">Initial Qty</label>
                        <input
                            type="number"
                            className="glass-input w-full text-center"
                            value={newItem.qty}
                            onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="glass-card bg-green-500/20 hover:bg-green-500/40 text-green-400 font-bold px-6 py-2 border-green-500/50">
                        ADD
                    </button>
                </form>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(groupedItems).map(([category, categoryItems]) => (
                    <div key={category} className="glass-card p-0 overflow-hidden">
                        <div className="bg-white/5 p-3 border-b border-white/10 flex justify-between items-center">
                            <h4 className="font-bold text-cyan-400 uppercase tracking-wider">{category}</h4>
                            <span className="text-xs text-gray-500">{categoryItems.length} items</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {categoryItems.length === 0 ? (
                                <div className="p-4 text-center text-gray-600 text-sm italic">
                                    No items yet.
                                </div>
                            ) : (
                                categoryItems.map(([key, item]) => (
                                    <div key={key} className="flex items-center justify-between p-2 hover:bg-white/5 rounded group">
                                        <span className="text-gray-300 font-medium text-sm">{item.name}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-black/40 rounded-lg overflow-hidden border border-white/10">
                                                <button
                                                    onClick={() => updateQty(key, -1)}
                                                    className="px-2 py-1 hover:bg-red-500/20 text-red-400 transition-colors"
                                                >-</button>
                                                <span className={`w-8 text-center font-mono font-bold ${item.qty > 0 ? 'text-white' : 'text-gray-600'}`}>
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() => updateQty(key, 1)}
                                                    className="px-2 py-1 hover:bg-green-500/20 text-green-400 transition-colors"
                                                >+</button>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(key)}
                                                className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SpareItems;
