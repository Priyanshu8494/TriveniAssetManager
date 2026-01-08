import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { ref, onValue, set, push, remove } from "firebase/database";

function SpareItems() {
    const [items, setItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ category: 'Keyboard', name: '', qty: 0 });

    // Updated Categories based on user's module-wise request
    const categories = [
        "Keyboard",
        "Mouse",
        "Laptop",
        "Desktop",
        "Cables",
        "Adapters",
        "Components",
        "Printer",
        "Damage",
        "Others"
    ];

    const defaultItems = [
        // Keyboard
        { category: "Keyboard", name: "Logitech keyboard - K120", qty: 1 },
        { category: "Keyboard", name: "Keyboard Dell - KB216", qty: 3 },
        { category: "Keyboard", name: "Logitech KB - K200", qty: 2 },
        { category: "Keyboard", name: "Logi KB - K200", qty: 2 },
        { category: "Keyboard", name: "Dell KB212", qty: 1 },

        // Mouse
        { category: "Mouse", name: "Mouse Lenovo", qty: 1 },
        { category: "Mouse", name: "DVR Mouse", qty: 1 },
        { category: "Mouse", name: "Logitech Mouse", qty: 0 },
        { category: "Mouse", name: "Dell Mouse", qty: 3 },

        // Laptop & Desktop
        { category: "Laptop", name: "HP Laptop", qty: 5 },
        { category: "Desktop", name: "HP Desktop", qty: 3 },

        // Cables
        { category: "Cables", name: "Power Cable", qty: 7 },
        { category: "Cables", name: "VGA Cable", qty: 11 },
        { category: "Cables", name: "HDMI Cable", qty: 1 },

        // Adapters
        { category: "Adapters", name: "Display Adapter", qty: 2 },
        { category: "Adapters", name: "USB Display Adapter", qty: 3 },
        { category: "Adapters", name: "HDMI to VGA", qty: 3 },
        { category: "Adapters", name: "5AMP Adapter", qty: 2 },

        // Components
        { category: "Components", name: "HDD (250GB/1TB/500GB)", qty: 0 },
        { category: "Components", name: "PC RAM DDR4 8GB 2666", qty: 1 },

        // Printer
        { category: "Printer", name: "Toner Cartridge", qty: 1 },

        // Damage
        { category: "Damage", name: "Damage HP - Headphone", qty: 10 },
        { category: "Damage", name: "Damage SMPS", qty: 4 },
        { category: "Damage", name: "Damage Mouse", qty: 5 },
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
                    const key = item.name.replace(/\s+/g, '_').toLowerCase();
                    initialData[key] = { ...item };
                });
                setItems(initialData);
                // Save defaults to Firebase
                set(ref(db, 'spares/'), initialData);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateQty = (key, delta) => {
        const item = items[key];
        const newQty = (parseInt(item.qty) || 0) + delta;
        if (newQty < 0) return;

        set(ref(db, `spares/${key}`), { ...item, qty: newQty });
    };

    const handleAddNew = (e) => {
        e.preventDefault();
        if (!newItem.name) return;
        const key = newItem.name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
        set(ref(db, `spares/${key}`), { ...newItem, qty: parseInt(newItem.qty) || 0 });
        setNewItem({ category: newItem.category, name: '', qty: 0 });
    };

    const handleDelete = (key) => {
        if (confirm("Delete this item?")) {
            remove(ref(db, `spares/${key}`));
        }
    };

    const resetToDefaults = () => {
        if (confirm("This will overwrite current spares with the default list. Continue?")) {
            const initialData = {};
            defaultItems.forEach(item => {
                const key = item.name.replace(/\s+/g, '_').toLowerCase();
                initialData[key] = { ...item };
            });
            set(ref(db, 'spares/'), initialData);
        }
    }

    // Group items by category
    const groupedItems = categories.reduce((acc, cat) => {
        acc[cat] = Object.entries(items).filter(([k, v]) => v.category === cat);
        return acc;
    }, {});

    // Handle custom categories
    const customItems = Object.entries(items).filter(([k, v]) => !categories.includes(v.category));
    if (customItems.length > 0) {
        groupedItems["Others"] = [...(groupedItems["Others"] || []), ...customItems];
    }

    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'Keyboard': return '⌨️';
            case 'Mouse': return '🖱️';
            case 'Laptop': return '💻';
            case 'Desktop': return '🖥️';
            case 'Cables': return '🔌';
            case 'Adapters': return '🔌';
            case 'Components': return '💾';
            case 'Printer': return '🖨️';
            case 'Damage': return '⚠️';
            default: return '📦';
        }
    };

    const getCategoryColor = (cat) => {
        switch (cat) {
            case 'Damage': return 'border-red-500 text-red-400';
            case 'Keyboard': return 'border-cyan-500 text-cyan-400';
            case 'Mouse': return 'border-blue-500 text-blue-400';
            case 'Laptop': return 'border-yellow-500 text-yellow-400';
            case 'Desktop': return 'border-purple-500 text-purple-400';
            case 'Cables': case 'Adapters': return 'border-emerald-500 text-emerald-400';
            default: return 'border-gray-500 text-gray-400';
        }
    };

    return (
        <div className="animation-fade-in space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="bg-purple-500/20 p-2 rounded-lg">🔌</span>
                    Spare Inventory Management
                </h2>
                <button
                    onClick={resetToDefaults}
                    className="text-[10px] text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest border border-white/10 px-3 py-1 rounded"
                >
                    Reset to Default List
                </button>
            </div>

            {/* New Item Form */}
            <div className="glass-card p-6 border-t-4 border-green-500 bg-green-500/5">
                <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-widest">➕ Add New Spare</h3>
                <form onSubmit={handleAddNew} className="flex flex-col lg:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Category</label>
                        <select
                            className="glass-input bg-slate-900 w-full mt-1"
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex-[2] w-full">
                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Item Name / Brand / Model</label>
                        <input
                            type="text"
                            className="glass-input w-full mt-1"
                            placeholder="e.g. Logitech K120"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        />
                    </div>
                    <div className="w-full lg:w-24">
                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Qty</label>
                        <input
                            type="number"
                            className="glass-input w-full text-center mt-1"
                            value={newItem.qty}
                            onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="triveni-btn from-green-600 to-emerald-600 px-8 py-2.5 w-full lg:w-auto shadow-lg shadow-green-500/20">
                        ADD ITEM
                    </button>
                </form>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(groupedItems).map(([category, categoryItems]) => (
                    categoryItems.length > 0 && (
                        <div key={category} className={`glass-card p-0 overflow-hidden border-t-2 transition-all hover:shadow-xl hover:shadow-white/5 ${getCategoryColor(category).split(' ')[0]}`}>
                            <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                                <h4 className={`font-bold uppercase tracking-widest flex items-center gap-2 ${getCategoryColor(category).split(' ')[1]}`}>
                                    <span>{getCategoryIcon(category)}</span>
                                    {category}
                                </h4>
                                <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-gray-400 font-mono">
                                    {categoryItems.reduce((sum, [_, itm]) => sum + (parseInt(itm.qty) || 0), 0)} Total Qty
                                </span>
                            </div>
                            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {categoryItems.map(([key, item]) => (
                                    <div key={key} className="flex items-center justify-between p-3 bg-black/20 hover:bg-white/5 rounded-lg border border-white/5 group transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-gray-200 font-medium text-sm leading-tight">{item.name}</span>
                                            <span className="text-[10px] text-gray-500 uppercase mt-1">{category}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-black/60 rounded-lg overflow-hidden border border-white/10 shadow-inner">
                                                <button
                                                    onClick={() => updateQty(key, -1)}
                                                    className="w-8 h-8 flex items-center justify-center hover:bg-red-500/20 text-red-500 transition-colors text-lg"
                                                >−</button>
                                                <span className={`w-10 text-center font-mono font-bold text-lg ${item.qty > 0 ? 'text-white' : 'text-gray-600'}`}>
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() => updateQty(key, 1)}
                                                    className="w-8 h-8 flex items-center justify-center hover:bg-green-500/20 text-green-500 transition-colors text-lg"
                                                >+</button>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(key)}
                                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-red-500/10"
                                                title="Delete Item"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

export default SpareItems;
