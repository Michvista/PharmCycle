"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import AppIcon from "@/components/ui/AppIcon";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import { ApiError, inventoryApi, type InventoryItem } from "@/lib/api";
import { formatDate, inventoryStatusToBadge } from "@/lib/format";
import { fileToDataUrl, ocrWithTesseract, sanitizeParsed, type ParsedLabel } from "@/lib/ocr";

const emptyForm = {
  medicineName: "",
  category: "",
  dosageForm: "",
  strength: "",
  quantity: "",
  costPrice: "",
  sellingPrice: "",
  batchNumber: "",
  expiryDate: "",
};

function applyToForm(parsed: ParsedLabel) {
  const clean = sanitizeParsed(parsed);
  return {
    ...emptyForm,
    ...(clean.medicineName && { medicineName: clean.medicineName }),
    ...(clean.strength && { strength: clean.strength }),
    ...(clean.dosageForm && { dosageForm: clean.dosageForm }),
    ...(clean.batchNumber && { batchNumber: clean.batchNumber }),
    ...(clean.expiryDate && { expiryDate: clean.expiryDate }),
    ...(clean.category && { category: clean.category }),
  };
}

type ScanMode = "idle" | "live" | "preview";

export default function ScanPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [recentScans, setRecentScans] = useState<InventoryItem[]>([]);
  const [lookupResult, setLookupResult] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scanType, setScanType] = useState<"text" | "barcode">("text");
  const { success: toastSuccess, error: toastError } = useToast();

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignored
    }
  }

  // Stop camera stream when component unmounts or mode changes away from "live"
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function tryBatchLookup(batchNumber: string) {
    if (!batchNumber.trim()) return;
    try {
      const item = await inventoryApi.lookup(batchNumber.trim());
      setLookupResult(item);
      setRecentScans((prev) => [item, ...prev.filter((r) => r.id !== item.id)].slice(0, 5));
      setForm((prev) => ({
        ...prev,
        medicineName: `${item.medicine.name} ${item.medicine.strength}`.trim(),
        strength: item.medicine.strength,
        dosageForm: item.medicine.dosageForm,
        category: item.medicine.category,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate.split("T")[0],
        costPrice: String(item.costPrice),
        sellingPrice: String(item.sellingPrice),
      }));
      toastSuccess(`Found in inventory: ${item.medicine.name}`);
    } catch {
      setLookupResult(null);
    }
  }

  // Look up product details from free UPC databases (no API key needed)
  async function lookupUpcProduct(barcode: string) {
    // Try Open Food Facts first (great for consumer goods & pharma)
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          const name = p.product_name || p.product_name_en || "";
          const brand = p.brands || "";
          const fullName = [brand, name].filter(Boolean).join(" ").trim();
          if (fullName) {
            setForm((prev) => ({
              ...prev,
              medicineName: fullName,
              ...(p.quantity && { strength: p.quantity }),
            }));
            toastSuccess(`Product found: ${fullName}`);
            return;
          }
        }
      }
    } catch { /* try next */ }

    // Try UPCItemDB free trial (100 lookups/day, no key)
    try {
      const res = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (res.ok) {
        const data = await res.json();
        const item = data.items?.[0];
        if (item) {
          const name = item.title || item.brand || "";
          if (name) {
            setForm((prev) => ({
              ...prev,
              medicineName: name,
            }));
            toastSuccess(`Product found: ${name}`);
            return;
          }
        }
      }
    } catch { /* nothing found */ }
  }

  async function runBarcodeDecode(file: File) {
    setOcrLoading(true);
    setOcrProgress(0);
    setLookupResult(null);
    setForm(emptyForm);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      
      // Ensure dummy element exists
      let dummy = document.getElementById("qr-decoder-dummy");
      if (!dummy) {
        dummy = document.createElement("div");
        dummy.id = "qr-decoder-dummy";
        dummy.style.display = "none";
        document.body.appendChild(dummy);
      }

      const html5QrCode = new Html5Qrcode("qr-decoder-dummy");
      const decodedText = await html5QrCode.scanFile(file, false);
      
      playBeep();
      toastSuccess(`Barcode decoded: ${decodedText}`);
      setForm((prev) => ({ ...prev, batchNumber: decodedText }));
      
      // First try internal inventory lookup, then public UPC databases
      await tryBatchLookup(decodedText);
      await lookupUpcProduct(decodedText);
    } catch (err) {
      toastError("No QR code or Barcode detected. Try better lighting, hold steady, or upload a clearer photo.");
      console.error("Barcode decode error:", err);
    } finally {
      setOcrLoading(false);
    }
  }

  // Start live camera feed
  async function startCamera(mode: "environment" | "user" = facingMode) {
    setCameraError(null);
    stopCamera();
    // Switch to live mode FIRST so the <video> element is in the DOM before we assign srcObject
    setScanMode("live");
    // Small yield to let React commit the DOM update
    await new Promise((r) => setTimeout(r, 50));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (innerErr) {
        const msg = innerErr instanceof Error ? innerErr.message : "Camera not accessible";
        setCameraError(
          msg.includes("NotAllowed") || msg.includes("Permission")
            ? "Camera permission denied. Please allow camera access and try again."
            : "Could not open camera. Try uploading a photo instead."
        );
        setScanMode("idle");
      }
    }
  }

  function toggleCamera() {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  }

  function handleTypeChange(newType: "text" | "barcode") {
    setScanType(newType);
  }

  // Capture current frame from video and run OCR / Barcode decode
  async function captureFrame() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = video.videoWidth;
    const H = video.videoHeight;

    // Calculate crop window (centered target box)
    let cropW: number;
    let cropH: number;
    if (scanType === "text") {
      cropW = W * 0.75;
      cropH = H * 0.55;
    } else {
      // square for barcode/QR
      const size = Math.min(W, H) * 0.65;
      cropW = size;
      cropH = size;
    }

    const sX = (W - cropW) / 2;
    const sY = (H - cropH) / 2;

    canvas.width = cropW;
    canvas.height = cropH;
    ctx.drawImage(video, sX, sY, cropW, cropH, 0, 0, cropW, cropH);

    stopCamera();
    setScanMode("preview");

    // Convert canvas to blob → File
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(canvas.toDataURL("image/jpeg", 0.92));
      
      if (scanType === "text") {
        await runOcr(file);
      } else {
        await runBarcodeDecode(file);
      }
    }, "image/jpeg", 0.92);
  }


  async function runOcr(file: File) {
    setOcrLoading(true);
    setOcrProgress(0);
    setLookupResult(null);
    setForm(emptyForm);

    try {
      const dataUrl = await fileToDataUrl(file);
      let parsed: ParsedLabel | null = null;

      // 1) Gemini first
      try {
        const res = await inventoryApi.ocrLabel(dataUrl, file.type || "image/jpeg");
        parsed = sanitizeParsed(res.extracted as ParsedLabel);
        if (parsed.medicineName || parsed.batchNumber) {
          setForm(applyToForm(parsed));
          toastSuccess("Label scanned successfully");
          if (parsed.batchNumber) await tryBatchLookup(parsed.batchNumber);
          return;
        }
      } catch (e) {
        if (!(e instanceof ApiError && (e.status === 503 || e.status === 502))) throw e;
      }

      // 2) Tesseract fallback
      const { parsed: tessParsed } = await ocrWithTesseract(file, setOcrProgress);
      parsed = tessParsed;
      if (parsed.medicineName || parsed.batchNumber || parsed.expiryDate) {
        setForm(applyToForm(parsed));
        toastSuccess("Label scanned — please verify the details");
        if (parsed.batchNumber) await tryBatchLookup(parsed.batchNumber);
      } else {
        toastError("Could not read the label. Try a clearer photo or enter details manually.");
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setOcrLoading(false);
      setOcrProgress(0);
    }
  }

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { e.target.value = ""; return; }
    if (file.size > MAX_FILE_SIZE) {
      toastError("Image is too large. Please upload a file under 20 MB.");
      e.target.value = "";
      return;
    }
    // Revoke previous blob URL to free memory
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setScanMode("preview");
    e.target.value = "";

    if (scanType === "text") {
      runOcr(file);
    } else {
      runBarcodeDecode(file);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const item = await inventoryApi.create({
        medicineName: form.medicineName,
        category: form.category || "Other",
        dosageForm: form.dosageForm || "Tablet",
        strength: form.strength || "500mg",
        quantity: Number(form.quantity),
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        batchNumber: form.batchNumber,
        expiryDate: form.expiryDate,
      });
      setRecentScans((prev) => [item, ...prev].slice(0, 5));
      setForm(emptyForm);
      setLookupResult(null);
      setPreviewUrl(null);
      setScanMode("idle");
      toastSuccess("Added to inventory");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  function resetScan() {
    stopCamera();
    setScanMode("idle");
    setPreviewUrl(null);
    setForm(emptyForm);
    setLookupResult(null);
    setCameraError(null);
  }

  const fieldClass =
    "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";

  return (
    <>
      <TopBar title="Scan Medicines" subtitle="Photograph a label to auto-fill medicine details." />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left panel: camera / preview ── */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col">
            {/* Hidden inputs */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ── LIVE camera mode ── */}
            {scanMode === "live" && (
              <div className="flex flex-col gap-3 flex-1">
                <div className="relative rounded-xl overflow-hidden bg-black flex-1 min-h-[260px] flex items-center justify-center">
                  {/* Mode Selector */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-lg p-0.5 flex gap-1 z-10">
                    <button
                      type="button"
                      onClick={() => handleTypeChange("text")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        scanType === "text"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      Text OCR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange("barcode")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        scanType === "barcode"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      QR &amp; Barcode
                    </button>
                  </div>

                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />

                  {/* Google Lens-style targeting overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    {/* Dark vignette corners */}
                    <div className="absolute inset-0 bg-black/30" />
                    {/* Scanning window */}
                    <div
                      style={{ "--scan-height": scanType === "text" ? "9.8rem" : "11.8rem" } as React.CSSProperties}
                      className={`relative rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-all duration-300 ${
                        scanType === "text" ? "w-64 h-40" : "w-48 h-48"
                      }`}
                    >
                      {/* Corner brackets */}
                      {[
                        "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg",
                        "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg",
                        "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg",
                        "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg",
                      ].map((cls, i) => (
                        <span key={i} className={`absolute w-5 h-5 border-green-400 ${cls}`} />
                      ))}
                      {/* Scanning animation line */}
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400/80 animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                    <p className="absolute bottom-4 text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                      {scanType === "text" ? "Align label within frame" : "Align QR/Barcode in square"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={captureFrame}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm cursor-pointer transition-colors"
                  >
                    <AppIcon name="camera" size={18} />
                    {scanType === "text" ? "Capture & Scan Text" : "Capture & Decode Code"}
                  </button>
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    title="Switch front/back camera"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                    Switch
                  </button>
                  <button
                    type="button"
                    onClick={resetScan}
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── PREVIEW mode (after capture or file upload) ── */}
            {scanMode === "preview" && (
              <div className="flex flex-col gap-3 flex-1">
                <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 min-h-[220px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl ?? ""}
                    alt="Captured label"
                    className="w-full max-h-60 object-contain"
                  />
                  {ocrLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium text-gray-700">
                        {scanType === "text"
                          ? (ocrProgress > 0 ? `Processing… ${ocrProgress}%` : "Analyzing with AI…")
                          : "Decoding QR/Barcode…"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    disabled={ocrLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm cursor-pointer transition-colors"
                  >
                    <AppIcon name="camera" size={16} />
                    Scan again
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={ocrLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    Upload photo
                  </button>
                </div>
              </div>
            )}

            {/* ── IDLE mode ── */}
            {scanMode === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[280px] gap-3">
                {cameraError && (
                  <div className="w-full mb-1 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 text-left">
                    {cameraError}
                  </div>
                )}
                <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center">
                  <AppIcon name="scan" size={40} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Scan a medicine label</h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Use the live camera (like Google Lens) or upload a photo of the label.
                  </p>
                </div>
                {/* Primary: live camera */}
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm cursor-pointer transition-colors"
                >
                  <AppIcon name="camera" size={18} />
                  Open live camera
                </button>
                {/* Secondary: upload */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm cursor-pointer transition-colors"
                >
                  Upload photo
                </button>
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5 font-medium">
                  <AppIcon name="warning" size={10} className="text-orange-400" />
                  Max 20 MB for uploads
                </span>
              </div>
            )}

            {/* Lookup result banner */}
            {lookupResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl text-left">
                <p className="text-xs font-medium text-green-700 mb-0.5">Already in your inventory</p>
                <p className="text-sm font-semibold text-gray-900">
                  {lookupResult.medicine.name} {lookupResult.medicine.strength}
                </p>
                <p className="text-xs text-gray-500">
                  NAFDAC {lookupResult.batchNumber} · {lookupResult.quantity} in stock
                </p>
              </div>
            )}
          </div>

          {/* ── Right panel: form ── */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Medicine details</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Medicine name</label>
                <input required value={form.medicineName} onChange={(e) => setForm({ ...form, medicineName: e.target.value })} placeholder="Paracetamol 500mg" className={fieldClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Strength</label>
                  <input value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} placeholder="500mg" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Form</label>
                  <input value={form.dosageForm} onChange={(e) => setForm({ ...form, dosageForm: e.target.value })} placeholder="Tablet" className={fieldClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Analgesic" className={fieldClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">NAFDAC Reg. No.</label>
                <input required value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} placeholder="A4-1234" className={fieldClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input required type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="100" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expiry date</label>
                  <input required type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost price (₦)</label>
                  <input required type="number" min={0} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="800" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selling price (₦)</label>
                  <input required type="number" min={0} value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="1200" className={fieldClass} />
                </div>
              </div>
              <button type="submit" disabled={saving || ocrLoading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl cursor-pointer disabled:opacity-50 mt-2">
                {saving ? "Adding…" : "Add to inventory"}
              </button>
            </form>
          </div>
        </div>

        {recentScans.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Recent scans</h3>
            <div className="space-y-2">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                  <AppIcon name="pill" size={18} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{scan.medicine.name} {scan.medicine.strength}</p>
                    <p className="text-xs text-gray-400">NAFDAC {scan.batchNumber} · Exp {formatDate(scan.expiryDate)}</p>
                  </div>
                  <Badge variant={inventoryStatusToBadge(scan.status)}>{scan.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Scanning line animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(var(--scan-height, 10rem)); opacity: 0.7; }
        }
      `}</style>
    </>
  );
}
