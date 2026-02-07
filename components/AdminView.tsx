
import React, { useState, useEffect, useRef } from 'react';
import { StyleTemplate, AdminSettings, ApiKeyRecord, Coupon } from '../types';
import { storageService } from '../services/storage';
import { logger } from '../services/logger';
import ActivityLogView from './ActivityLogView';

const AdminView: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(storageService.isAdminLoggedIn());
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [styles, setStyles] = useState<StyleTemplate[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'styles' | 'keys' | 'payment' | 'tracking' | 'activities' | 'security' | 'coupons'>('styles');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [styleForm, setStyleForm] = useState({ 
    id: '', 
    name: '', 
    prompt: '', 
    description: '', 
    image: '', 
    autoGenerate: false,
    displayOrder: 0
  });
  const [keyForm, setKeyForm] = useState({ label: '', key: '' });
  const [securityForm, setSecurityForm] = useState({ newUsername: '', currentPassword: '', newPassword: '' });
  const [couponForm, setCouponForm] = useState({ code: '', type: 'percentage' as 'percentage' | 'fixed', value: 0 });
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, settings] = await Promise.all([
        storageService.getStyles(),
        storageService.getAdminSettings()
      ]);
      setStyles([...s]);
      setAdminSettings(settings);
      setSecurityForm(prev => ({ ...prev, newUsername: settings.username }));
    } catch (err) {
      logger.error('Admin', 'Failed to load data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    const json = await storageService.exportStyles();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `styleswap-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup Downloaded');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          await storageService.importStyles(event.target?.result as string);
          await loadData();
          showNotification('Backup Restored');
        } catch (err) {
          alert("Import failed: Invalid file");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const settings = await storageService.getAdminSettings();
    if (loginForm.username === settings.username && loginForm.password === settings.passwordHash) {
      setIsAuthenticated(true);
      storageService.setAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    storageService.setAdminLoggedIn(false);
  };

  const handleSaveStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleForm.name || !styleForm.prompt || !styleForm.image) {
      alert("Missing required fields");
      return;
    }

    setIsLoading(true);
    const newStyle: StyleTemplate = {
      id: styleForm.id || Date.now().toString(),
      name: styleForm.name,
      prompt: styleForm.prompt,
      description: styleForm.description,
      imageUrl: styleForm.image,
      autoGenerate: styleForm.autoGenerate,
      displayOrder: styleForm.displayOrder
    };

    try {
      await storageService.saveStyle(newStyle);
      await loadData();
      setStyleForm({ id: '', name: '', prompt: '', description: '', image: '', autoGenerate: false, displayOrder: 0 });
      showNotification('Style Template Saved');
    } catch (err) {
      alert("Failed to save style.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStyle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this style?')) return;
    setIsDeleting(id);
    try {
      await storageService.deleteStyle(id);
      setStyles(prev => prev.filter(s => s.id !== id));
      showNotification('Style Deleted');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyForm.key || !keyForm.label || !adminSettings) return;

    const newKey: ApiKeyRecord = {
      id: Date.now().toString(),
      key: keyForm.key,
      label: keyForm.label,
      status: 'active',
      addedAt: Date.now()
    };

    const updatedSettings = {
      ...adminSettings,
      geminiApiKeys: [...(adminSettings.geminiApiKeys || []), newKey]
    };

    try {
      await storageService.saveAdminSettings(updatedSettings);
      setAdminSettings(updatedSettings);
      setKeyForm({ key: '', label: '' });
      showNotification('API Key Added to Pool');
    } catch (err) {
      alert("Failed to add key.");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!adminSettings || !confirm('Remove this API key?')) return;
    const updatedKeys = adminSettings.geminiApiKeys?.filter(k => k.id !== id) || [];
    const updatedSettings = { ...adminSettings, geminiApiKeys: updatedKeys };
    try {
      await storageService.saveAdminSettings(updatedSettings);
      setAdminSettings(updatedSettings);
      showNotification('API Key Removed');
    } catch (err) {
      alert("Failed to remove key.");
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !adminSettings) return;

    const newCoupon: Coupon = {
      id: Date.now().toString(),
      code: couponForm.code.toUpperCase().trim(),
      type: couponForm.type,
      value: couponForm.value,
      isActive: true
    };

    const updatedSettings = {
      ...adminSettings,
      coupons: [...(adminSettings.coupons || []), newCoupon]
    };

    try {
      await storageService.saveAdminSettings(updatedSettings);
      setAdminSettings(updatedSettings);
      setCouponForm({ code: '', type: 'percentage', value: 0 });
      showNotification('Coupon Created');
    } catch (err) {
      alert("Failed to create coupon.");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!adminSettings || !confirm('Delete this coupon?')) return;
    const updatedCoupons = adminSettings.coupons?.filter(c => c.id !== id) || [];
    const updatedSettings = { ...adminSettings, coupons: updatedCoupons };
    try {
      await storageService.saveAdminSettings(updatedSettings);
      setAdminSettings(updatedSettings);
      showNotification('Coupon Deleted');
    } catch (err) {
      alert("Failed to delete coupon.");
    }
  };

  const showNotification = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminSettings) {
      try {
        await storageService.saveAdminSettings(adminSettings);
        showNotification('Settings Saved');
      } catch (err) {
        alert("Failed to save settings.");
      }
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSettings) return;
    if (securityForm.currentPassword !== adminSettings.passwordHash) {
      alert("Current password incorrect");
      return;
    }
    const updatedSettings: AdminSettings = {
      ...adminSettings,
      username: securityForm.newUsername || adminSettings.username,
      passwordHash: securityForm.newPassword || adminSettings.passwordHash
    };
    try {
      await storageService.saveAdminSettings(updatedSettings);
      setAdminSettings(updatedSettings);
      setSecurityForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      showNotification('Security Updated');
    } catch (err) {
      alert("Failed to update credentials.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[3rem] shadow-2xl border border-slate-100 text-center">
        <h2 className="text-3xl font-black mb-8 text-slate-800 tracking-tighter">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" placeholder="Username"
            className="w-full px-6 py-4 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 transition-all font-medium"
            value={loginForm.username}
            onChange={e => setLoginForm({...loginForm, username: e.target.value})}
          />
          <input 
            type="password" placeholder="Password"
            className="w-full px-6 py-4 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 transition-all font-medium"
            value={loginForm.password}
            onChange={e => setLoginForm({...loginForm, password: e.target.value})}
          />
          {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
          <button className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black shadow-xl hover:bg-rose-700 transition-all">
            Unlock Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Live</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Controls</span>
        </div>
        <button onClick={handleLogout} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-red-50 hover:text-red-500 transition-all">Logout</button>
      </div>

      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit mx-auto overflow-x-auto">
        {['styles', 'keys', 'coupons', 'payment', 'tracking', 'activities', 'security'].map((t) => (
          <button 
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`px-8 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest whitespace-nowrap ${activeTab === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t === 'keys' ? 'API Pool' : t === 'tracking' ? 'Analytics' : t === 'activities' ? 'Logs' : t === 'coupons' ? 'Coupons' : t}
          </button>
        ))}
      </div>

      {saveStatus && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full text-xs font-black shadow-2xl z-[60] animate-in slide-in-from-top-4">
          {saveStatus}
        </div>
      )}

      {activeTab === 'styles' && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <form onSubmit={handleSaveStyle} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5 sticky top-24">
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl">Manage Styles</h3>
              <input 
                type="text" value={styleForm.name}
                onChange={e => setStyleForm({...styleForm, name: e.target.value})}
                className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                placeholder="Style Name"
              />
              <textarea 
                value={styleForm.prompt}
                onChange={e => setStyleForm({...styleForm, prompt: e.target.value})}
                className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-rose-500 h-32 resize-none font-medium text-sm"
                placeholder="AI Prompt"
              />
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Order</label>
                    <input 
                      type="number" 
                      value={styleForm.displayOrder}
                      onChange={e => setStyleForm({...styleForm, displayOrder: parseInt(e.target.value) || 0})}
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                      placeholder="0"
                    />
                 </div>
                 <div className="flex flex-col justify-end gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="auto-gen-check" 
                        checked={styleForm.autoGenerate}
                        onChange={e => setStyleForm({...styleForm, autoGenerate: e.target.checked})}
                        className="w-5 h-5 accent-rose-500 cursor-pointer"
                      />
                      <label htmlFor="auto-gen-check" className="text-[9px] font-black text-slate-600 cursor-pointer uppercase tracking-tighter">Auto-Gen</label>
                    </div>
                 </div>
              </div>
              <input type="file" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setStyleForm({...styleForm, image: reader.result as string});
                  reader.readAsDataURL(file);
                }
              }} className="hidden" id="admin-style-upload" />
              <label htmlFor="admin-style-upload" className="block w-full py-10 border-2 border-dashed border-slate-200 rounded-3xl text-center cursor-pointer hover:bg-slate-50 overflow-hidden">
                {styleForm.image ? (
                  <img src={styleForm.image} className="h-32 mx-auto object-cover rounded-2xl" alt="Preview" />
                ) : (
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Upload Sample Image</span>
                )}
              </label>
              <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all">Save Style</button>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                <button type="button" onClick={handleExport} className="py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200">Export</button>
                <button type="button" onClick={() => importInputRef.current?.click()} className="py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200">Import</button>
                <input type="file" ref={importInputRef} onChange={handleImport} accept=".json" className="hidden" />
              </div>
            </form>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
            {styles.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex gap-4 hover:shadow-md transition-shadow relative">
                <div className="absolute top-4 right-4 flex gap-1">
                  {s.autoGenerate && (
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-rose-100">Auto</span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-slate-100">Pos: {s.displayOrder || 0}</span>
                </div>
                <img src={s.imageUrl} className="w-20 h-20 rounded-2xl object-cover shadow-sm" alt={s.name} />
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-slate-800 truncate pr-16">{s.name}</h4>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <button onClick={() => setStyleForm({ id: s.id, name: s.name, prompt: s.prompt, description: s.description, image: s.imageUrl, autoGenerate: !!s.autoGenerate, displayOrder: s.displayOrder || 0 })} className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Edit</button>
                    <button onClick={() => handleDeleteStyle(s.id)} className="text-[10px] font-black text-red-400 uppercase tracking-widest">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'coupons' && adminSettings && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Coupon Management</h3>
            <form onSubmit={handleAddCoupon} className="grid sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Coupon Code</label>
                <input 
                  type="text" value={couponForm.code}
                  onChange={e => setCouponForm({...couponForm, code: e.target.value})}
                  placeholder="e.g. SAVE20"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold uppercase outline-none focus:ring-2 focus:ring-rose-500" 
                />
              </div>
              <div className="sm:col-span-3 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                <select 
                  value={couponForm.type}
                  onChange={e => setCouponForm({...couponForm, type: e.target.value as any})}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div className="sm:col-span-3 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Value</label>
                <input 
                  type="number" value={couponForm.value}
                  onChange={e => setCouponForm({...couponForm, value: parseFloat(e.target.value)})}
                  placeholder="e.g. 20"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-rose-500" 
                />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all">Create</button>
              </div>
            </form>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(adminSettings.coupons || []).map(c => (
              <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-black text-lg text-slate-800 tracking-tight">{c.code}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {c.type === 'percentage' ? `${c.value}% OFF` : `${storageService.getCurrencySymbol()}${c.value} OFF`}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${c.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    Active
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteCoupon(c.id)}
                  className="w-full py-2 text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest bg-red-50 rounded-xl transition-colors"
                >
                  Delete Coupon
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activities' && <ActivityLogView />}

      {activeTab === 'tracking' && adminSettings && (
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Meta Pixel Tracking</h3>
            <p className="text-xs text-slate-500 font-medium">Add your Pixel ID to track Instagram traffic and measure conversions.</p>
          </div>
          <form onSubmit={handleSavePaymentConfig} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta Pixel ID</label>
              <input 
                type="text" 
                value={adminSettings.tracking.metaPixelId || ''}
                onChange={e => setAdminSettings({...adminSettings, tracking: {...adminSettings.tracking, metaPixelId: e.target.value}})}
                placeholder="e.g. 123456789012345"
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-mono text-sm outline-none focus:ring-2 focus:ring-rose-500" 
              />
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-2">
               <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Events Automatically Tracked:</p>
               <ul className="text-[10px] font-bold text-rose-400 grid grid-cols-2 gap-2">
                 <li>• PageView (On Load)</li>
                 <li>• Lead (First Photo Upload)</li>
                 <li>• AddToCart</li>
                 <li>• InitiateCheckout</li>
                 <li>• Purchase (Completed Payment)</li>
               </ul>
            </div>
            <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black shadow-xl hover:bg-rose-700 transition-all active:scale-95">Save Analytics Settings</button>
          </form>
        </div>
      )}

      {activeTab === 'keys' && adminSettings && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Add API Key to Pool</h3>
            <form onSubmit={handleAddKey} className="grid sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Key Label</label>
                <input 
                  type="text" value={keyForm.label}
                  onChange={e => setKeyForm({...keyForm, label: e.target.value})}
                  placeholder="e.g. Project A Key"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium outline-none focus:ring-2 focus:ring-rose-500" 
                />
              </div>
              <div className="sm:col-span-6 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key</label>
                <input 
                  type="password" value={keyForm.key}
                  onChange={e => setKeyForm({...keyForm, key: e.target.value})}
                  placeholder="AIzaSy..."
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-mono text-sm outline-none focus:ring-2 focus:ring-rose-500" 
                />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all">Add</button>
              </div>
            </form>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(adminSettings.geminiApiKeys || []).map(k => (
              <div key={k.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800">{k.label}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">••••••••{k.key.slice(-4)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${k.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {k.status}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteKey(k.id)}
                  className="w-full py-2 text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest bg-red-50 rounded-xl transition-colors"
                >
                  Remove from Pool
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payment' && adminSettings && (
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Razorpay Configuration</h3>
          <form onSubmit={handleSavePaymentConfig} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Key ID</label>
              <input 
                type="text" value={adminSettings.payment.keyId}
                onChange={e => setAdminSettings({...adminSettings, payment: {...adminSettings.payment, keyId: e.target.value}})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-mono text-sm outline-none focus:ring-2 focus:ring-rose-500" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
                <input 
                  type="text" value={adminSettings.payment.currency}
                  onChange={e => setAdminSettings({...adminSettings, payment: {...adminSettings.payment, currency: e.target.value}})}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black uppercase" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price</label>
                <input 
                  type="number" step="0.01" value={adminSettings.payment.photoPrice}
                  onChange={e => setAdminSettings({...adminSettings, payment: {...adminSettings.payment, photoPrice: parseFloat(e.target.value)}})}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-xl font-black" 
                />
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black shadow-xl hover:bg-rose-700 transition-all">Save Changes</button>
          </form>
        </div>
      )}

      {activeTab === 'security' && adminSettings && (
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Admin Credentials</h3>
          <form onSubmit={handleUpdateSecurity} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <input 
                type="text" value={securityForm.newUsername}
                onChange={e => setSecurityForm({...securityForm, newUsername: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
              <input 
                type="password" required
                value={securityForm.currentPassword}
                onChange={e => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
              <input 
                type="password" 
                placeholder="Leave blank to keep same"
                value={securityForm.newPassword}
                onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium" 
              />
            </div>
            <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-2xl font-black shadow-xl hover:bg-red-700 transition-all">Update Security</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminView;
