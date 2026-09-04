import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/images/logo.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setCheckingSession(false);
      } else {
        setCheckingSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak sesuai.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccessMsg(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setErrorMsg(err.message || 'Gagal memperbarui kata sandi. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
      <header className="p-4 border-b border-ui-divider bg-surface flex items-center justify-between">
        <Link to="/login" className="flex items-center gap-2 font-headline-md font-bold text-primary">
          <img src={logoImg} alt="Buktiin Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <span>BUKTIIN</span>
        </Link>
        <Link to="/login" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
          Kembali ke Masuk
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-ui-divider rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-2xl">lock_reset</span>
            </div>
            <h1 className="font-headline-md text-xl font-bold">Atur Ulang Kata Sandi</h1>
            <p className="text-on-surface-variant text-xs">
              Masukkan kata sandi baru untuk akun BUKTIIN Anda.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-error-container text-on-error-container p-3 rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg ? (
            <div className="bg-status-success/10 border border-status-success/30 text-status-success p-4 rounded-xl text-center space-y-2 animate-[fade-in_0.2s_ease-out]">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
              <p className="text-sm font-bold">Kata Sandi Berhasil Diperbarui!</p>
              <p className="text-xs text-on-surface-variant">
                Anda akan dialihkan ke halaman masuk dalam beberapa detik...
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-2 px-4 py-2 bg-status-success text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity inline-block"
              >
                Masuk Sekarang
              </button>
            </div>
          ) : checkingSession ? (
            <div className="text-center py-6 text-on-surface-variant text-xs flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-base">sync</span>
              <span>Memeriksa sesi pemulihan...</span>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-caps text-[11px] text-on-surface-variant block font-bold">
                  KATA SANDI BARU
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-container border border-ui-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-[11px] text-on-surface-variant block font-bold">
                  KONFIRMASI KATA SANDI BARU
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
                    verified_user
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-container border border-ui-divider rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm mt-4"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check</span>
                    <span>Simpan Kata Sandi Baru</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-ui-divider text-center">
            <Link to="/login" className="text-xs text-primary font-bold hover:underline">
              ← Kembali ke Halaman Masuk
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
