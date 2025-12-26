import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { db } from './firebaseConfig';
import { ref, onValue, set, remove } from "firebase/database";
import SpareItems from './SpareItems';

function App() {
  // State
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'spares'
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Firebase Read Listener
  useEffect(() => {
    const assetsRef = ref(db, 'assets/');
    const unsubscribe = onValue(assetsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert Object to Array
        const loadedSets = Object.values(data);
        // Sort by timestamp if needed, or keeping it as is. 
        // Since we use Date.now() as ID, we can sort by ID descending to show newest first
        loadedSets.sort((a, b) => b.id - a.id);
        setSets(loadedSets);
      } else {
        setSets([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const initialFormState = {
    setName: '',     // e.g. TGA01
    assignee: '',    // User Name
    status: 'Free',  // Free, Assigned, Faulty
    ids: {           // Explicit IDs (Editable)
      cpu: '', dis1: '', dis2: '',
      mouse: '', key: '', head: '', cam: ''
    },
    display1: { brand: '', size: '', model: '' },
    display2: { brand: '', size: '', model: '' },
    peripherals: { mouse: '', keyboard: '', headphone: '', camera: '' }
  };

  const [form, setForm] = useState(initialFormState);

  // ID Generation Logic
  const generateIds = (baseName) => {
    if (!baseName) return { cpu: '', dis1: '', dis2: '', mouse: '', key: '', head: '', cam: '' };

    const numberPart = baseName.replace(/\D/g, '');
    const prefix = baseName.replace(/[^A-Za-z]/g, '') || 'TGA';
    const num = parseInt(numberPart || 0);

    return {
      cpu: `${prefix}-C-${numberPart.padStart(2, '0')}`,
      dis1: `${prefix}-D1-${num}`,
      dis2: `${prefix}-D2-${num}`,
      mouse: `${prefix}-M-${num}`,
      key: `${prefix}-KB-${num}`,
      head: `${prefix}-HP-${num}`,
      cam: `${prefix}-CAM-${num}`
    };
  };

  const handleChange = (e, section = null) => {
    const { name, value } = e.target;

    // Auto-Generate IDs when Main Name changes
    if (name === 'setName') {
      const newIds = generateIds(value);
      setForm(prev => ({
        ...prev,
        setName: value,
        ids: newIds
      }));
      return;
    }

    if (section) {
      setForm(prev => ({ ...prev, [section]: { ...prev[section], [name]: value } }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleIdChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, ids: { ...prev.ids, [name]: value } }));
  }

  const handleEdit = (set) => {
    setEditingId(set.id);
    setForm({
      setName: set.setName,
      assignee: set.assignee,
      status: set.status,
      ids: set.ids || generateIds(set.setName), // Fallback
      display1: set.display1 || { brand: '', size: '', model: '' },
      display2: set.display2 || { brand: '', size: '', model: '' },
      peripherals: set.peripherals
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(initialFormState);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.setName) return alert("Asset Name (e.g. TGA01) is required!");

    const timestamp = new Date().toLocaleDateString();

    // Use existing ID if editing, or create new one
    const id = editingId || Date.now();

    const payload = {
      id,
      ...form,
      timestamp
    };

    // Firebase Write
    set(ref(db, 'assets/' + id), payload)
      .then(() => {
        // Success
        setForm(initialFormState);
        setEditingId(null);
      })
      .catch((error) => {
        alert("Error saving data: " + error.message);
      });
  };

  const handleExport = () => {
    const data = sets.map(s => ({
      "Asset Set": s.setName,
      "Status": s.status,
      "Assigned To": s.assignee || "N/A",
      "CPU ID": s.ids.cpu,

      "Monitor 1 ID": s.ids.dis1,
      "Mon 1 Brand": s.display1?.brand,
      "Mon 1 Model": s.display1?.model,
      "Mon 1 Size": s.display1?.size,

      "Monitor 2 ID": s.ids.dis2,
      "Mon 2 Brand": s.display2?.brand,
      "Mon 2 Model": s.display2?.model,
      "Mon 2 Size": s.display2?.size,

      "Mouse ID": s.ids.mouse,
      "Mouse Model": s.peripherals.mouse,
      "Keyboard ID": s.ids.key,
      "Keyboard Model": s.peripherals.keyboard,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, "Asset_Manager_Report.xlsx");
  };

  const handleDelete = (id) => {
    if (confirm("Delete this asset set?")) {
      // Firebase Remove
      remove(ref(db, 'assets/' + id));
    }
  }

  // Statistics Logic
  const stats = useMemo(() => {
    let totalDisplays = 0;
    let freeDisplays = 0;
    let brandCount = {};
    let sizeCount = {};

    sets.forEach(set => {
      // Check Monitor 1
      if (set.display1?.brand) {
        totalDisplays++;
        if (set.status === 'Free') freeDisplays++;

        const b = set.display1.brand.toUpperCase();
        brandCount[b] = (brandCount[b] || 0) + 1;

        const s = set.display1.size ? set.display1.size.toUpperCase() : 'UNKNOWN';
        sizeCount[s] = (sizeCount[s] || 0) + 1;
      }
      // Check Monitor 2
      if (set.display2?.brand) {
        totalDisplays++;
        if (set.status === 'Free') freeDisplays++;

        const b = set.display2.brand.toUpperCase();
        brandCount[b] = (brandCount[b] || 0) + 1;

        const s = set.display2.size ? set.display2.size.toUpperCase() : 'UNKNOWN';
        sizeCount[s] = (sizeCount[s] || 0) + 1;
      }
    });

    // CPU Stats
    const totalCpus = sets.length;
    const freeCpus = sets.filter(s => s.status === 'Free').length;
    const assignedCpus = sets.filter(s => s.status === 'Assigned').length;

    return { totalDisplays, freeDisplays, brandCount, sizeCount, totalCpus, freeCpus, assignedCpus };
  }, [sets]);

  // Main Stats
  const totalSets = sets.length;
  const freeSets = sets.filter(s => s.status === 'Free').length;
  const faulty = sets.filter(s => s.status === 'Faulty').length;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto pb-20">

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-500">ASSET MANAGER</span>
            <span className="text-[10px] text-gray-600 ml-2 font-mono tracking-widest relative -top-1">by priyanshu</span>
          </h1>
          <p className="text-gray-400 mt-1">IT Asset Inventory System {loading && <span className="text-yellow-400 text-xs ml-2">(Connecting...)</span>}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all border ${currentView === 'dashboard' ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-black/30 text-gray-400 border-white/10'}`}
          >
            💻 Assets
          </button>
          <button
            onClick={() => setCurrentView('spares')}
            className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all border ${currentView === 'spares' ? 'bg-purple-500 text-white border-purple-400' : 'bg-black/30 text-gray-400 border-white/10'}`}
          >
            🔌 Spares
          </button>

          <div className="glass-card px-4 py-2 text-center min-w-[80px]">
            <span className="block text-xs text-gray-400">Total Sets</span>
            <span className="text-xl font-bold text-white">{totalSets}</span>
          </div>
          <div className="glass-card px-4 py-2 text-center border-green-500/30 min-w-[80px]">
            <span className="block text-xs text-gray-400">Free Sets</span>
            <span className="text-xl font-bold text-green-400">{freeSets}</span>
          </div>
          {currentView === 'dashboard' && (
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 border ${showStats ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-black/30 text-cyan-400 border-cyan-500/30'}`}
            >
              📊 Analysis
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {currentView === 'spares' ? (
        <SpareItems />
      ) : (
        <>
          {/* STATS DASHBOARD (Collapsible) */}
          {showStats && (
            <div className="glass-card p-6 mb-8 border-t-4 border-purple-500 animation-fade-in">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">📦 Detailed Inventory Analysis</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* CPU Overview (NEW) */}
                <div className="bg-black/20 p-4 rounded-lg">
                  <h4 className="text-cyan-400 font-bold mb-3 uppercase text-xs tracking-wider">CPU Overview</h4>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-400">Total CPUs</span>
                    <span className="text-2xl font-bold text-white">{stats.totalCpus}</span>
                  </div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-400">Assigned</span>
                    <span className="text-2xl font-bold text-blue-400">{stats.assignedCpus}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-gray-400">Free</span>
                    <span className="text-2xl font-bold text-green-400">{stats.freeCpus}</span>
                  </div>
                  <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    {/* Blue bar for assigned, Green for free (implied by remainder) */}
                    <div className="h-full bg-blue-500" style={{ width: `${stats.totalCpus ? (stats.assignedCpus / stats.totalCpus) * 100 : 0}%` }}></div>
                  </div>
                </div>

                {/* Monitor Overview */}
                <div className="bg-black/20 p-4 rounded-lg">
                  <h4 className="text-purple-400 font-bold mb-3 uppercase text-xs tracking-wider">Monitor Overview</h4>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-400">Total Monitors</span>
                    <span className="text-2xl font-bold text-white">{stats.totalDisplays}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-gray-400">Free Monitors</span>
                    <span className="text-2xl font-bold text-green-400">{stats.freeDisplays}</span>
                  </div>
                  <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${stats.totalDisplays ? (stats.freeDisplays / stats.totalDisplays) * 100 : 0}%` }}></div>
                  </div>
                </div>

                {/* Brand Breakdown */}
                <div className="bg-black/20 p-4 rounded-lg">
                  <h4 className="text-pink-400 font-bold mb-3 uppercase text-xs tracking-wider">By Brand (Monitors)</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.keys(stats.brandCount).length === 0 && <span className="text-gray-600 italic text-sm">No data</span>}
                    {Object.entries(stats.brandCount).map(([brand, count]) => (
                      <div key={brand} className="flex justify-between text-sm">
                        <span className="text-gray-300">{brand}</span>
                        <span className="font-mono font-bold text-white bg-white/10 px-2 rounded">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size Breakdown */}
                <div className="bg-black/20 p-4 rounded-lg">
                  <h4 className="text-yellow-400 font-bold mb-3 uppercase text-xs tracking-wider">By Size (Monitors)</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.keys(stats.sizeCount).length === 0 && <span className="text-gray-600 italic text-sm">No data</span>}
                    {Object.entries(stats.sizeCount).map(([size, count]) => (
                      <div key={size} className="flex justify-between text-sm">
                        <span className="text-gray-300">{size}</span>
                        <span className="font-mono font-bold text-white bg-white/10 px-2 rounded">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* INPUT FORM */}
            <div className="lg:col-span-1">
              <form onSubmit={handleSubmit} className={`glass-card p-6 space-y-5 sticky top-8 border-t-4 ${editingId ? 'border-yellow-400 shadow-yellow-500/20' : 'border-cyan-500'}`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">{editingId ? '✏️ Edit Asset Set' : '➕ Add New Asset Set'}</h2>
                  {editingId && <button type="button" onClick={handleCancelEdit} className="text-xs text-red-400 underline">Cancel Edit</button>}
                </div>

                {/* Core Info */}
                <div className={`space-y-4 p-4 rounded-lg ${editingId ? 'bg-yellow-500/10' : 'bg-black/20'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-cyan-400 uppercase font-bold">Asset Set Name</label>
                      <input
                        type="text" name="setName" placeholder="e.g. TGA01"
                        value={form.setName} onChange={handleChange}
                        className="glass-input text-lg font-mono tracking-wider font-bold text-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">CPU ID</label>
                      <input
                        type="text" name="cpu" placeholder="Auto"
                        value={form.ids.cpu} onChange={handleIdChange}
                        className="glass-input text-sm font-mono bg-cyan-900/20 border-cyan-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 uppercase">Status</label>
                      <select name="status" value={form.status} onChange={handleChange} className="glass-input bg-slate-800">
                        <option value="Free">🟢 Free</option>
                        <option value="Assigned">🔵 Assigned</option>
                        <option value="Faulty">🔴 Faulty</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase">Assign To</label>
                      <input
                        type="text" name="assignee" placeholder="User Name"
                        value={form.assignee} onChange={handleChange}
                        className="glass-input"
                        disabled={form.status !== 'Assigned'}
                      />
                    </div>
                  </div>
                </div>

                {/* Display 1 */}
                <div className="space-y-3 p-3 rounded bg-purple-500/5 border border-purple-500/20">
                  <label className="text-xs text-purple-400 uppercase font-bold block">Monitor 1</label>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase">Asset ID (Tag)</label>
                    <input
                      type="text" name="dis1"
                      value={form.ids.dis1} onChange={handleIdChange}
                      placeholder="Monitor 1 ID"
                      className="glass-input font-mono text-sm bg-purple-500/10 border-purple-500/30 text-purple-300"
                    />
                  </div>

                  <input
                    type="text" name="brand" placeholder="Brand (e.g. Dell)"
                    value={form.display1.brand} onChange={(e) => handleChange(e, 'display1')}
                    className="glass-input"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" name="model" placeholder="Model" value={form.display1.model} onChange={(e) => handleChange(e, 'display1')} className="glass-input" />
                    <input type="text" name="size" placeholder="Size" value={form.display1.size} onChange={(e) => handleChange(e, 'display1')} className="glass-input" />
                  </div>
                </div>

                {/* Display 2 */}
                <div className="space-y-3 p-3 rounded bg-pink-500/5 border border-pink-500/20">
                  <label className="text-xs text-pink-400 uppercase font-bold block">Monitor 2</label>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase">Asset ID (Tag)</label>
                    <input
                      type="text" name="dis2"
                      value={form.ids.dis2} onChange={handleIdChange}
                      placeholder="Monitor 2 ID"
                      className="glass-input font-mono text-sm bg-pink-500/10 border-pink-500/30 text-pink-300"
                    />
                  </div>

                  <input
                    type="text" name="brand" placeholder="Brand"
                    value={form.display2.brand} onChange={(e) => handleChange(e, 'display2')}
                    className="glass-input"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" name="model" placeholder="Model" value={form.display2.model} onChange={(e) => handleChange(e, 'display2')} className="glass-input" />
                    <input type="text" name="size" placeholder="Size" value={form.display2.size} onChange={(e) => handleChange(e, 'display2')} className="glass-input" />
                  </div>
                </div>

                {/* Accessories */}
                <div className="space-y-3">
                  <label className="text-xs text-gray-400 uppercase border-b border-white/10 w-full block pb-1">Accessories (ID & Model)</label>

                  <div className="grid grid-cols-6 gap-2 items-center">
                    <span className="col-span-1 text-[10px] text-gray-500">MOUSE</span>
                    <input type="text" name="mouse" value={form.ids.mouse} onChange={handleIdChange} placeholder="ID" className="col-span-2 glass-input text-xs px-2 py-1 font-mono" />
                    <input type="text" name="mouse" value={form.peripherals.mouse} onChange={(e) => handleChange(e, 'peripherals')} placeholder="Model" className="col-span-3 glass-input text-xs px-2 py-1" />
                  </div>

                  <div className="grid grid-cols-6 gap-2 items-center">
                    <span className="col-span-1 text-[10px] text-gray-500">KEYBD</span>
                    <input type="text" name="key" value={form.ids.key} onChange={handleIdChange} placeholder="ID" className="col-span-2 glass-input text-xs px-2 py-1 font-mono" />
                    <input type="text" name="keyboard" value={form.peripherals.keyboard} onChange={(e) => handleChange(e, 'peripherals')} placeholder="Model" className="col-span-3 glass-input text-xs px-2 py-1" />
                  </div>

                  <div className="grid grid-cols-6 gap-2 items-center">
                    <span className="col-span-1 text-[10px] text-gray-500">AUDIO</span>
                    <input type="text" name="head" value={form.ids.head} onChange={handleIdChange} placeholder="ID" className="col-span-2 glass-input text-xs px-2 py-1 font-mono" />
                    <input type="text" name="headphone" value={form.peripherals.headphone} onChange={(e) => handleChange(e, 'peripherals')} placeholder="Model" className="col-span-3 glass-input text-xs px-2 py-1" />
                  </div>

                  <div className="grid grid-cols-6 gap-2 items-center">
                    <span className="col-span-1 text-[10px] text-gray-500">CAM</span>
                    <input type="text" name="cam" value={form.ids.cam} onChange={handleIdChange} placeholder="ID" className="col-span-2 glass-input text-xs px-2 py-1 font-mono" />
                    <input type="text" name="camera" value={form.peripherals.camera} onChange={(e) => handleChange(e, 'peripherals')} placeholder="Model" className="col-span-3 glass-input text-xs px-2 py-1" />
                  </div>
                </div>

                <button type="submit" className={`triveni-btn w-full mt-4 py-3 text-lg ${editingId ? 'from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400' : ''}`}>
                  {editingId ? '💾 Update Changes' : '💾 Save Asset Set'}
                </button>
                <button type="button" onClick={handleExport} className="bg-green-600/20 hover:bg-green-600/40 text-green-400 w-full py-2 rounded border border-green-500/30 text-sm font-mono">
                  export to excel
                </button>
              </form>
            </div>

            {/* ASSET LIST */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Inventory List</h2>
                <span className="text-xs text-gray-500">Live Sync (Firebase)</span>
                <span className={`text-[10px] px-2 py-1 rounded-full ${loading ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>{loading ? 'Connecting...' : '● Online'}</span>
              </div>

              {sets.length === 0 && !loading ? (
                <div className="glass-card p-12 text-center text-gray-500">
                  <p>No assets found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sets.map((set) => (
                    <div key={set.id} className={`glass-card p-0 overflow-hidden relative group ${set.status === 'Faulty' ? 'border-red-500/50' : ''} ${editingId === set.id ? 'ring-2 ring-yellow-400' : ''}`}>

                      {/* Header */}
                      <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col md:flex-row justify-between md:items-center gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg font-bold text-xl ${set.status === 'Faulty' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-300'}`}>
                            {set.setName}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${set.status === 'Free' ? 'border-green-500 text-green-400 bg-green-500/10' :
                                set.status === 'Assigned' ? 'border-blue-500 text-blue-400 bg-blue-500/10' :
                                  'border-red-500 text-red-400 bg-red-500/10'
                                }`}>
                                {set.status}
                              </span>
                              {set.status === 'Assigned' && <span className="text-sm text-gray-300">👤 {set.assignee}</span>}
                            </div>
                            <p className="text-xs text-gray-500 font-mono mt-1">CPU ID: {set.ids.cpu}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(set)} className="text-yellow-400 text-xs px-3 py-1 border border-yellow-500/30 rounded hover:bg-yellow-500/10 transition-all">
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete(set.id)} className="text-red-500 text-xs hover:text-red-400 px-3 py-1 border border-red-500/30 rounded opacity-50 hover:opacity-100 transition-all">
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* IDs Grid */}
                      <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <IDBlock label="Mon 1" id={set.ids.dis1} val={`${set.display1?.brand || ''} ${set.display1?.size || ''}`} color="text-purple-400" />
                        <IDBlock label="Mon 2" id={set.ids.dis2} val={`${set.display2?.brand || ''} ${set.display2?.size || ''}`} color="text-pink-400" />

                        <IDBlock label="Mouse" id={set.ids.mouse} val={set.peripherals.mouse} />
                        <IDBlock label="Keyboard" id={set.ids.key} val={set.peripherals.keyboard} />
                        <IDBlock label="Headphone" id={set.ids.head} val={set.peripherals.headphone} />
                        <IDBlock label="Camera" id={set.ids.cam} val={set.peripherals.camera} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
}

const IDBlock = ({ label, id, val, color = "text-cyan-600/70" }) => (
  <div className="bg-black/20 rounded p-2 border border-white/5">
    <div className="text-[10px] text-gray-500 uppercase flex justify-between">
      <span>{label}</span>
      <span className={color}>{id}</span>
    </div>
    <div className="font-medium text-gray-300 truncate h-5">
      {val || "-"}
    </div>
  </div>
);

export default App;
