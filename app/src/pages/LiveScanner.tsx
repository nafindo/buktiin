import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { saveLocalVideoBlob, updateLocalRecordMetadata } from '../lib/videoStorage';
import { uploadRecordingToDrive } from '../lib/driveUpload';
import { startContinuousScanner, applyCameraFocus, playScanFeedback } from '../lib/barcodeScanner';
import logoImg from '../assets/images/logo.png';

export default function LiveScanner() {
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNED' | 'RECORDING' | 'SAVING'>('IDLE');
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [currentResi, setCurrentResi] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [companyName, setCompanyName] = useState('Buktiin Store');
  const [customerName, setCustomerName] = useState('Pelanggan');
  const [marketplace, setMarketplace] = useState('OFFLINE');
  const [orderItems, setOrderItems] = useState<Array<{ name: string; qty: number; variant?: string }>>([]);

  // Camera settings
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualResiInput, setManualResiInput] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [focusRing, setFocusRing] = useState<{ x: number; y: number; show: boolean } | null>(null);

  // Video rotation mode for canvas: 'auto' | 0 | 90 | 270
  const [videoRotation, setVideoRotation] = useState<'auto' | 0 | 90 | 270>('auto');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);
  const [actualResolution, setActualResolution] = useState('1280x720');
  const [cameraReady, setCameraReady] = useState(false);
  const [limitPopup, setLimitPopup] = useState<{show: boolean, title: string, message: string}>({show: false, title: '', message: ''});

  // Debounce refs for NoTouch barcode trigger
  const lastScanTimeRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIdRef = useRef<string | null>(null);

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

  // Enumerate video input devices
  const updateCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setAvailableCameras(videoDevices);
    } catch (e) {
      console.warn("Failed to enumerate camera devices:", e);
    }
  };

  // Init Camera with continuous autofocus
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraReady(false);

      const constraints: MediaStreamConstraints = { audio: false };
      const baseVideoConstraints: any = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, min: 20 },
        advanced: [
          { focusMode: 'continuous' },
          { exposureMode: 'continuous' }
        ]
      };

      if (selectedCameraId) {
        constraints.video = { deviceId: { exact: selectedCameraId }, ...baseVideoConstraints };
      } else {
        constraints.video = { facingMode: { ideal: facingMode }, ...baseVideoConstraints };
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn("Preferred camera constraint failed, falling back to default:", err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch(e => console.warn(e));
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings && settings.width && settings.height) {
          setActualResolution(`${settings.width}x${settings.height}`);
        }
        await applyCameraFocus(videoTrack);

        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }

      setCameraReady(true);
      updateCameraDevices();
    } catch (err) {
      console.error("Camera access totally denied or error:", err);
    }
  }, [facingMode, selectedCameraId]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Toggle Camera (Front / Back)
  const toggleFacingMode = () => {
    setSelectedCameraId('');
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (e) {
        console.error("Failed to toggle torch:", e);
      }
    }
  };

  // Tap-to-Focus on video viewfinder
  const handleTapToFocus = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setFocusRing({ x, y, show: true });
    setTimeout(() => setFocusRing(null), 1000);

    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      applyCameraFocus(track);
    }
  };

  // 1. Handle Resi Scanned (Scan 1: IDLE -> SCANNED)
  const handleScannedResi = async (resi: string) => {
    if (!resi) return;
    playScanFeedback();
    setCurrentResi(resi);
    setScanState('SCANNED');

    // Marketplace auto-detection from Resi prefix
    let detectedMarketplace = 'OFFLINE';
    const upperResi = resi.toUpperCase();
    if (upperResi.startsWith('SPX') || upperResi.startsWith('ID') || upperResi.includes('SHOPEE')) {
      detectedMarketplace = 'SHOPEE';
    } else if (upperResi.startsWith('TKP') || upperResi.startsWith('TLX') || upperResi.includes('TOKO')) {
      detectedMarketplace = 'TOKOPEDIA';
    } else if (upperResi.startsWith('TT') || upperResi.startsWith('TIK') || upperResi.includes('TIKTOK')) {
      detectedMarketplace = 'TIKTOK';
    } else if (upperResi.startsWith('LEX') || upperResi.startsWith('LZD') || upperResi.includes('LAZADA')) {
      detectedMarketplace = 'LAZADA';
    } else if (upperResi.startsWith('JP') || upperResi.startsWith('JX') || upperResi.startsWith('JT')) {
      detectedMarketplace = 'J&T EXPRESS';
    } else if (upperResi.startsWith('SOC') || upperResi.startsWith('CGK') || upperResi.startsWith('JNE')) {
      detectedMarketplace = 'JNE';
    } else if (upperResi.startsWith('SIP') || upperResi.startsWith('SICEPAT')) {
      detectedMarketplace = 'SICEPAT';
    }
    setMarketplace(detectedMarketplace);

    let cust = 'Pelanggan';
    let itemsList: Array<{ name: string; qty: number; variant?: string }> = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUid = session?.user?.id || userId;
      if (currentUid) {
        // Query existing order / recording info with this resi
        const { data: existingRec } = await supabase
          .from('recordings')
          .select('*')
          .eq('user_id', currentUid)
          .eq('resi', resi)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingRec) {
          if (existingRec.customer && existingRec.customer !== 'Pelanggan') {
            cust = existingRec.customer;
          }
          if (existingRec.items && Array.isArray(existingRec.items) && existingRec.items.length > 0) {
            itemsList = existingRec.items;
          }
          if (existingRec.marketplace) {
            detectedMarketplace = existingRec.marketplace;
            setMarketplace(detectedMarketplace);
          }
        }

        setCustomerName(cust);
        setOrderItems(itemsList);
      }
    } catch (err: any) {
      console.warn("Could not query existing order in Supabase:", err);
      setCustomerName(cust);
      setOrderItems(itemsList);
    }

    // Generate clean unique ID for this recording session
    const newRecId = crypto.randomUUID();
    recordingIdRef.current = newRecId;
    setCurrentRecordingId(newRecId);
  };

  // 2. Start Recording (Scan 2: SCANNED -> RECORDING)
  const startRecording = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUid = session?.user?.id || userId;
      if (currentUid) {
        const { data: userSub } = await supabase
          .from('subscriptions')
          .select('*, plans(*)')
          .eq('user_id', currentUid)
          .eq('status', 'ACTIVE')
          .single();

        if (userSub && userSub.plans) {
          const maxVideos = userSub.plans.max_videos || 0;
          if (maxVideos > 0) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0,0,0,0);

            const { count } = await supabase
              .from('recordings')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', currentUid)
              .gte('created_at', startOfMonth.toISOString());

            if (count !== null && count >= maxVideos) {
              setLimitPopup({
                show: true,
                title: 'Batas Kuota Bulanan Tercapai',
                message: `Anda telah mencapai batas kuota paket ${userSub.plans.name} (${maxVideos} video/bulan). Silakan upgrade paket untuk melanjutkan perekaman.`
              });
              return;
            }
          }
        }
      }

      chunksRef.current = [];
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      // Standard landscape 720p HD canvas (1280x720)
      canvas.width = 1280;
      canvas.height = 720;

      // Pre-draw initial frame
      const ctx = canvas.getContext('2d');
      if (ctx && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, 1280, 720);
      }

      const canvasStream = canvas.captureStream(30);

      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        options = { mimeType: 'video/webm;codecs=vp8' };
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      }

      const recorder = new MediaRecorder(canvasStream, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        handleSaveRecording();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      recordingStartTimeRef.current = Date.now();
      setScanState('RECORDING');
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      alert("Gagal memulai perekaman video.");
    }
  };

  // 3. Stop Recording (Scan 3: RECORDING -> SAVING)
  const stopRecording = () => {
    if (mediaRecorderRef.current && scanState === 'RECORDING') {
      if (mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.requestData();
        } catch (_) {}
        mediaRecorderRef.current.stop();
      }
      setScanState('SAVING');
    }
  };

  // NoTouch Barcode Event Router (Hands-free 3-step cycle)
  const handleBarcodeTrigger = useCallback((code: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 1200) {
      return;
    }

    if (scanState === 'IDLE') {
      // Step 1: Input Resi
      lastScanTimeRef.current = now;
      handleScannedResi(code);
    } else if (scanState === 'SCANNED') {
      // Step 2: Start Recording
      lastScanTimeRef.current = now;
      playScanFeedback();
      startRecording();
    } else if (scanState === 'RECORDING') {
      // Step 3: Stop & Save Recording (minimum 2s duration)
      if (now - recordingStartTimeRef.current >= 2000) {
        lastScanTimeRef.current = now;
        playScanFeedback();
        stopRecording();
      }
    }
  }, [scanState, currentResi, userId, companyName]);

  // Continuous Barcode Scanner Engine
  useEffect(() => {
    if (cameraReady && videoRef.current && streamRef.current && scanState !== 'SAVING') {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(e => console.warn(e));
      }

      const stopScanner = startContinuousScanner(videoRef.current, (code) => {
        handleBarcodeTrigger(code);
      });

      return () => {
        stopScanner();
      };
    }
  }, [scanState, cameraReady, handleBarcodeTrigger]);

  // Physical Barcode Scanner (USB / Bluetooth / Keyboard wedge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.trim().length > 2) {
          handleBarcodeTrigger(bufferRef.current.trim());
        }
        bufferRef.current = '';
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBarcodeTrigger]);

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

  // Canvas Rendering Loop with Smart Video Rotation (Video diputar saat vertikal agar size 1280x720 pas gak gepeng)
  useEffect(() => {
    let animationFrameId: number;
    const renderLoop = () => {
      if (scanState === 'RECORDING' && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.readyState >= 2) {
          const t = canvas.width;  // 1280
          const n = canvas.height; // 720

          const isPortraitStream = video.videoWidth > 0 && video.videoHeight > 0 && (video.videoWidth < video.videoHeight);
          const shouldRotate = videoRotation === 90 || (videoRotation === 'auto' && isPortraitStream);

          if (shouldRotate) {
            ctx.save();
            ctx.translate(t / 2, n / 2);
            ctx.rotate((90 * Math.PI) / 180);
            ctx.drawImage(video, -n / 2, -t / 2, n, t);
            ctx.restore();
          } else if (videoRotation === 270) {
            ctx.save();
            ctx.translate(t / 2, n / 2);
            ctx.rotate((270 * Math.PI) / 180);
            ctx.drawImage(video, -n / 2, -t / 2, n, t);
            ctx.restore();
          } else {
            ctx.drawImage(video, 0, 0, t, n);
          }

          // Timestamp string matching exe
          const r = new Date();
          const a = r.toLocaleDateString('id-ID') + ' ' + r.toLocaleTimeString('id-ID');

          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          // 1. Company Name (u): Bottom left (n - 75)
          ctx.font = "bold 24px 'Inter', sans-serif";
          ctx.fillStyle = 'white';
          ctx.fillText(companyName, 20, n - 75);

          // 2. RESI (i): Bottom left in Gold #FFD700 (n - 45)
          if (currentResi) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`RESI: ${currentResi}`, 20, n - 45);
          }

          // 3. Date & Time (a): Bottom left in White (n - 20)
          ctx.fillStyle = 'white';
          ctx.font = "20px 'Inter', sans-serif";
          ctx.fillText(a, 20, n - 20);

          // 4. Logo & BUKTIIN text: Top Right (Exact same as .exe)
          const o = 'BUKTIIN';
          ctx.font = "bold 24px 'Inter', sans-serif";
          const s = ctx.measureText(o).width;

          if (logoImageRef.current) {
            ctx.drawImage(logoImageRef.current, t - s - 65, 20, 30, 30);
          }
          ctx.fillText(o, t - s - 25, 43);

          // Reset shadow
          ctx.shadowColor = 'transparent';
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
  }, [scanState, companyName, currentResi, videoRotation]);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  // Save Recording Logic & Cloud Server Upload
  const handleSaveRecording = async () => {
    const mime = mediaRecorderRef.current?.mimeType || 'video/mp4';
    const blob = new Blob(chunksRef.current, { type: mime });
    const recId = recordingIdRef.current || currentRecordingId || crypto.randomUUID();
    const resiToUpload = currentResi;

    console.log(`[LiveScanner] Video recorded: ${blob.size} bytes (${mime}) for recId ${recId}`);

    // 1. Immediately save to IndexedDB with full metadata
    await saveLocalVideoBlob(recId, blob, {
      resi: resiToUpload,
      companyName: customerName,
      marketplace: marketplace,
      scanType: 'PACKING',
      uploadStatus: 'PENDING'
    });

    try {
      // 2. Insert single clean row in Supabase with id: recId
      const { data: { session } } = await supabase.auth.getSession();
      const currentUid = session?.user?.id || userId;

      if (currentUid) {
        await supabase
          .from('recordings')
          .insert({
            id: recId,
            user_id: currentUid,
            resi: resiToUpload,
            customer: customerName,
            marketplace: marketplace,
            status: 'DONE',
            scan_type: 'PACKING',
            items: orderItems,
            video_path: `local://${recId}.mp4`,
            video_size: blob.size,
            upload_status: 'PENDING'
          });
      }

      // 3. Upload to Cloud Server in background
      setTimeout(() => {
        uploadRecordingToDrive(recId, blob, resiToUpload, marketplace).then(async (res) => {
          if (res.success && res.driveFileId) {
            console.log('[LiveScanner] Video successfully uploaded to Cloud Server:', res.driveFileId);
            await updateLocalRecordMetadata(recId, { uploadStatus: 'SUCCESS', driveFileId: res.driveFileId });
          } else {
            console.warn('[LiveScanner] Cloud upload queued for retry:', res.error);
          }
        }).catch(e => console.warn('[LiveScanner] Upload error:', e));
      }, 300);

    } catch (err) {
      console.error("Save recording error:", err);
    } finally {
      setTimeout(() => {
        setCurrentResi('');
        setCurrentRecordingId(null);
        recordingIdRef.current = null;
        setScanState('IDLE');
      }, 800);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mobile Top Camera Toolbar (Ultra-compact 32px height) */}
      <div className="bg-surface-container-low border-b border-ui-divider px-1.5 sm:px-3 py-1 flex items-center justify-between gap-1 shrink-0 h-8 sm:h-10">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Flip Camera Button */}
          <button
            onClick={toggleFacingMode}
            className="flex items-center gap-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-2 py-0.5 rounded text-[11px] font-semibold border border-ui-divider"
            title="Ganti Kamera"
          >
            <span className="material-symbols-outlined text-sm sm:text-base">flip_camera_android</span>
            <span className="hidden sm:inline">{facingMode === 'environment' ? 'Belakang' : 'Depan'}</span>
          </button>

          {/* Flashlight/Torch Button */}
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                torchOn 
                  ? 'bg-amber-400 text-black border-amber-500 font-bold shadow-sm' 
                  : 'bg-surface-container-high text-on-surface border-ui-divider'
              }`}
              title="Senter"
            >
              <span className="material-symbols-outlined text-sm sm:text-base">{torchOn ? 'flashlight_on' : 'flashlight_off'}</span>
              <span className="hidden sm:inline">Senter</span>
            </button>
          )}

          {/* Video Rotation Setting */}
          <button
            onClick={() => {
              setVideoRotation(prev => {
                if (prev === 'auto') return 0;
                if (prev === 0) return 90;
                if (prev === 90) return 270;
                return 'auto';
              });
            }}
            className="flex items-center gap-1 bg-surface-container-high text-on-surface px-2 py-0.5 rounded text-[11px] font-semibold border border-ui-divider"
            title="Rotasi Video"
          >
            <span className="material-symbols-outlined text-sm sm:text-base">screen_rotation</span>
            <span>{videoRotation === 'auto' ? 'Auto' : `${videoRotation}°`}</span>
          </button>

          {/* Camera Selector Dropdown */}
          {availableCameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-surface-container-high text-on-surface border border-ui-divider text-[11px] rounded px-1 py-0.5 max-w-[100px] sm:max-w-none truncate"
            >
              <option value="">Default</option>
              {availableCameras.map((cam, idx) => (
                <option key={cam.deviceId || idx} value={cam.deviceId}>
                  {cam.label || `Cam ${idx + 1}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Manual Input Resi Button */}
        <button
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-white px-2 py-0.5 rounded text-[11px] font-bold transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-sm">keyboard</span>
          <span>Input Resi</span>
        </button>
      </div>

      {/* Main Workspace Area (Maximized height, no wasted margins) */}
      <section className="flex-1 p-1 sm:p-2 grid grid-cols-1 landscape:grid-cols-12 lg:grid-cols-12 gap-1.5 sm:gap-2 overflow-hidden">
        {/* Left / Main: Camera Feed */}
        <div className="landscape:col-span-8 lg:col-span-8 flex flex-col h-full overflow-hidden">
          {/* Viewfinder Frame (Maximized space, fits 100% of left column) */}
          <div 
            onClick={handleTapToFocus}
            onTouchStart={handleTapToFocus}
            className="relative w-full h-full min-h-0 bg-black rounded-lg border-2 border-primary overflow-hidden shadow-sm group cursor-crosshair select-none flex items-center justify-center"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Hidden Canvas for Watermark Processing (1280x720) */}
            <canvas ref={canvasRef} width={1280} height={720} className="hidden" />
            
            {/* Tap-to-Focus Reticle animation */}
            {focusRing?.show && (
              <div 
                className="absolute pointer-events-none border-2 border-emerald-400 w-10 sm:w-14 h-10 sm:h-14 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping z-20"
                style={{ left: focusRing.x, top: focusRing.y }}
              />
            )}

            {/* IDLE state Scan Aiming Box Guide */}
            {scanState === 'IDLE' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 pointer-events-none bg-black/10">
                <div className="relative w-44 sm:w-64 h-24 sm:h-36 border-2 border-emerald-400/90 rounded-lg sm:rounded-xl flex flex-col items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  {/* Corner markers */}
                  <span className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-300"></span>
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-300"></span>
                  <span className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-300"></span>
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-300"></span>
                  {/* Laser line */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[moveScan_2s_ease-in-out_infinite]"></div>
                  
                  <p className="font-label-caps text-white font-bold text-[9px] sm:text-xs bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm shadow">
                    Arahkan Barcode ke Sini
                  </p>
                </div>
              </div>
            )}

            {scanState !== 'IDLE' && (
              <>
                {scanState === 'SCANNED' && (
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-status-success shadow-[0_0_15px_#00C853] animate-[moveScan_3s_linear_infinite]"></div>
                )}
                
                {scanState === 'RECORDING' && (
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 sm:py-1 rounded border border-red-500 shadow-md">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="font-label-caps text-[10px] sm:text-xs text-white font-bold">REC ● {formatTime(recordingTime)}</span>
                  </div>
                )}

                {scanState === 'SAVING' && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-4xl text-status-success animate-bounce mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <p className="font-headline-md text-white font-bold text-xs sm:text-sm">Menyimpan Video...</p>
                  </div>
                )}

                <div className="absolute bottom-1.5 left-1.5 p-1 bg-black/70 backdrop-blur-md rounded border border-white/20 text-white pointer-events-none text-[9px] sm:text-[10px]">
                  <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5">
                    <span className="opacity-70">Res</span>
                    <span className="font-bold">{actualResolution}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right / Sidebar: Order & Product Verification Card */}
        <div className="landscape:col-span-4 lg:col-span-4 flex flex-col justify-between gap-1 h-full overflow-y-auto">
          {scanState !== 'IDLE' ? (
            <div className="bg-surface-container-lowest border border-ui-divider rounded-lg shadow-sm p-1.5 sm:p-2 flex flex-col gap-1 animate-[fade-in_0.2s_ease-out]">
              <div className="flex justify-between items-center pb-1 border-b border-ui-divider">
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 bg-primary text-white rounded-full flex items-center justify-center text-[8px] font-bold">P</span>
                  <span className="text-[11px] text-primary font-bold">Packing Pesanan</span>
                </div>
                <span className="bg-primary/10 text-primary px-1.5 py-0.5 text-[8px] rounded font-bold uppercase">
                  {marketplace || 'OFFLINE'}
                </span>
              </div>

              {/* No. Resi & Nama Pelanggan */}
              <div className="space-y-0.5">
                <div>
                  <p className="text-[8px] text-on-surface-variant font-bold uppercase">No. Resi</p>
                  <p className="font-mono text-xs sm:text-sm font-extrabold text-primary select-all break-all leading-tight">
                    {currentResi}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-on-surface-variant font-bold uppercase">Nama Pelanggan</p>
                  <p className="text-[11px] font-bold text-on-surface truncate leading-tight">
                    {customerName || 'Pelanggan'}
                  </p>
                </div>
              </div>

              {/* Detail Produk / Pesanan */}
              <div className="pt-1 border-t border-ui-divider">
                <div className="flex justify-between items-center mb-0.5">
                  <p className="text-[8px] text-on-surface-variant font-bold uppercase flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[10px]">inventory_2</span>
                    Detail Produk {orderItems.length > 0 ? `(${orderItems.length})` : ''}
                  </p>
                </div>

                {orderItems.length > 0 ? (
                  <div className="max-h-20 overflow-y-auto space-y-0.5 pr-0.5">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-surface-container-low px-1.5 py-0.5 rounded text-[10px]">
                        <span className="font-medium text-on-surface truncate max-w-[120px]">{item.name}</span>
                        <span className="font-bold text-primary font-mono shrink-0">x{item.qty}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-container-low px-1.5 py-0.5 rounded text-[9px] text-on-surface-variant flex items-center justify-between">
                    <span className="truncate">1x Item Paket</span>
                    <span className="font-bold text-emerald-600">Siap Packing</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-dashed border-ui-divider rounded-lg p-2 flex flex-col items-center justify-center opacity-70">
              <span className="material-symbols-outlined text-lg mb-0.5 text-on-surface-variant">receipt_long</span>
              <p className="text-center text-on-surface-variant text-[9px]">Scan barcode resi untuk membaca data transaksi & produk</p>
            </div>
          )}

          {/* Action Buttons (Right below order info, easily reachable without scrolling) */}
          <div className="flex flex-col gap-1 my-auto">
            {scanState === 'SCANNED' && (
              <button 
                onClick={startRecording}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2.5 rounded-lg transition-all shadow flex items-center justify-center gap-1 text-xs active:scale-98 animate-[pulse_2s_infinite]">
                <span className="material-symbols-outlined text-base">videocam</span>
                <span>Mulai Rekam Packing</span>
              </button>
            )}

            {scanState === 'RECORDING' && (
              <button 
                onClick={stopRecording}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2.5 rounded-lg transition-all shadow flex items-center justify-center gap-1 text-xs active:scale-98">
                <span className="material-symbols-outlined text-base">stop_circle</span>
                <span>Selesai Packing ({formatTime(recordingTime)})</span>
              </button>
            )}
            
            {scanState === 'IDLE' && (
              <div className="w-full border border-dashed border-ui-divider rounded-lg flex items-center justify-center text-on-surface-variant font-label-caps text-[10px] py-1.5 bg-surface-container-lowest">
                <span className="material-symbols-outlined mr-1 text-primary text-sm">center_focus_strong</span>
                SIAP SCAN RESI
              </div>
            )}
          </div>
          
          <div className="bg-surface-container-low border border-ui-divider rounded-lg p-1 flex justify-between items-center text-[9px]">
            <span className="text-on-surface-variant">Penyimpanan:</span>
            <span className="font-bold text-status-success flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs">verified</span>
              Lokal & Cloud
            </span>
          </div>
        </div>
      </section>

      {/* Manual Input Resi Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className="bg-surface rounded-xl max-w-sm w-full p-4 border border-ui-divider shadow-2xl animate-[fade-in_0.2s_ease-out]">
            <h2 className="font-headline-md font-bold text-on-surface text-sm mb-1">Input No. Resi Manual</h2>
            <p className="text-[11px] text-on-surface-variant mb-3">Ketik atau tempel nomor resi paket:</p>
            <input
              type="text"
              value={manualResiInput}
              onChange={(e) => setManualResiInput(e.target.value)}
              placeholder="Contoh: JP1234567890"
              className="w-full bg-surface-container-high border border-ui-divider rounded-lg px-3 py-2 text-sm font-mono mb-3 focus:outline-none focus:border-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualResiInput.trim()) {
                  handleScannedResi(manualResiInput.trim());
                  setManualResiInput('');
                  setShowManualModal(false);
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (manualResiInput.trim()) {
                    handleScannedResi(manualResiInput.trim());
                    setManualResiInput('');
                    setShowManualModal(false);
                  }
                }}
                disabled={!manualResiInput.trim()}
                className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 disabled:opacity-40"
              >
                Gunakan Resi
              </button>
              <button
                onClick={() => setShowManualModal(false)}
                className="px-3 py-2 bg-surface-container-high text-on-surface text-xs rounded-lg font-bold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quota Limit Popup */}
      {limitPopup.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className="bg-surface rounded-xl max-w-sm w-full p-4 border border-error/20 shadow-2xl animate-[fade-in_0.2s_ease-out]">
            <div className="flex flex-col items-center text-center mb-3">
              <span className="material-symbols-outlined text-4xl text-error mb-1">error</span>
              <h2 className="font-headline-md text-sm font-bold text-on-surface">{limitPopup.title}</h2>
              <p className="font-body-md text-xs text-on-surface-variant mt-1">{limitPopup.message}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button 
                onClick={() => {
                  setLimitPopup({show: false, title: '', message: ''});
                  window.location.hash = '#/plans';
                }}
                className="w-full bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-on-primary-container transition-all"
              >
                Upgrade Paket
              </button>
              <button 
                onClick={() => setLimitPopup({show: false, title: '', message: ''})}
                className="w-full bg-surface-variant text-on-surface-variant text-xs font-bold py-2 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
