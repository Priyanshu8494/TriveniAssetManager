import React, { useState } from 'react';

function App() {
  const [display, setDisplay] = useState({ name: '', size: '', brand: '' });
  const [peripherals, setPeripherals] = useState({ mouse: '', keyboard: '', headphone: '', camera: '' });
  const [assets, setAssets] = useState([]);

  const handleDisplayChange = (e) => setDisplay({ ...display, [e.target.name]: e.target.value });
  const handlePeripheralChange = (e) => setPeripherals({ ...peripherals, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!display.name) return; // Basic validation

    setAssets([...assets, {
      id: Date.now(),
      display: { ...display },
      peripherals: { ...peripherals }
    }]);

    // Reset Form
    setDisplay({ name: '', size: '', brand: '' });
    setPeripherals({ mouse: '', keyboard: '', headphone: '', camera: '' });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-500">
          Triveni Asset Manager
        </h1>
        <p className="text-gray-400 mt-2">Manage Office Assets & Workstations</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* INPUT FORM */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6 sticky top-8">
            <h2 className="text-xl font-semibold text-cyan-300 border-b border-white/10 pb-2">New Asset Set</h2>

            {/* Display Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Display / Monitor</label>
              <div className="space-y-3">
                <input
                  type="text" name="brand" placeholder="Brand (e.g., Dell)"
                  value={display.brand} onChange={handleDisplayChange}
                  className="glass-input"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text" name="name" placeholder="Model Name"
                    value={display.name} onChange={handleDisplayChange}
                    className="glass-input"
                  />
                  <input
                    type="text" name="size" placeholder="Size (e.g. 24 inch)"
                    value={display.size} onChange={handleDisplayChange}
                    className="glass-input"
                  />
                </div>
              </div>
            </div>

            {/* Peripherals Section */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Accessories</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Mouse</span>
                  <input
                    type="text" name="mouse" placeholder="Brand/Model"
                    value={peripherals.mouse} onChange={handlePeripheralChange}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Keyboard</span>
                  <input
                    type="text" name="keyboard" placeholder="Brand/Model"
                    value={peripherals.keyboard} onChange={handlePeripheralChange}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Headphone</span>
                  <input
                    type="text" name="headphone" placeholder="Brand/Model"
                    value={peripherals.headphone} onChange={handlePeripheralChange}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Camera</span>
                  <input
                    type="text" name="camera" placeholder="Brand/Model"
                    value={peripherals.camera} onChange={handlePeripheralChange}
                    className="glass-input"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="triveni-btn w-full mt-4">
              Add Asset Set
            </button>
          </form>
        </div>

        {/* ASSET LIST (Sets) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white/90">Asset Inventory ({assets.length})</h2>

          {assets.length === 0 ? (
            <div className="glass-card p-12 text-center text-gray-500">
              <p>No asset sets created yet.</p>
              <p className="text-sm">Fill the form to add a workstation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assets.map((asset) => (
                <div key={asset.id} className="glass-card p-0 overflow-hidden transform transition-all hover:scale-[1.01]">
                  <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-300">
                        🖥️
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{asset.display.brand} {asset.display.name}</h3>
                        <p className="text-sm text-gray-400">{asset.display.size}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-gray-400">ID: {asset.id.toString().slice(-4)}</span>
                  </div>

                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <AssetItem icon="🖱️" label="Mouse" value={asset.peripherals.mouse} />
                    <AssetItem icon="⌨️" label="Keyboard" value={asset.peripherals.keyboard} />
                    <AssetItem icon="🎧" label="Audio" value={asset.peripherals.headphone} />
                    <AssetItem icon="📷" label="Camera" value={asset.peripherals.camera} />
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

const AssetItem = ({ icon, label, value }) => (
  <div className="bg-black/20 rounded-lg p-3 border border-white/5">
    <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
      <span>{icon}</span> {label}
    </div>
    <div className="font-medium text-sm text-gray-200 truncate">
      {value || <span className="text-gray-600 italic">None</span>}
    </div>
  </div>
);

export default App;
