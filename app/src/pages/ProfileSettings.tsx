import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [planName, setPlanName] = useState('Free Plan');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  
  const [userProfile, setUserProfile] = useState({ full_name: 'Admin Gudang', phone: '-', avatar_url: '', company_name: '' });
  const [userRole, setUserRole] = useState('Master Operator • Packer 01');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', avatar_url: '', company_name: '' });
  const [videoQuality, setVideoQuality] = useState(localStorage.getItem('buktiin_video_quality') || '720p');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUserEmail(session.user.email || '');
        const meta = session.user.user_metadata || {};
        
        let parentId = session.user.id;
        let isSub = false;
        let role = 'Master Operator • Packer 01';

        // Check if sub account
        const { data: subData } = await supabase.from('sub_accounts').select('parent_id').eq('child_id', session.user.id).single();
        if (subData) {
          parentId = subData.parent_id;
          isSub = true;
          // Get siblings to find rank
          const { data: siblings } = await supabase.from('sub_accounts').select('child_id').eq('parent_id', parentId).order('created_at', { ascending: true });
          const index = siblings?.findIndex(s => s.child_id === session.user.id) || 0;
          role = `Staff Operator • Packer ${String(index + 2).padStart(2, '0')}`;
        }
        setUserRole(role);

        // Fetch parent user's metadata to get company name if we are a sub account
        let companyNameStr = meta.company_name || '';
        if (isSub && !companyNameStr) {
           companyNameStr = 'Toko Anda (Sub Account)';
        }

        const profile = {
          full_name: meta.full_name || 'Admin Gudang',
          phone: meta.phone || '-',
          company_name: companyNameStr,
          avatar_url: meta.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPAXSkUc_dLhkZh4Y7ZV49jywLUrYj7TB6LZXqBoPmNBPkII_yNVIa9s-hwCaZ7wYj6_H9w__QWjYUSCOKjsxFH0crqQ7tKoEFg_qD1JTYl0bX37peDAHRsBA-zf_vIDcQcUlZMUVdcrfDltV5-k5yAdBjO2bUiJKI59PLG9Yd9ARqz4B30A1-TbZldx_umceXjERgyvgcWJN4wOaVhbEFuGglnZrElAnkbDhqpBjhWwn0qTx2rvoK'
        };
        setUserProfile(profile);
        setEditForm({ full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url, company_name: profile.company_name });
        
        supabase
          .from('subscriptions')
          .select('*, plans(*)')
          .eq('user_id', parentId) // Use parentId for plan check
          .eq('status', 'ACTIVE')
          .limit(1)
          .then(({ data }) => {
             if (data && data.length > 0 && data[0].plans) {
                setPlanName(data[0].plans.name + ' Plan');
             }
          });
      }
    });

    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        const savedCam = localStorage.getItem('buktiin_camera_id');
        if (savedCam && videoDevices.find(d => d.deviceId === savedCam)) {
          setSelectedCamera(savedCam);
        } else if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      })
      .catch(err => console.error("Error enumerating devices:", err));
  }, []);

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCamera(val);
    localStorage.setItem('buktiin_camera_id', val);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setEditForm(prev => ({ ...prev, avatar_url: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { full_name: editForm.full_name, phone: editForm.phone, avatar_url: editForm.avatar_url, company_name: editForm.company_name }
    });
    if (error) {
      alert("Gagal mengupdate profil: " + error.message);
    } else {
      setUserProfile(prev => ({ ...prev, full_name: editForm.full_name, phone: editForm.phone, avatar_url: editForm.avatar_url, company_name: editForm.company_name }));
      setShowEditModal(false);
      alert("Profil berhasil diupdate!");
    }
  };

  const handleQualityChange = (quality: string) => {
    setVideoQuality(quality);
    localStorage.setItem('buktiin_video_quality', quality);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const marketplaces = [
    { id: 'shopee', name: 'Shopee', color: 'bg-orange-100 text-orange-600', letter: 'S' },
    { id: 'tokopedia', name: 'Tokopedia', color: 'bg-green-100 text-green-600', letter: 'T' },
    { id: 'tiktok', name: 'TikTok Shop', color: 'bg-black text-white', letter: 'TK' },
    { id: 'lazada', name: 'Lazada', color: 'bg-blue-100 text-blue-800', letter: 'L' },
    { id: 'blibli', name: 'Blibli', color: 'bg-blue-50 text-blue-500', letter: 'B' },
    { id: 'bukalapak', name: 'Bukalapak', color: 'bg-red-100 text-red-700', letter: 'BL' }
  ];

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-lg max-w-6xl mx-auto w-full space-y-lg">
        <div className="md:hidden flex justify-between items-center w-full pb-md border-b border-ui-divider mb-lg">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Profile & Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          
          <section className="md:col-span-8 bg-surface-container-lowest border border-ui-divider p-xl rounded-xl flex flex-col md:flex-row gap-xl hover:border-primary transition-colors duration-200">
            <div className="relative group cursor-pointer w-32 h-32 flex-shrink-0" onClick={() => setShowEditModal(true)}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-container shadow-sm bg-surface-variant flex items-center justify-center">
                {userProfile.avatar_url ? (
                  <img className="w-full h-full object-cover" alt="Profile Picture" src={userProfile.avatar_url} />
                ) : (
                  <span className="text-4xl text-on-surface-variant font-bold">{userProfile.full_name.charAt(0)}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-white p-xs rounded-full border-2 border-white shadow-md">
                <span className="material-symbols-outlined !text-sm">edit</span>
              </div>
            </div>
            <div className="flex-1 space-y-md">
              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{userProfile.full_name}</h2>
                <p className="text-primary font-code-sm text-code-sm uppercase tracking-widest font-bold mt-1">{userRole}</p>
                <p className="text-on-surface-variant font-body-md mt-1 italic opacity-80">{userProfile.company_name || 'Toko/Perusahaan Belum Diisi'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-4">
                <div className="space-y-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant">Email Address</label>
                  <div className="flex items-center gap-sm px-md py-sm bg-surface-container-low border border-ui-divider rounded">
                    <span className="material-symbols-outlined text-on-surface-variant !text-lg">mail</span>
                    <span className="font-body-md text-body-md truncate">{userEmail}</span>
                  </div>
                </div>
                <div className="space-y-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant">Phone Number</label>
                  <div className="flex items-center gap-sm px-md py-sm bg-surface-container-low border border-ui-divider rounded">
                    <span className="material-symbols-outlined text-on-surface-variant !text-lg">call</span>
                    <span className="font-body-md text-body-md truncate">{userProfile.phone}</span>
                  </div>
                </div>
              </div>
              <div className="pt-md">
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="px-lg py-sm bg-primary text-white font-bold hover:opacity-90 transition-opacity rounded-DEFAULT border-b-2 border-primary-fixed-dim active:scale-95 duration-150">
                  Update Personal Info
                </button>
              </div>
            </div>
          </section>

          <section className="md:col-span-4 bg-surface-container-low border border-ui-divider p-xl rounded-xl flex flex-col justify-between overflow-hidden relative hover:border-primary transition-colors duration-200">
            <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined !text-9xl">verified_user</span>
            </div>
            <div className="space-y-md">
              <div className="flex justify-between items-start">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Current Plan</label>
                <span className="bg-status-success text-white px-md py-xs font-label-caps text-[10px] rounded-full uppercase tracking-tighter">Active</span>
              </div>
              <h3 className="font-headline-md text-headline-md font-bold text-secondary">{planName}</h3>
              <p className="text-on-surface-variant text-sm">Paket berlangganan aktif yang terkoneksi dengan database Supabase.</p>
            </div>
            <div className="mt-xl space-y-md">
              <button 
                onClick={() => navigate('/plans')}
                className="w-full py-sm border border-secondary text-secondary font-bold hover:bg-secondary hover:text-white transition-all rounded-DEFAULT active:scale-95 duration-150">
                Manage Subscription
              </button>
            </div>
          </section>

          <section className="md:col-span-12 space-y-lg mt-md">
            <div className="flex items-center gap-md">
              <div className="h-1 w-8 bg-primary"></div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">App Hardware & Configuration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              
              <div className="bg-surface-container-lowest border border-ui-divider p-lg rounded-xl space-y-md hover:border-primary transition-colors duration-200">
                <div className="flex items-center gap-sm text-primary">
                  <span className="material-symbols-outlined">videocam</span>
                  <span className="font-label-caps text-label-caps">Recording Device</span>
                </div>
                <div className="space-y-xs">
                  <label className="text-xs text-on-surface-variant">Active Camera Source</label>
                  <select 
                    value={selectedCamera}
                    onChange={handleCameraChange}
                    className="w-full bg-surface-container-low border border-ui-divider p-md font-body-md text-body-md focus:border-primary focus:ring-0 rounded-DEFAULT"
                  >
                    {cameras.length === 0 && <option value="">Loading cameras...</option>}
                    {cameras.map(cam => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Camera ${cam.deviceId.substring(0,5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between pt-sm">
                  <span className="text-xs text-on-surface-variant">Camera Status</span>
                  <div className="flex items-center gap-xs">
                    <div className="w-2 h-2 rounded-full bg-status-success animate-pulse"></div>
                    <span className="text-xs font-bold text-status-success uppercase">Online & Saved</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-ui-divider p-lg rounded-xl space-y-md hover:border-primary transition-colors duration-200">
                <div className="flex items-center gap-sm text-primary">
                  <span className="material-symbols-outlined">settings_overscan</span>
                  <span className="font-label-caps text-label-caps">Video Quality</span>
                </div>
                <div className="grid grid-cols-2 gap-sm">
                  <button onClick={() => handleQualityChange('720p')} className={`px-md py-md border-2 transition-all rounded-DEFAULT flex flex-col items-center gap-xs ${videoQuality === '720p' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-ui-divider text-on-surface-variant hover:border-primary/50'}`}>
                    <span className="font-bold">720p</span>
                    <span className="text-[10px] font-code-sm">STANDARD</span>
                  </button>
                  <button onClick={() => handleQualityChange('1080p')} className={`px-md py-md border-2 transition-all rounded-DEFAULT flex flex-col items-center gap-xs ${videoQuality === '1080p' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-ui-divider text-on-surface-variant hover:border-primary/50'}`}>
                    <span className="font-bold">1080p</span>
                    <span className="text-[10px] font-code-sm">HIGH-DEF</span>
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant text-center">Note: 1080p requires at least 10Mbps upload speed.</p>
              </div>

              <div className="bg-surface-container-lowest border border-ui-divider p-lg rounded-xl space-y-md hover:border-primary transition-colors duration-200 row-span-2">
                <div className="flex items-center gap-sm text-primary">
                  <span className="material-symbols-outlined">hub</span>
                  <span className="font-label-caps text-label-caps">Marketplace Sync</span>
                </div>
                <div className="space-y-sm max-h-[300px] overflow-y-auto pr-2">
                  {marketplaces.map(mp => (
                    <div key={mp.id} className="flex items-center justify-between p-sm border border-ui-divider bg-surface-container-low rounded opacity-70">
                      <div className="flex items-center gap-md">
                        <div className={`w-8 h-8 rounded-sm ${mp.color} flex items-center justify-center font-bold`}>{mp.letter}</div>
                        <span className="font-body-md text-body-md font-bold">{mp.name}</span>
                      </div>
                      <span className="bg-surface-variant text-on-surface-variant px-2 py-1 text-[10px] font-bold rounded uppercase">Coming Soon</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>

          <section className="md:col-span-12 border border-error/20 bg-error-container/10 p-lg rounded-xl flex flex-col md:flex-row justify-between items-center gap-md mt-md">
            <div>
              <h4 className="font-bold text-error">Danger Zone</h4>
              <p className="text-sm text-error/80">Keluar dari akun Anda saat ini atau hapus data rekaman.</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-lg py-sm border border-error text-error font-bold hover:bg-error hover:text-white transition-all rounded-DEFAULT active:scale-95 flex items-center gap-sm"
            >
              <span className="material-symbols-outlined">logout</span>
              Sign Out
            </button>
          </section>

        </div>
      </div>

      <footer className="mt-auto flex flex-col md:flex-row justify-between items-center w-full px-lg py-md border-t border-ui-divider bg-surface">
        <div className="font-label-caps text-label-caps text-on-surface-variant mb-md md:mb-0">
          © 2026 Nafindo Group. All Rights Reserved.
        </div>
        <div className="flex gap-lg items-center">
          <span className="font-code-sm text-code-sm text-on-surface-variant opacity-60">v4.0.1-stable</span>
          <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors" href="#">
            Developed by Nafindo Group
          </a>
        </div>
      </footer>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-lg backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-xl overflow-hidden shadow-xl border border-ui-divider flex flex-col p-lg gap-md">
            <h3 className="font-headline-md font-bold text-on-surface">Update Personal Info</h3>
            
            <div className="space-y-md mt-sm">
              <div className="flex flex-col items-center gap-sm mb-md">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-variant border-2 border-primary flex items-center justify-center">
                  {editForm.avatar_url ? (
                    <img src={editForm.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
                  )}
                </div>
                <label className="cursor-pointer bg-surface-container border border-ui-divider px-md py-xs rounded text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors font-bold">
                  Upload Foto
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              <div className="space-y-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Nama Lengkap</label>
                <input 
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-md py-sm bg-surface-container-lowest border border-ui-divider rounded-DEFAULT focus:border-primary outline-none transition-colors font-body-md text-on-surface"
                />
              </div>
              
              <div className="space-y-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Nama Toko / Perusahaan</label>
                <input 
                  type="text"
                  value={editForm.company_name}
                  onChange={e => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full px-md py-sm bg-surface-container-lowest border border-ui-divider rounded-DEFAULT focus:border-primary outline-none transition-colors font-body-md text-on-surface"
                  placeholder="Gudang Utama (Watermark Video)"
                />
              </div>

              <div className="space-y-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant">No. Telepon</label>
                <input 
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-md py-sm bg-surface-container-lowest border border-ui-divider rounded-DEFAULT focus:border-primary outline-none transition-colors font-body-md text-on-surface"
                />
              </div>
            </div>
            
            <div className="flex gap-sm mt-md">
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-sm bg-surface-container border border-ui-divider text-on-surface font-bold rounded-DEFAULT hover:bg-surface-variant transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveProfile}
                className="flex-1 py-sm bg-primary text-white font-bold rounded-DEFAULT hover:opacity-90 transition-opacity"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
