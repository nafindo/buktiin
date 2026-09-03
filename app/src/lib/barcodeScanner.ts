import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (_) {
    return null;
  }
}

/**
 * Plays a loud, crisp retail barcode scanner BEEP tone and triggers haptic feedback.
 */
export function playScanFeedback() {
  try {
    const ctx = getSharedAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // 1800Hz square wave produces the authentic crisp high-pitch barcode beep
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.14);
    }
  } catch (err) {
    console.warn('[Beep] Audio error:', err);
  }

  try {
    if (navigator.vibrate) {
      navigator.vibrate(80);
    }
  } catch (_) {}
}

/**
 * Applies native hardware continuous autofocus and optimal exposure to camera track.
 */
export async function applyCameraFocus(track?: MediaStreamTrack | null) {
  if (!track) return;
  try {
    const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
    const adv: any = {};
    if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
      adv.focusMode = 'continuous';
    }
    if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
      adv.exposureMode = 'continuous';
    }
    if (capabilities.whiteBalanceMode && capabilities.whiteBalanceMode.includes('continuous')) {
      adv.whiteBalanceMode = 'continuous';
    }
    if (Object.keys(adv).length > 0) {
      await track.applyConstraints({ advanced: [adv] });
    }
  } catch (e) {
    console.warn('[CameraFocus] Continuous focus constraint not supported on this device:', e);
  }
}

/**
 * Starts an ultra-fast, high-sensitivity barcode scanning engine.
 * Automatically uses Android Native BarcodeDetector (Google Play Services ML Kit)
 * when available in Chromium / WebView, falling back to optimized ZXing.
 */
export function startContinuousScanner(
  videoElement: HTMLVideoElement,
  onDetected: (code: string) => void
): () => void {
  let isActive = true;
  let animationFrameId: number | null = null;
  let zxingReader: BrowserMultiFormatReader | null = null;

  // 1. Check if hardware-accelerated Native BarcodeDetector is available (Android Chromium / WebView ML Kit)
  if ('BarcodeDetector' in window) {
    try {
      const detector = new (window as any).BarcodeDetector({
        formats: [
          'code_128',
          'code_39',
          'code_93',
          'ean_13',
          'ean_8',
          'itf',
          'qr_code',
          'upc_a',
          'upc_e',
          'data_matrix',
          'codabar'
        ]
      });

      const detectFrame = async () => {
        if (!isActive) return;

        if (videoElement && videoElement.readyState >= 2) {
          try {
            const barcodes = await detector.detect(videoElement);
            if (barcodes && barcodes.length > 0) {
              const rawCode = barcodes[0].rawValue?.trim();
              if (rawCode && isActive) {
                onDetected(rawCode);
              }
            }
          } catch (_) {}
        }

        if (isActive) {
          animationFrameId = requestAnimationFrame(detectFrame);
        }
      };

      detectFrame();

      return () => {
        isActive = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    } catch (err) {
      console.warn('[BarcodeEngine] Native BarcodeDetector init failed, using ZXing:', err);
    }
  }

  // 2. Fallback to Optimized ZXing multi-format reader with prioritized hints
  try {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.CODABAR
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    zxingReader = new BrowserMultiFormatReader(hints, 60);

    zxingReader.decodeFromVideoElementContinuously(videoElement, (result) => {
      if (!isActive) return;
      if (result && result.getText()) {
        const rawCode = result.getText().trim();
        if (rawCode) {
          onDetected(rawCode);
        }
      }
    });
  } catch (zxingErr) {
    console.error('[BarcodeEngine] ZXing reader error:', zxingErr);
  }

  return () => {
    isActive = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (zxingReader) {
      try {
        zxingReader.reset();
      } catch (_) {}
    }
  };
}
