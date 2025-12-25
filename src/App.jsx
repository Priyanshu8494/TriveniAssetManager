import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

function App() {
  // State
  const [sets, setSets] = useState(() => {
    const saved = localStorage.getItem('triveniAssets');
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    setName: '',     // e.g. TGA01
    assignee: '',    // User Name
    status: 'Free',  // Free, Assigned, Faulty
    display: { brand: '', size: '', model: '' },
    peripherals: { mouse: '', keyboard: '', headphone: '', camera: '' }
  });

  useEffect(() => {
    localStorage.setItem('triveniAssets', JSON.stringify(sets));
  }, [sets]);

  // ID Generation Logic (TGA01 -> TGA-C-01, TGA-D-1)
  const generateIds = (baseName) => {
    // Extract number: "TGA01" -> "1" (removes leading zeros for Display ID as per request: TGA-D-1)
    // "TGA01" -> "01" (keeps zero for CPU ID?)
    // Let's assume standard formatting. 
    // Request: "TGA-C-01", "TGA-D-1" 

    // Simple parser: remove non-digits to get number
    const numberPart = baseName.replace(/\D/g, '');
    const prefix = baseName.replace(/[^A-Za-z]/g, '');

    // Formats
    const idCPU = `${prefix}-C-${numberPart.padStart(2, '0')}`; // TGA-C-01
    const idDis = `${prefix}-D-${parseInt(numberPart || 0)}`;   // TGA-D-1 (No leading zero)
    const idMou = `${prefix}-M-${parseInt(numberPart || 0)}`;   // TGA-M-1
    const idKey = `${prefix}-KB-${parseInt(numberPart || 0)}`;  // TGA-KB-1
    const idHead = `${prefix}-HP-${parseInt(numberPart || 0)}`; // TGA-HP-1
    const idCam = `${prefix}-CAM-${parseInt(numberPart || 0)}`;

    return { idCPU, idDis, idMou, idKey, idHead, idCam };
  };

  const handleChange = (e, section = null) => {
    const { name, value } = e.target;
    if (section) {
      setForm(prev => ({ ...prev, [section]: { ...prev[section], [name]: value } }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.setName) return alert("Asset Name (e.g. TGA01) is required!");

    const ids = generateIds(form.setName);

    const newSet = {
      id: Date.now(),
      ...form,
      autoIds: ids,
      timestamp: new Date().toLocaleDateString()
    };

    setSets([newSet, ...sets]);
    // Reset Form (keep structure)
    setForm({
      setName: '', assignee: '', status: 'Free',
      display: { brand: '', size: '', model: '' },
      peripherals: { mouse: '', keyboard: '', headphone: '', camera: '' }
    });
  };

  const handleExport = () => {
    const data = sets.map(s => ({
      "Asset Set Name": s.setName,
      "Status": s.status,
      "Assigned To": s.assignee || "N/A",
      "CPU ID": s.autoIds.idCPU,
      "Display ID": s.autoIds.idDis,
      "Display Brand": s.display.brand,
      "Display Size": s.display.size,
      "Mouse ID": s.autoIds.idMou,
      "Mouse Model": s.peripherals.mouse,
      "Keyboard ID": s.autoIds.idKey,
      "Keyboard Model": s.peripherals.keyboard,
      "Headphone ID": s.autoIds.idHead,
      "Headphone Model": s.peripherals.headphone,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, "Triveni_Assets_Report.xlsx");
  };

  const handleDelete = (id) => {
    if (confirm("Delete this asset set?")) {
      setSets(sets.filter(s => s.id !== id));
    }
  }

  // Stats
  const total = sets.length;
  const free = sets.filter(s => s.status === 'Free').length;
  const faulty = sets.filter(s => s.status === 'Faulty').length;
  const assigned = sets.filter(s => s.status === 'Assigned').length;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto pb-20">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-500">
            Triveni Asset Manager
          </h1>
          <p className="text-gray-400 mt-1">IT Asset Inventory System</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-4 py-2 text-center">
            <span className="block text-xs text-gray-400">Total</span>
            <span className="text-xl font-bold text-white">{total}</span>
          </div>
          <div className="glass-card px-4 py-2 text-center border-green-500/30">
            <span className="block text-xs text-gray-400">Free</span>
            <span className="text-xl font-bold text-green-400">{free}</span>
          </div>
          <div className="glass-card px-4 py-2 text-center border-red-500/30">
            <span className="block text-xs text-gray-400">Faulty</span>
            <span className="text-xl font-bold text-red-400">{faulty}</span>
          </div>
          <button onClick={handleExport} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2">
            📂 Export Excel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* INPUT FORM */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5 sticky top-8 border-t-4 border-cyan-500">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Asset Set</h2>

            {/* Core Info */}
            <div className="space-y-4 bg-black/20 p-4 rounded-lg">
              <div>
                <label className="text-xs text-cyan-400 uppercase font-bold">Asset Set / CPU Name</label>
                <input
                  type="text" name="setName" placeholder="e.g. TGA01"
                  value={form.setName} onChange={handleChange}
                  className="glass-input text-lg font-mono tracking-wider"
                />
                <p className="text-[10px] text-gray-500 mt-1">IDs (TGA-C-01...) will be auto-generated.</p>
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

            {/* Display */}
            <div className="space-y-3">
              <label className="text-xs text-gray-400 uppercase border-b border-white/10 w-full block pb-1">Display Details</label>
              <input
                type="text" name="brand" placeholder="Brand (e.g. Dell)"
                value={form.display.brand} onChange={(e) => handleChange(e, 'display')}
                className="glass-input"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text" name="model" placeholder="Model"
                  value={form.display.model} onChange={(e) => handleChange(e, 'display')}
                  className="glass-input"
                />
                <input
                  type="text" name="size" placeholder="Size"
                  value={form.display.size} onChange={(e) => handleChange(e, 'display')}
                  className="glass-input"
                />
              </div>
            </div>

            {/* Accessories */}
            <div className="space-y-3">
              <label className="text-xs text-gray-400 uppercase border-b border-white/10 w-full block pb-1">Accessories (Model/Brand)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text" name="mouse" placeholder="Mouse"
                  value={form.peripherals.mouse} onChange={(e) => handleChange(e, 'peripherals')}
                  className="glass-input"
                />
                <input
                  type="text" name="keyboard" placeholder="Keyboard"
                  value={form.peripherals.keyboard} onChange={(e) => handleChange(e, 'peripherals')}
                  className="glass-input"
                />
                <input
                  type="text" name="headphone" placeholder="Headphone"
                  value={form.peripherals.headphone} onChange={(e) => handleChange(e, 'peripherals')}
                  className="glass-input"
                />
                <input
                  type="text" name="camera" placeholder="Camera"
                  value={form.peripherals.camera} onChange={(e) => handleChange(e, 'peripherals')}
                  className="glass-input"
                />
              </div>
            </div>

            <button type="submit" className="triveni-btn w-full mt-4 py-3 text-lg">
              Save Asset Set
            </button>
          </form>
        </div>

        {/* ASSET LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Inventory List</h2>
            <span className="text-xs text-gray-500">Auto-saved to device</span>
          </div>

          {sets.length === 0 ? (
            <div className="glass-card p-12 text-center text-gray-500">
              <p>No assets found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sets.map((set) => (
                <div key={set.id} className={`glass-card p-0 overflow-hidden relative group ${set.status === 'Faulty' ? 'border-red-500/50' : ''}`}>

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
                        <p className="text-xs text-gray-500 font-mono mt-1">CPU ID: {set.autoIds.idCPU}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(set.id)} className="text-red-500 text-xs hover:text-red-400 px-3 py-1 border border-red-500/30 rounded opacity-50 hover:opacity-100">Remove</button>
                  </div>

                  {/* IDs Grid */}
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <IDBlock label="Display" id={set.autoIds.idDis} val={`${set.display.brand} ${set.display.size}`} />
                    <IDBlock label="Mouse" id={set.autoIds.idMou} val={set.peripherals.mouse} />
                    <IDBlock label="Keyboard" id={set.autoIds.idKey} val={set.peripherals.keyboard} />
                    <IDBlock label="Headphone" id={set.autoIds.idHead} val={set.peripherals.headphone} />
                    <IDBlock label="Camera" id={set.autoIds.idCam} val={set.peripherals.camera} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const IDBlock = ({ label, id, val }) => (
  <div className="bg-black/20 rounded p-2 border border-white/5">
    <div className="text-[10px] text-gray-500 uppercase flex justify-between">
      <span>{label}</span>
      <span className="text-cyan-600/70">{id}</span>
    </div>
    <div className="font-medium text-gray-300 truncate h-5">
      {val || "-"}
    </div>
  </div>
);

export default App;
