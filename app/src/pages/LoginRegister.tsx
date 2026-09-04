import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getDeviceId, registerDeviceSession } from '../lib/deviceSession';
import logoImg from '../assets/images/logo.png';

export default function LoginRegister() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (!isLogin && !termsAccepted) {
        throw new Error("Anda wajib menyetujui Syarat & Ketentuan serta Kebijakan Privasi.");
      }

      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (authData?.user) {
          await registerDeviceSession(authData.user.id, getDeviceId());

          // Check if this account is a registered staff / sub-account
          try {
            const { data: subRow } = await supabase
              .from('sub_accounts')
              .select('parent_id')
              .eq('child_id', authData.user.id)
              .maybeSingle();

            if (subRow) {
              localStorage.setItem('isSubAccount', 'true');
              localStorage.setItem('parentId', subRow.parent_id);
            } else {
              localStorage.removeItem('isSubAccount');
              localStorage.removeItem('parentId');
            }
          } catch (_) {}
        }
      } else {
        const { data: authData, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
              company_name: companyName,
              phone: phone
            }
          }
        });
        if (error) throw error;
        if (authData?.user) {
          await registerDeviceSession(authData.user.id, getDeviceId());

          // Inisialisasi FREE Plan dengan masa aktif 7 hari
          try {
            const { data: freePlan } = await supabase
              .from('plans')
              .select('id, name')
              .ilike('name', 'FREE')
              .maybeSingle();

            if (freePlan) {
              const startDate = new Date();
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + 7);

              await supabase.from('subscriptions').insert({
                user_id: authData.user.id,
                plan_id: freePlan.id,
                status: 'ACTIVE',
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                payment_method: 'FREE_TRIAL_7D',
                amount_paid: 0,
                user_email: email,
                user_name: fullName || email,
                notes: 'Free Trial 7 Hari (Pendaftaran Akun Baru)'
              });
            }
          } catch (planErr) {
            console.warn('Auto create free 7d plan error:', planErr);
          }
        }
      }
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResetSuccess(false);

    try {
      if (!email || !email.includes('@')) {
        throw new Error('Mohon masukkan alamat email yang valid.');
      }

      const redirectUrl = `${window.location.origin}${window.location.pathname}#/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) throw error;
      setResetSuccess(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setErrorMsg(err.message || 'Gagal mengirim email reset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md overflow-x-hidden">
      {/* Hero/Auth Container */}
      <main className="flex-grow flex flex-col md:flex-row industrial-grid">
        {/* Left Side: Visual/Branding */}
        <div className="hidden md:flex md:w-5/12 bg-inverse-surface text-surface-background p-xl flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB5fO_W_UzmtUje6OHgiFtjgbqrdCWmGsbtRiYFlyd-T4PTIVNbM4OKO4vEApf6TP_ix6sK_YV4KwheDgMYMIyIctfxntLZyKpOJ1asXra31nT8HOopGB2MO18XMjifuAYrXSHkU_jBQj7mfBSpDGZlfOUfyQ4g2qoRAYGmhMd8frcZhGsQghdgIUWmdnE7bsLk21yqFMoHPbBgX6ozdJcE6Z0Kgy_y1wNg1Ycnjn1iWX3ya0ADcHLE')" }}></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 font-headline-md text-headline-md font-bold text-primary-fixed">
              <img src={logoImg} alt="Buktiin Logo" className="w-8 h-8 rounded-lg shadow-sm" />
              BUKTIIN
            </div>
            <div className="mt-md">
              <h1 className="font-display-lg text-display-lg leading-tight">Bukti Packing,<br/><span className="text-primary-fixed">Aman Kirim</span></h1>
              <p className="font-body-lg text-body-lg text-surface-variant mt-md max-w-md">
                Digitalisasi rekaman packing gudang Anda untuk transparansi penuh dan keamanan pengiriman.
              </p>
            </div>
          </div>
          <div className="relative z-10 space-y-md">
            <div className="p-md border border-outline-variant bg-surface-container-highest/10 backdrop-blur-md rounded-DEFAULT">
              <div className="flex items-center gap-2 mb-sm text-primary-fixed">
                <span className="material-symbols-outlined">verified</span>
                <span className="font-label-caps text-label-caps">QUALITY ASSURANCE</span>
              </div>
              <div className="font-code-sm text-code-sm text-surface-variant">
                SYSTEM_STATUS: OPERATIONAL<br/>
                UPTIME: 99.9%<br/>
                REGION: ID-JKT-01
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side: Registration Form */}
        <div className="flex-grow flex items-center justify-center p-md md:p-xl">
          <div className="w-full max-w-md space-y-xl">
            <div className="space-y-sm">
              <div className="md:hidden flex items-center gap-3 font-headline-md text-headline-md font-bold text-primary mb-lg">
                <img src={logoImg} alt="Buktiin Logo" className="w-8 h-8 rounded-lg shadow-sm" />
                BUKTIIN
              </div>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg">
                {isForgotPassword ? 'Lupa Kata Sandi' : (isLogin ? 'Selamat Datang' : 'Mulai Sekarang')}
              </h2>
              <p className="text-on-surface-variant font-body-md">
                {isForgotPassword 
                  ? 'Masukkan email akun Anda untuk menerima tautan pemulihan kata sandi.'
                  : (isLogin ? 'Masuk ke akun gudang Anda.' : 'Lengkapi data untuk membuat akun gudang Anda.')}
              </p>
            </div>

            {isForgotPassword ? (
              <div className="space-y-md">
                {errorMsg && (
                  <div className="bg-error-container text-on-error-container p-sm rounded text-sm mb-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {resetSuccess ? (
                  <div className="bg-status-success/10 border border-status-success/30 text-status-success p-md rounded-DEFAULT space-y-sm text-center">
                    <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                    <p className="font-bold text-sm">Tautan Terkirim!</p>
                    <p className="text-xs text-on-surface-variant">
                      Instruksi reset kata sandi telah dikirim ke <strong>{email}</strong>. Silakan periksa kotak masuk atau spam email Anda.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(false); setResetSuccess(false); }}
                      className="mt-2 w-full py-2 bg-status-success text-white font-bold rounded-DEFAULT text-xs hover:opacity-90 transition-opacity"
                    >
                      Kembali ke Halaman Masuk
                    </button>
                  </div>
                ) : (
                  <form className="space-y-md" onSubmit={handleForgotPassword}>
                    <div className="space-y-xs">
                      <label className="font-label-caps text-label-caps text-on-surface-variant block">EMAIL AKUN</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                        <input 
                          className="w-full pl-[48px] pr-md py-md bg-surface border border-ui-divider rounded-DEFAULT focus:ring-0 focus:border-primary focus:border-2 transition-all font-body-md outline-none" 
                          placeholder="email@toko.com" 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button 
                      disabled={loading}
                      className="w-full py-md bg-primary-container hover:bg-primary text-on-primary font-bold rounded-DEFAULT flex items-center justify-center gap-sm transition-all active:scale-95 group relative overflow-hidden" 
                      type="submit"
                    >
                      <span className="relative z-10 uppercase tracking-wider">
                        {loading ? 'Mengirim Tautan...' : 'Kirim Tautan Reset Kata Sandi'}
                      </span>
                      <span className="material-symbols-outlined relative z-10 transition-transform group-hover:translate-x-1">send</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(false); setErrorMsg(''); }}
                      className="w-full py-2 text-xs text-on-surface-variant hover:text-primary font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      <span>Kembali ke Masuk</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form className="space-y-md" onSubmit={handleSubmit}>
                {errorMsg && (
                  <div className="bg-error-container text-on-error-container p-sm rounded text-sm mb-md">
                    {errorMsg}
                  </div>
                )}
                
                {!isLogin && (
                  <>
                    <div className="space-y-xs">
                      <label className="font-label-caps text-label-caps text-on-surface-variant block">NAMA LENGKAP</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                        <input 
                          className="w-full pl-[48px] pr-md py-md bg-surface border border-ui-divider rounded-DEFAULT focus:ring-0 focus:border-primary focus:border-2 transition-all font-body-md outline-none" 
                          placeholder="Contoh: Budi Santoso" 
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required={!isLogin}
                        />
                      </div>
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-caps text-label-caps text-on-surface-variant block">NAMA TOKO / PERUSAHAAN</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">store</span>
                        <input 
                          className="w-full pl-[48px] pr-md py-md bg-surface border border-ui-divider rounded-DEFAULT focus:ring-0 focus:border-primary focus:border-2 transition-all font-body-md outline-none" 
                          placeholder="Contoh: Gudang Elektronik" 
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required={!isLogin}
                        />
                      </div>
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-caps text-label-caps text-on-surface-variant block">NO. TELEPON</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">call</span>
                        <input 
                          className="w-full pl-[48px] pr-md py-md bg-surface border border-ui-divider rounded-DEFAULT focus:ring-0 focus:border-primary focus:border-2 transition-all font-body-md outline-none" 
                          placeholder="0812..." 
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="space-y-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant block">EMAIL</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                    <input 
                      className="w-full pl-[48px] pr-md py-md bg-surface border border-ui-divider rounded-DEFAULT focus:ring-0 focus:border-primary focus:border-2 transition-all font-body-md outline-none" 
                      placeholder="email@toko.com" 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-label-caps text-label-caps text-on-surface-variant block">KATA SANDI</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => { setIsForgotPassword(true); setErrorMsg(''); setResetSuccess(false); }}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Lupa kata sandi?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                    <input 
                      className="w-full pl-[48px] pr-[48px] py-md bg-surface border border-ui-divider rounded-DEFAULT focus:ring-0 focus:border-primary focus:border-2 transition-all font-body-md outline-none" 
                      placeholder="Min. 8 Karakter" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      className="absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors z-10" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                
                {!isLogin && (
                  <div className="flex items-start gap-sm py-sm">
                    <input 
                      className="mt-1 w-4 h-4 text-primary border-ui-divider rounded-DEFAULT focus:ring-primary" 
                      id="terms" 
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <label className="font-body-md text-on-surface-variant leading-tight" htmlFor="terms">
                      Saya menyetujui <Link to="/terms" className="text-primary font-bold hover:underline" target="_blank">Syarat & Ketentuan</Link> serta <Link to="/privacy" className="text-primary font-bold hover:underline" target="_blank">Kebijakan Privasi</Link> BUKTIIN.
                    </label>
                  </div>
                )}
                <button 
                  disabled={loading}
                  className="w-full py-md bg-primary-container hover:bg-primary text-on-primary font-bold rounded-DEFAULT flex items-center justify-center gap-sm transition-all active:scale-95 group relative overflow-hidden" 
                  type="submit"
                >
                  <span className="shimmer-bg absolute inset-0 pointer-events-none"></span>
                  <span className="relative z-10 uppercase tracking-wider">{loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar Sekarang')}</span>
                  <span className="material-symbols-outlined relative z-10 transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              </form>
            )}

            {!isForgotPassword && (
              <div className="pt-lg border-t border-ui-divider text-center space-y-2">
                <p className="font-body-md text-on-surface-variant">
                  {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'} 
                  <button 
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
                    className="text-primary font-bold hover:underline ml-1"
                  >
                    {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
                  </button>
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/dashboard')}
                    className="text-xs text-on-surface-variant/70 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto font-medium"
                  >
                    <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                    <span>Akses Admin Console</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Footer Component */}
      <footer className="bg-surface border-t border-ui-divider w-full px-lg py-md flex flex-col md:flex-row justify-between items-center gap-md">
        <div className="flex items-center gap-md">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">BUKTIIN v2.4.0</span>
          <span className="hidden md:block w-1 h-1 rounded-full bg-outline-variant"></span>
          <span className="font-code-sm text-code-sm text-on-surface-variant">© 2026 Nafindo Group. All Rights Reserved.</span>
        </div>
        <div className="flex items-center gap-sm text-on-surface-variant">
          <span className="font-label-caps text-label-caps">STATUS:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
            <span className="font-code-sm text-code-sm uppercase">Secure Connection</span>
          </div>
          <span className="mx-md hidden md:block text-ui-divider">|</span>
          <span className="font-code-sm text-code-sm">Developed by Nafindo Group</span>
        </div>
      </footer>
    </div>
  );
}
