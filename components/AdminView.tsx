
import React, { useState, useEffect } from 'react';
import { StyleTemplate, AdminSettings, Coupon, TransactionRecord, SampleVideo } from '../types';
import { storageService } from '../services/storage';
import { logger } from '../services/logger';
import ActivityLogView from './ActivityLogView';

const AdminView: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(storageService.isAdminLoggedIn());
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [styles, setStyles] = useState<StyleTemplate[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'styles' | 'samples' | 'tx' | 'coupons' | 'payment' | 'activities' | 'security'>('styles');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const [styleForm, setStyleForm] = useState<Partial<StyleTemplate>>({ name: '', prompt: '', description: '', imageUrl: '', autoGenerate: false });
  const [sampleForm, setSampleForm] = useState<Partial<SampleVideo>>({ title: '', videoUrl: '', thumbnailUrl: '' });
  const [couponForm, setCouponForm] = useState({ id: '', code: '', type: 'percentage' as 'percentage' | 'fixed', value: 0, isActive: true });
  // Fix: Added missing state variables to handle coupon code input independent of couponForm object
  const [couponCode, setCouponCode] = useState('');
  const [securityForm, setSecurityForm] = useState({ username: '', password: '', confirmPassword: '' });

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, settings, tx] = await Promise.all([
        storageService.getStyles(true),
        storageService.getAdminSettings(),
        storageService.getTransactions()
      ]);
      setStyles(s);
      setAdminSettings(settings);
      setTransactions(tx);
      setSecurityForm({ username: settings.username, password: '', confirmPassword: '' });
    } catch (err) {
      logger.error('Admin', 'Failed to load data', err);
    } finally {
      setIsLoading(false);
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

  const showNotification = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storageService.saveStyle({
        ...styleForm,
        id: styleForm.id || Date.now().toString(),
        displayOrder: styleForm.displayOrder || styles.length
      } as StyleTemplate);
      showNotification('Style Saved');
      setStyleForm({ name: '', prompt: '', description: '', imageUrl: '', autoGenerate: false });
      loadData();
    } catch (err) { alert("Save failed"); }
  };

  const handleSaveSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSettings) return;
    const newSample = { ...sampleForm, id: sampleForm.id || Date.now().toString(), displayOrder: adminSettings.videoSamples?.length || 0 } as SampleVideo;
    const updatedSamples = sampleForm.id 
      ? adminSettings.videoSamples?.map(s => s.id === sampleForm.id ? newSample : s) || []
      : [...(adminSettings.videoSamples || []), newSample];
    
    try {
      await storageService.saveAdminSettings({ ...adminSettings, videoSamples: updatedSamples });
      showNotification('Sample Video Saved');
      setSampleForm({ title: '', videoUrl: '', thumbnailUrl: '' });
      loadData();
    } catch (err) { alert("Save failed"); }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSettings) return;
    // Fix: Using the dedicated couponCode state to ensure current code is captured
    const newCoupon: Coupon = { ...couponForm, id: couponForm.id || Date.now().toString(), code: couponCode.toUpperCase().trim() };
    const updatedCoupons = couponForm.id 
      ? adminSettings.coupons?.map(c => c.id === couponForm.id ? newCoupon : c) || []
      : [...(adminSettings.coupons || []), newCoupon];

    try {
      await storageService.saveAdminSettings({ ...adminSettings, coupons: updatedCoupons });
      setCouponForm({ id: '', code: '', type: 'percentage', value: 0, isActive: true });
      // Fix: Clearing the temporary couponCode state after successful save
      setCouponCode('');
      showNotification('Coupon Saved');
      loadData();
    } catch (err) { alert("Save failed"); }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSettings) return;
    if (securityForm.password && securityForm.password !== securityForm.confirmPassword) {
      return alert("Passwords do not match");
    }
    try {
      const updated = { 
        ...adminSettings, 
        username: securityForm.username,
        passwordHash: securityForm.password || adminSettings.passwordHash 
      };
      await storageService.saveAdminSettings(updated);
      showNotification('Credentials Updated');
      setSecurityForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) { alert("Update failed"); }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[3rem] shadow-2xl border border-slate-100 text-center">
        <h2 className="text-3xl font-black mb-8 text-slate-800 tracking-tighter">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" placeholder="Username" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-medium" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-medium" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
          {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
          <button className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black shadow-xl">Unlock Panel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit mx-auto overflow-x-auto scrollbar-hide">
        {['styles', 'samples', 'tx', 'coupons', 'payment', 'activities', 'security'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-8 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest whitespace-nowrap ${activeTab === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
            {t === 'tx' ? 'History' : t}
          </button>
        ))}
      </div>

      {saveStatus && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full text-xs font-black shadow-2xl z-[60] animate-in slide-in-from-top-4">
          {saveStatus}
        </div>
      )}

      {/* Styles Tab */}
      {activeTab === 'styles' && (
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Add New Style</h3>
            <form onSubmit={handleSaveStyle} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder="Style Name" className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={styleForm.name} onChange={e => setStyleForm({...styleForm, name: e.target.value})} />
                <input type="text" placeholder="Image URL (Base64 or Cloud)" className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={styleForm.imageUrl} onChange={e => setStyleForm({...styleForm, imageUrl: e.target.value})} />
              </div>
              <textarea placeholder="AI Prompt" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none h-32" value={styleForm.prompt} onChange={e => setStyleForm({...styleForm, prompt: e.target.value})} />
              <input type="text" placeholder="Short Description" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={styleForm.description} onChange={e => setStyleForm({...styleForm, description: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg">Save Style</button>
            </form>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {styles.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                <img src={s.imageUrl} className="w-full aspect-square object-cover rounded-xl" alt={s.name} />
                <h4 className="font-black text-slate-800 uppercase text-sm">{s.name}</h4>
                <div className="flex gap-4">
                  <button onClick={() => setStyleForm(s)} className="text-xs font-black text-indigo-600 uppercase">Edit</button>
                  <button onClick={async () => { if(confirm('Delete?')) { await storageService.deleteStyle(s.id); loadData(); } }} className="text-xs font-black text-red-500 uppercase">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Samples Tab */}
      {activeTab === 'samples' && (
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Add Video Sample</h3>
            <form onSubmit={handleSaveSample} className="space-y-6">
              <input type="text" placeholder="Video Title" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={sampleForm.title} onChange={e => setSampleForm({...sampleForm, title: e.target.value})} />
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder="Video URL" className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={sampleForm.videoUrl} onChange={e => setSampleForm({...sampleForm, videoUrl: e.target.value})} />
                <input type="text" placeholder="Thumbnail URL" className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={sampleForm.thumbnailUrl} onChange={e => setSampleForm({...sampleForm, thumbnailUrl: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">Save Sample Video</button>
            </form>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {adminSettings?.videoSamples?.map(v => (
              <div key={v.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                <video src={v.videoUrl} poster={v.thumbnailUrl} className="w-full aspect-video object-cover rounded-xl" muted />
                <h4 className="font-black text-slate-800 uppercase text-sm">{v.title}</h4>
                <div className="flex gap-4">
                  <button onClick={() => setSampleForm(v)} className="text-xs font-black text-indigo-600 uppercase">Edit</button>
                  <button onClick={async () => { 
                    const filtered = adminSettings.videoSamples?.filter(x => x.id !== v.id);
                    await storageService.saveAdminSettings({...adminSettings, videoSamples: filtered});
                    loadData();
                  }} className="text-xs font-black text-red-500 uppercase">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'tx' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-10 border-b border-slate-100 flex justify-between items-center">
             <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">History</h3>
             <button onClick={loadData} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
               <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
             </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment ID</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Render</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map(t => (
                  <tr key={t.razorpay_payment_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <p className="text-xs font-black text-slate-800">{t.user_email}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(t.created_at || '').toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block">{t.razorpay_payment_id}</p>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'refund_requested' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${t.render_status === 'failed' ? 'bg-red-50 text-red-500' : t.render_status === 'completed' ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-400'}`}>
                        {t.render_status || 'unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Configure Coupons</h3>
            <form onSubmit={handleSaveCoupon} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Fix: Binding value to couponCode and using setCouponCode to resolve name errors */}
                <input type="text" placeholder="Code (e.g. LOVE20)" className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold uppercase" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} />
                <select className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={couponForm.type} onChange={e => setCouponForm({...couponForm, type: e.target.value as any})}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <input type="number" placeholder="Discount Value" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: parseFloat(e.target.value)})} />
              <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg">Save Coupon</button>
            </form>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {adminSettings?.coupons?.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <h4 className="font-black text-slate-800 uppercase text-lg">{c.code}</h4>
                <p className="text-xs font-bold text-slate-500">{c.type === 'percentage' ? `${c.value}% Off` : `${storageService.getCurrencySymbol()} ${c.value} Off`}</p>
                <div className="flex gap-4 mt-6">
                  {/* Fix: Calling setCouponCode with existing coupon data to resolve name error */}
                  <button onClick={() => { setCouponForm(c); setCouponCode(c.code); }} className="text-xs font-black text-indigo-600">Edit</button>
                  <button onClick={async () => { 
                    const filtered = adminSettings.coupons?.filter(x => x.id !== c.id);
                    await storageService.saveAdminSettings({...adminSettings, coupons: filtered});
                    loadData();
                  }} className="text-xs font-black text-red-500">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && adminSettings && (
        <div className="max-w-3xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">API & Pricing</h3>
          <form onSubmit={async (e) => { e.preventDefault(); await storageService.saveAdminSettings(adminSettings); showNotification('Settings Saved'); }} className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kling AI Keys</label>
              <input type="text" placeholder="Access Key" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-mono text-xs" value={adminSettings.klingAccessKey} onChange={e => setAdminSettings({...adminSettings, klingAccessKey: e.target.value})} />
              <input type="password" placeholder="Secret Key" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-mono text-xs" value={adminSettings.klingSecretKey} onChange={e => setAdminSettings({...adminSettings, klingSecretKey: e.target.value})} />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing (Base)</label>
              <input type="number" placeholder="Photo Price" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={adminSettings.payment.photoPrice} onChange={e => setAdminSettings({...adminSettings, payment: {...adminSettings.payment, photoPrice: parseFloat(e.target.value)}})} />
              <input type="number" placeholder="Video Price" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={adminSettings.payment.videoBasePrice} onChange={e => setAdminSettings({...adminSettings, payment: {...adminSettings.payment, videoBasePrice: parseFloat(e.target.value)}})} />
            </div>
            <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl">Save Config</button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="max-w-3xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Admin Security</h3>
          <form onSubmit={handleUpdateSecurity} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={securityForm.username} onChange={e => setSecurityForm({...securityForm, username: e.target.value})} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={securityForm.password} onChange={e => setSecurityForm({...securityForm, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" value={securityForm.confirmPassword} onChange={e => setSecurityForm({...securityForm, confirmPassword: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black shadow-xl">Update Credentials</button>
          </form>
        </div>
      )}

      {activeTab === 'activities' && <ActivityLogView />}
    </div>
  );
};

export default AdminView;
