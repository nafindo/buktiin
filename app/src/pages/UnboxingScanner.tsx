import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BrowserMultiFormatReader } from '@zxing/library';
import logoImg from '../assets/images/logo.png';

export default function UnboxingScanner() {
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNED' | 'RECORDING' | 'SAVING'>('IDLE');
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [currentResi, setCurrentResi] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [companyName, setCompanyName] = useState('Pelanggan');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [actualResolution, setActualResolution] = useState('1920x1080');
  const [cameraReady, setCameraReady] = useState(false);
  const [limitPopup, setLimitPopup] = useState<{show: boolean, title: string, message: string}>({show: false, title: '', message: ''});

  // Get user session
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        const { data: userMetadata } = await supabase.auth.getUser();
        if (userMetadata?.user?.user_metadata?.company_name) {
          setCompanyName(userMetadata.user.user_metadata.company_name);
        } else if (userMetadata?.user?.user_metadata?.full_name) {
          setCompanyName(userMetadata.user.user_metadata.full_name);
        }
      }
    });

    const img = new Image();
    img.src = logoImg;
    img.onload = () => {
      logoImageRef.current = img;
    };
  }, []);

  // Init Camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const preferredDeviceId = localStorage.getItem('buktiin_camera_id');
        let constraints: MediaStreamConstraints = { audio: false };
        const baseVideoConstraints = { width: { ideal: 1920 }, height: { ideal: 1080 } };
        
        if (preferredDeviceId) {
           constraints.video = { deviceId: { exact: preferredDeviceId }, ...baseVideoConstraints };
        } else {
           constraints.video = { facingMode: 'environment', ...baseVideoConstraints };
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
          const settings = stream.getVideoTracks()[0]?.getSettings();
          if (settings && settings.width) setActualResolution(`${settings.width}x${settings.height}`);
          setCameraReady(true);
        } catch (e) {
          console.warn("Preferred camera failed, falling back to default video", e);
          // Fallback to basic video request if environment or specific device ID fails
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
          const settings = stream.getVideoTracks()[0]?.getSettings();
          if (settings && settings.width) setActualResolution(`${settings.width}x${settings.height}`);
          setCameraReady(true);
        }
      } catch (err) {
        console.error("Camera access totally denied or error:", err);
      }
    };
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ZXing scanner for IDLE state (Webcam Barcode Reading)
  useEffect(() => {
    let isSubscribed = true;

    if (scanState === 'IDLE' && cameraReady && videoRef.current && streamRef.current) {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }
      
      // Make sure the video is playing the stream
      if (videoRef.current.srcObject !== streamRef.current) {
         videoRef.current.srcObject = streamRef.current;
         videoRef.current.play().catch(e => console.error(e));
      }

      codeReaderRef.current.decodeFromVideoElementContinuously(videoRef.current, (result) => {
        if (!isSubscribed) return;
        if (result && result.getText()) {
          const scannedCode = result.getText();
          console.log("Barcode detected via webcam:", scannedCode);
          
          bufferRef.current = scannedCode;
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        }
      });
    } else {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        // ZXing reset clears the video source! So we must restore it for the live feed!
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(e => console.error(e));
        }
      }
    }
    
    return () => {
      isSubscribed = false;
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      }
    };
  }, [scanState, cameraReady]);

  // Timer logic for recording UI
  useEffect(() => {
    if (scanState === 'RECORDING') {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [scanState]);

  // Canvas Rendering Loop for Watermarks
  useEffect(() => {
    let animationFrameId: number;
    const renderLoop = () => {
      if (scanState === 'RECORDING' && videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const w = canvasRef.current.width;
          const h = canvasRef.current.height;
          
          // Draw webcam feed
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          
          // Timestamp & Company Name (Bottom Left)
          const now = new Date();
          const timestamp = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID');
          
          ctx.font = "bold 24px 'Inter', sans-serif";
          ctx.fillStyle = "white";
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          // Nama Perusahaan di atas (Bold)
          ctx.fillText(companyName, 20, h - 75);
          
          // Resi (Bold)
          if (currentResi) {
            ctx.fillStyle = "#FFD700"; // Gold color for resi to stand out
            ctx.fillText(`RESI: ${currentResi}`, 20, h - 45);
          }
          
          // Tanggal di bawah (Normal)
          ctx.fillStyle = "white";
          ctx.font = "20px 'Inter', sans-serif";
          ctx.fillText(timestamp, 20, h - 20);

          // Logo & Text (Top Right)
          const textTop = "BUKTIIN";
          ctx.font = "bold 24px 'Inter', sans-serif";
          const textTopWidth = ctx.measureText(textTop).width;
          
          if (logoImageRef.current) {
             ctx.drawImage(logoImageRef.current, w - textTopWidth - 65, 20, 30, 30);
          }
          ctx.fillText(textTop, w - textTopWidth - 25, 43);
          
          // Reset shadow
          ctx.shadowColor = "transparent";
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    if (scanState === 'RECORDING') {
      renderLoop();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [scanState, companyName]);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  // Upload Logic
  const handleUpload = useCallback(async (blob: Blob, recId: string) => {
    const formData = new FormData();
    formData.append('recordingId', recId);
    formData.append('video', blob, `recording-${recId}.webm`);
    
    // Add accessToken for authorization
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      formData.append('accessToken', session.access_token);
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
      const response = await fetch(`${API_URL}/api/recordings/upload`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!result.success) {
        console.error("Upload failed:", result.message);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setTimeout(() => {
        setScanState('IDLE');
        setCurrentResi('');
        setCurrentRecordingId(null);
      }, 1500);
    }
  }, []);

  // Handle barcode scanner input (keyboard events)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore input if user is typing in a real input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key !== 'Enter') {
        // Build the barcode buffer
        if (e.key.length === 1) { // only printable chars
          bufferRef.current += e.key;
        }
        return;
      }

      e.preventDefault();
      const scannedCode = bufferRef.current.trim();
      bufferRef.current = ''; // reset buffer

      if (scanState === 'IDLE') {
        if (!userId) return; // Wait until session is loaded

        // Do not use mock resi if empty, require a real scan
        if (!scannedCode) return;
        
        const resi = scannedCode;
        setCurrentResi(resi);
        setScanState('SCANNED');
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
          const response = await fetch(`${API_URL}/api/recordings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resi: resi,
              customer: 'Pelanggan Walk-in',
              marketplace: 'OFFLINE',
              items: [{ name: 'Barang Campuran', quantity: 1 }],
              scanType: 'UNBOXING',
              userId: userId,
              accessToken: session?.access_token
            })
          });
          const result = await response.json();
          if (result.success) {
            setCurrentRecordingId(result.data.id);
          } else if (response.status === 403) {
            // Handle quota reached
            if (result.message === 'LIMIT_EXCEEDED_ORDER') {
              setLimitPopup({
                show: true,
                title: 'Batas Upload Harian Tercapai',
                message: `Anda telah mencapai batas maksimal upload paket Anda (${result.limit} order/hari). Harap tunggu besok, atau upgrade paket Anda sekarang.`
              });
            } else if (result.message === 'LIMIT_EXCEEDED_STORAGE') {
              setLimitPopup({
                show: true,
                title: 'Penyimpanan Penuh',
                message: `Ruang penyimpanan Anda telah habis (Batas: ${result.limit}MB). Silakan upgrade paket Anda untuk kapasitas lebih besar.`
              });
            } else {
              alert('Terjadi kesalahan limit: ' + result.message);
            }
            setScanState('IDLE');
          } else {
            console.error('Failed to create recording in DB:', result.message);
            alert('Gagal merekam: ' + (result.message || 'Unknown error'));
            setScanState('IDLE');
          }
        } catch (error: any) {
          console.error('Failed to create recording in DB:', error);
          alert('Gagal menghubungi server: ' + (error?.message || String(error)));
          setScanState('IDLE');
        }
      } else if (scanState === 'SCANNED') {
        // Start Recording
        if (streamRef.current && canvasRef.current) {
          chunksRef.current = [];
          
          const canvasStream = canvasRef.current.captureStream(30);
          const quality = localStorage.getItem('buktiin_video_quality') || '720p';
          const videoBitsPerSecond = quality === '1080p' ? 1200000 : (quality === '480p' ? 400000 : 800000);

          mediaRecorderRef.current = new MediaRecorder(canvasStream, { 
            mimeType: 'video/webm',
            videoBitsPerSecond
          });
          
          mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            if (currentRecordingId) {
              handleUpload(blob, currentRecordingId);
            }
          };

          mediaRecorderRef.current.start(1000); // chunk every second
          setScanState('RECORDING');
        }
      } else if (scanState === 'RECORDING') {
        // Stop Recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          setScanState('SAVING');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scanState, currentRecordingId, userId, handleUpload]);

  return (
    <div className="flex flex-col h-full min-h-full">
      {/* Page Header */}
      <div className="px-lg py-xl flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Unboxing Retur</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Scan barcode, record unboxing proof, and secure your evidence automatically.</p>
        </div>
      </div>
      <section className="flex-1 p-md lg:p-lg grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left: Webcam Area (Col 8) */}
        <div className="lg:col-span-8 space-y-md">
          <div className="relative aspect-video bg-black rounded-xl border-2 border-primary overflow-hidden shadow-sm group">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${scanState === 'IDLE' ? 'opacity-40' : 'opacity-100'}`}
            />
            {/* Hidden Canvas for Watermark Processing */}
            <canvas ref={canvasRef} width={1280} height={720} className="hidden" />
            
            {scanState === 'IDLE' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="material-symbols-outlined text-6xl text-white/60 mb-md">qr_code_scanner</span>
                <p className="font-headline-md text-white font-bold drop-shadow-md text-center">Siap untuk Scan Barcode</p>
                <p className="font-body-md text-white/80 mt-xs drop-shadow-md text-center max-w-md">Arahkan barcode resi ke kamera, gunakan scanner fisik, atau tekan Enter untuk tes manual.</p>
              </div>
            )}

            {scanState !== 'IDLE' && (
              <>
                {scanState === 'SCANNED' && (
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-status-success shadow-[0_0_15px_#00C853] animate-[moveScan_3s_linear_infinite]"></div>
                )}
                
                {scanState === 'RECORDING' && (
                  <div className="absolute top-md right-md flex items-center gap-sm bg-black/60 backdrop-blur-md px-md py-sm rounded-lg border border-error">
                    <span className="w-3 h-3 bg-error rounded-full animate-pulse"></span>
                    <span className="font-label-caps text-label-caps text-white font-bold">REC ● {formatTime(recordingTime)}</span>
                  </div>
                )}

                {scanState === 'SAVING' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-6xl text-status-success animate-bounce mb-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <p className="font-headline-md text-white font-bold">Menyimpan dan Mengunggah Video...</p>
                  </div>
                )}

                <div className="absolute bottom-md left-md p-md bg-black/60 backdrop-blur-md rounded-lg border border-white/20 text-white pointer-events-none">
                  <div className="grid grid-cols-2 gap-x-lg gap-y-xs">
                    <span className="font-code-sm text-code-sm opacity-60 uppercase">Resolution</span>
                    <span className="font-code-sm text-code-sm">{actualResolution}</span>
                    <span className="font-code-sm text-code-sm opacity-60 uppercase">Source</span>
                    <span className="font-code-sm text-code-sm">Live Webcam</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-md items-stretch h-14">
            {scanState === 'SCANNED' && (
              <button 
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))}
                className="flex-1 bg-surface-container-highest border-2 border-primary text-primary font-bold py-md px-xl rounded-lg hover:bg-primary-container/20 transition-all flex items-center justify-center gap-md animate-[pulse_2s_infinite]">
                <span className="material-symbols-outlined">videocam</span>
                <span className="font-headline-md text-[18px]">Mulai Rekam (Tekan Enter atau Klik)</span>
              </button>
            )}

            {scanState === 'RECORDING' && (
              <button 
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))}
                className="flex-1 bg-primary text-white font-bold py-md px-xl rounded-lg hover:bg-on-primary-container transition-all shadow-lg flex items-center justify-center gap-md">
                <span className="material-symbols-outlined">check_circle</span>
                <span className="font-headline-md text-[18px]">Selesai Unboxing (Tekan Enter atau Klik)</span>
              </button>
            )}
            
            {scanState === 'IDLE' && (
              <div className="flex-1 border-2 border-dashed border-ui-divider rounded-lg flex items-center justify-center text-on-surface-variant font-label-caps">
                MENUNGGU SCAN BARCODE...
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar Data (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          {scanState !== 'IDLE' ? (
            <div className="bg-surface-container-lowest border border-ui-divider rounded-xl shadow-sm p-md flex flex-col animate-[fade-in_0.3s_ease-out]">
              <div className="flex justify-between items-start mb-md">
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant">Proses</p>
                  <div className="flex items-center gap-sm">
                    <span className="w-6 h-6 bg-secondary-container rounded-full flex items-center justify-center text-white text-[10px] font-bold">U</span>
                    <h2 className="font-headline-md text-headline-md text-secondary font-bold">Unboxing</h2>
                  </div>
                </div>
                <span className="bg-primary-container text-on-primary-container px-sm py-xs font-label-caps text-[10px] rounded-lg">LIVE SCAN</span>
              </div>
              <div className="space-y-md border-y border-ui-divider py-md mb-md">
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant">No. Resi</p>
                  <p className="font-code-sm text-[18px] font-bold text-on-surface select-all">{currentResi}</p>
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant">Customer</p>
                  <p className="font-body-md text-body-md font-bold">Pelanggan Walk-in</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-dashed border-ui-divider rounded-xl p-xl flex flex-col items-center justify-center opacity-50">
               <span className="material-symbols-outlined text-4xl mb-sm text-on-surface-variant">receipt_long</span>
               <p className="font-label-caps text-center text-on-surface-variant">Data Order<br/>akan muncul di sini</p>
            </div>
          )}
          
          <div className="bg-surface-container-low border border-ui-divider rounded-xl p-md mt-auto">
            <div className="flex justify-between items-end mb-sm">
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Local Storage</p>
                <p className="font-body-md text-body-md font-bold">Ready</p>
              </div>
              <span className="material-symbols-outlined text-status-success">cloud_done</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quota Limit Popup */}
      {limitPopup.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface rounded-2xl max-w-md w-full p-xl border border-error/20 shadow-2xl animate-[fade-in_0.2s_ease-out]">
            <div className="flex flex-col items-center text-center mb-lg">
              <span className="material-symbols-outlined text-6xl text-error mb-sm">error</span>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{limitPopup.title}</h2>
              <p className="font-body-md text-on-surface-variant mt-sm">{limitPopup.message}</p>
            </div>
            <div className="flex flex-col gap-sm">
              <button 
                onClick={() => {
                  setLimitPopup({show: false, title: '', message: ''});
                  // Here we could navigate to Pricing using window.location or navigate if imported
                  window.location.hash = '#/plans';
                }}
                className="w-full bg-primary text-white font-bold py-md rounded-lg hover:bg-on-primary-container transition-all"
              >
                Upgrade Paket Sekarang
              </button>
              <button 
                onClick={() => setLimitPopup({show: false, title: '', message: ''})}
                className="w-full bg-surface-variant text-on-surface-variant font-bold py-md rounded-lg hover:bg-outline/20 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Status Bar (Sticky Bottom) */}
      <footer className="bg-surface-container-lowest border-t border-ui-divider px-lg py-md flex flex-col md:flex-row items-center justify-between gap-md mt-auto sticky bottom-0">
        <div className="flex items-center gap-xl overflow-x-auto w-full md:w-auto no-scrollbar">
          <div className="flex items-center gap-md shrink-0">
             <p className="font-label-caps text-[10px] text-on-surface-variant">SYSTEM STATUS</p>
             <p className="font-headline-md text-headline-md text-status-success font-bold">ONLINE</p>
          </div>
        </div>
        <div className="flex items-center gap-md text-right">
          <div className="hidden sm:block">
            <p className="font-code-sm text-code-sm text-on-surface-variant">v4.0.0-RealData</p>
            <p className="font-label-caps text-[12px] font-bold">Developed by Nafindo Group</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
