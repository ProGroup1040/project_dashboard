import { useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle, Info,
  Eye, EyeOff, Printer, Share2, BookOpen, Plus, Trash2, RefreshCw,
  Play, X, Upload, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SelMaterial { id: number; nameAr: string; brand: string; pricePerMeter: number; area: number; total: number; location: string; }
interface SelAccessory { id: number; nameAr: string; brand: string; price: number; qty: number; total: number; isFree: boolean; }
interface SelMarble    { id: number; nameAr: string; category: string; code: string; area: number; pricePerM2: number; total: number; }
interface SelCladding  { id: number; nameAr: string; price: number; qty: number; total: number; }
interface TransportData { ruleId: number; governorate: string; basePrice: number; carryingPrice: number; total: number; }
interface Warning { type: string; message: string; severity: "error" | "warning" | "info"; }

const STEPS = [
  { id: 1, title: "بيانات العميل",   icon: "👤" },
  { id: 2, title: "أبعاد المطبخ",    icon: "📐" },
  { id: 3, title: "الإكسسوارات",     icon: "⚙️" },
  { id: 4, title: "الرخام",           icon: "🪨" },
  { id: 5, title: "التجاليد",         icon: "🎨" },
  { id: 6, title: "النقل",            icon: "🚚" },
  { id: 7, title: "الخصم",            icon: "💰" },
  { id: 8, title: "المراجعة",         icon: "⚠️" },
  { id: 9, title: "عرض داخلي",       icon: "🔒" },
  { id: 10, title: "عرض العميل",     icon: "📋" },
];

const MARBLE_PRICES: Record<string, number> = {
  granite: 850, porcelain: 650, quartz: 1200, other: 500,
};

function fmt(n: number) { return n.toLocaleString("ar-EG") + " ج"; }

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfessorKitchensEngine() {
  const [, navigate] = useLocation();
  const [step, setStep]   = useState(1);
  const [viewMode, setViewMode] = useState<"internal" | "client">("internal");

  // Step 1
  const [clientName,   setClientName]   = useState("");
  const [clientPhone,  setClientPhone]  = useState("");
  const [address,      setAddress]      = useState("");
  const [governorate,  setGovernorate]  = useState("");
  const [engineerName, setEngineerName] = useState("");
  const [projectCode]                   = useState(() => `PRF-${Date.now().toString().slice(-6)}`);

  // Step 2 — piece table
  interface Piece { id: number; location: string; wall: string; desc: string; width: string; height: string; total: number; material: string; }
  const [pieces, setPieces] = useState<Piece[]>([{ id: 1, location: "سفلي", wall: "", desc: "", width: "", height: "", total: 0, material: "" }]);
  const [nextPieceId, setNextPieceId] = useState(2);

  // Computed grouped totals from pieces
  const calcPieceTotal = (p: Piece): number => {
    const w = parseFloat(p.width || "0");
    const h = parseFloat(p.height || "0");
    if (!w || !h) return 0;
    if (p.location === "سفلي" && w < 0.3) return Math.round(w * 1.5 * h * 100) / 100;
    if (p.location === "طولي" && w < 0.4) return Math.round(w * 2 * h * 100) / 100;
    if (p.location === "طولي" && w >= 0.4) return Math.round(w * 1.5 * h * 100) / 100;
    if (p.location === "بلاكار" && h <= 0.3) return Math.round(h * 2 * w * 100) / 100;
    if (p.location === "بلاكار" && h > 0.3) return Math.round(h * 1.5 * w * 100) / 100;
    return Math.round(w * h * 100) / 100;
  };
  const lowerArea   = useMemo(() => pieces.filter(p => p.location === "سفلي").reduce((s, p) => s + calcPieceTotal(p), 0).toFixed(2), [pieces]);
  const upperArea   = useMemo(() => pieces.filter(p => p.location === "علوي").reduce((s, p) => s + calcPieceTotal(p), 0).toFixed(2), [pieces]);
  const tallArea    = useMemo(() => pieces.filter(p => p.location === "طولي").reduce((s, p) => s + calcPieceTotal(p), 0).toFixed(2), [pieces]);
  const specialArea = useMemo(() => pieces.filter(p => p.location === "بلاكار").reduce((s, p) => s + calcPieceTotal(p), 0).toFixed(2), [pieces]);

  // Steps 3-7
  const [selMaterials,   setSelMaterials]   = useState<SelMaterial[]>([]);
  const [selAccessories, setSelAccessories] = useState<SelAccessory[]>([]);
  const [selMarble,      setSelMarble]      = useState<SelMarble[]>([]);
  const [selCladding,    setSelCladding]    = useState<SelCladding[]>([]);
  const [transport,      setTransport]      = useState<TransportData | null>(null);

  // Step 7
  const [discountType,   setDiscountType]   = useState<"none"|"percentage"|"fixed">("none");
  const [discountValue,  setDiscountValue]  = useState(0);
  const [discountReason, setDiscountReason] = useState("");

  // Step 8
  const [warnings,       setWarnings]       = useState<Warning[]>([]);
  const [notes,          setNotes]          = useState("");
  const [internalNotes,  setInternalNotes]  = useState("");

  // Filters
  const [matFilter, setMatFilter] = useState("all");
  const [accFilter, setAccFilter] = useState("all");
  const [showPb,    setShowPb]    = useState<number | null>(null);

  // Data
  const { data: materials   = [] } = trpc.kitchen.getMaterials.useQuery();
  const { data: accessories = [] } = trpc.kitchen.getAccessories.useQuery();
  const { data: marbles     = [] } = trpc.kitchen.getMarble.useQuery();
  const { data: claddings   = [] } = trpc.kitchen.getCladding.useQuery();
  const { data: transportRules = [] } = trpc.platform.getTransportRules.useQuery();

  // ─── Totals ────────────────────────────────────────────────────────────────
  const matTotal  = useMemo(() => selMaterials.reduce((s, m) => s + m.total, 0), [selMaterials]);
  const accTotal  = useMemo(() => selAccessories.filter(a => !a.isFree).reduce((s, a) => s + a.total, 0), [selAccessories]);
  const mrbTotal  = useMemo(() => selMarble.reduce((s, m) => s + m.total, 0), [selMarble]);
  const cldTotal  = useMemo(() => selCladding.reduce((s, c) => s + c.total, 0), [selCladding]);
  const trpTotal  = transport?.total ?? 0;
  const subtotal  = matTotal + accTotal + mrbTotal + cldTotal + trpTotal;
  const discAmt   = discountType === "percentage" ? Math.round(subtotal * discountValue / 100) : discountType === "fixed" ? discountValue : 0;
  const grandTotal = subtotal - discAmt;
  const discPct   = subtotal > 0 ? (discAmt / subtotal) * 100 : 0;

  // ─── Warnings ──────────────────────────────────────────────────────────────
  const computeWarnings = () => {
    const w: Warning[] = [];
    if (selMaterials.length === 0)   w.push({ type: "no_mat",   message: "لم يتم اختيار أي خامات",              severity: "error" });
    if (selAccessories.length === 0) w.push({ type: "no_acc",   message: "لم يتم اختيار أي إكسسوارات",          severity: "warning" });
    if (selMarble.length === 0)      w.push({ type: "no_mrb",   message: "لم يتم اختيار الرخام / الكونتر",       severity: "warning" });
    if (!transport)                  w.push({ type: "no_trp",   message: "لم يتم إضافة النقل والتركيب",          severity: "warning" });
    if (discPct > 15)                w.push({ type: "hi_disc",  message: `الخصم (${discPct.toFixed(1)}%) يتجاوز 15% — يحتاج موافقة مدير`, severity: "error" });
    const freeCount = selAccessories.filter(a => a.isFree).length;
    if (freeCount > 2)               w.push({ type: "free_many",message: `عدد البنود المجانية (${freeCount}) مرتفع`, severity: "error" });
    if (subtotal > 0 && accTotal / subtotal > 0.4) w.push({ type: "hi_acc", message: "نسبة الإكسسوارات أكثر من 40% من الإجمالي", severity: "warning" });
    if (grandTotal > 0 && grandTotal < 50000) w.push({ type: "low_tot", message: "السعر النهائي منخفض جداً (أقل من 50,000 ج)", severity: "warning" });
    setWarnings(w);
    return w;
  };

  // ─── Navigation ────────────────────────────────────────────────────────────
  const canProceed = (s: number) => {
    if (s === 1) return clientName.trim().length > 0;
    if (s === 2) return pieces.some(p => calcPieceTotal(p) > 0);
    if (s === 3) return selMaterials.length > 0;
    return true;
  };
  const goNext = () => { if (step === 8) computeWarnings(); if (step < 10) setStep(s => s + 1); };
  const goPrev = () => { if (step > 1) setStep(s => s - 1); };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const addMaterial = (mat: any, area: number, location: string) => {
    const total = Math.round((mat.pricePerMeter ?? 0) * area);
    setSelMaterials(prev => [...prev.filter(m => m.id !== mat.id), { id: mat.id, nameAr: mat.nameAr, brand: mat.brand, pricePerMeter: mat.pricePerMeter, area, total, location }]);
  };

  const addAccessory = (acc: any) => {
    setSelAccessories(prev => {
      const ex = prev.find(a => a.id === acc.id);
      if (ex) return prev.map(a => a.id === acc.id ? { ...a, qty: a.qty + 1, total: (a.qty + 1) * a.price } : a);
      return [...prev, { id: acc.id, nameAr: acc.nameAr, brand: acc.brand, price: acc.price, qty: 1, total: acc.price, isFree: false }];
    });
  };

  const addMarble = (marble: any, area: number) => {
    const pricePerM2 = MARBLE_PRICES[marble.category] ?? 700;
    const total = Math.round(pricePerM2 * area);
    setSelMarble(prev => [...prev.filter(m => m.id !== marble.id), { id: marble.id, nameAr: marble.nameAr, category: marble.category, code: marble.code, area, pricePerM2, total }]);
  };

  const addCladding = (cladding: any, qty: number) => {
    const total = Math.round((cladding.price ?? 0) * qty);
    setSelCladding(prev => [...prev.filter(c => c.id !== cladding.id), { id: cladding.id, nameAr: cladding.nameAr, price: cladding.price, qty, total }]);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">

      {/* Header */}
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/brands")} className="p-2 rounded-lg hover:bg-white/10"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-base font-bold text-amber-400">Professor Kitchens — محرك التسعير</h1>
              <p className="text-xs text-white/40">كود: {projectCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(v => v === "internal" ? "client" : "internal")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${viewMode === "client" ? "bg-amber-600 text-white" : "bg-white/10 text-white/60"}`}
          >
            {viewMode === "internal" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {viewMode === "internal" ? "وضع العميل" : "وضع داخلي"}
          </button>
          </div>
        </div>
        {/* Steps bar */}
        <div className="max-w-7xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {STEPS.map(s => (
              <button key={s.id} onClick={() => setStep(s.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                  step === s.id ? "bg-amber-600 text-white font-bold" :
                  step > s.id  ? "bg-green-900/50 text-green-400" :
                  "bg-white/5 text-white/40"}`}>
                <span>{s.icon}</span>
                <span className="hidden md:inline">{s.title}</span>
                <span className="md:hidden">{s.id}</span>
                {step > s.id && <CheckCircle2 className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live totals bar */}
      <div className="bg-black/40 border-b border-white/5 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap gap-3">
            <span className="text-white/40">خامات: <span className="text-white">{fmt(matTotal)}</span></span>
            <span className="text-white/40">إكسسوارات: <span className="text-white">{fmt(accTotal)}</span></span>
            <span className="text-white/40">رخام: <span className="text-white">{fmt(mrbTotal)}</span></span>
            <span className="text-white/40">تجاليد: <span className="text-white">{fmt(cldTotal)}</span></span>
            <span className="text-white/40">نقل: <span className="text-white">{fmt(trpTotal)}</span></span>
          </div>
          <div className="flex items-center gap-3">
            {discAmt > 0 && <span className="text-red-400">خصم: -{fmt(discAmt)}</span>}
            <span className="text-amber-400 font-bold text-sm">الإجمالي: {fmt(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Step 1: Client ── */}
        {step === 1 && (
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold mb-4">👤 بيانات العميل والمشروع</h2>
            {[
              { label: "اسم العميل *", val: clientName, set: setClientName, ph: "محمد أحمد" },
              { label: "رقم الهاتف",   val: clientPhone, set: setClientPhone, ph: "01xxxxxxxxx" },
              { label: "العنوان",       val: address,     set: setAddress,     ph: "المنطقة، المدينة" },
              { label: "اسم المهندس",  val: engineerName,set: setEngineerName,ph: "م. أحمد" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm text-white/60 mb-1">{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm text-white/60 mb-1">المحافظة</label>
              <select value={governorate} onChange={e => setGovernorate(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500">
                <option value="">اختر المحافظة</option>
                {(transportRules as any[]).map((r: any) => (
                  <option key={r.id} value={r.governorate}>{r.governorate}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 2: Dimensions with piece table ── */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">📐 أبعاد المطبخ</h2>
              <button
                onClick={() => { setPieces(p => [...p, { id: nextPieceId, location: "سفلي", wall: "", desc: "", width: "", height: "", total: 0, material: "" }]); setNextPieceId(n => n + 1); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-amber-600 hover:bg-amber-500 text-white font-bold"
              >
                <Plus className="w-4 h-4" /> إضافة قطعة
              </button>
            </div>

            {/* Pieces table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr className="bg-white/5 text-white/60 text-xs">
                    <th className="px-3 py-2 text-right w-10">#</th>
                    <th className="px-3 py-2 text-right w-28">مكان القطعة</th>
                    <th className="px-3 py-2 text-right w-24">الجدار</th>
                    <th className="px-3 py-2 text-right">وصف القطعة</th>
                    <th className="px-3 py-2 text-right w-24">عرض (م)</th>
                    <th className="px-3 py-2 text-right w-24">ارتفاع (م)</th>
                    <th className="px-3 py-2 text-right w-36">الخامة</th>
                    <th className="px-3 py-2 text-right w-28">إجمالي (م²)</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {pieces.map((piece, idx) => {
                    const tot = calcPieceTotal(piece);
                    return (
                      <tr key={piece.id} className={`border-t border-white/5 ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                        <td className="px-3 py-2 text-amber-400 font-bold text-center text-sm">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <select value={piece.location} onChange={e => setPieces(p => p.map(x => x.id === piece.id ? { ...x, location: e.target.value } : x))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500">
                            <option value="سفلي">سفلي</option>
                            <option value="علوي">علوي</option>
                            <option value="طولي">طولي</option>
                            <option value="بلاكار">بلاكار</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select value={piece.wall} onChange={e => setPieces(p => p.map(x => x.id === piece.id ? { ...x, wall: e.target.value } : x))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500">
                            <option value="">—</option>
                            {["A","B","C","D","E","F"].map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input list={`desc-list-${piece.id}`} value={piece.desc} onChange={e => setPieces(p => p.map(x => x.id === piece.id ? { ...x, desc: e.target.value } : x))}
                            placeholder="اختر أو اكتب..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500" />
                          <datalist id={`desc-list-${piece.id}`}>
                            {["ركنه عدله","وحدة حوض","بول اوت","ابلاكار","ادراج","اعلى الثلاجه","ديكور","علوي","مطبقيه","ميكرويف","نيش","درج","رف علوي","خزنة طويلة","وحدة افران بني","وحدة غسالة","وحدة انتره","وحدة زاوية","وحدة تلاجة","وحدة فرن","وحدة ميكرويف","وحدة غطاء شفاط","وحدة زجاج","وحدة مفتوحة"].map(d => <option key={d} value={d} />)}
                          </datalist>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" step="0.01" value={piece.width} onChange={e => setPieces(p => p.map(x => x.id === piece.id ? { ...x, width: e.target.value } : x))}
                            placeholder="0.00"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500 text-center" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" step="0.01" value={piece.height} onChange={e => setPieces(p => p.map(x => x.id === piece.id ? { ...x, height: e.target.value } : x))}
                            placeholder="0.00"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500 text-center" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={piece.material} onChange={e => setPieces(p => p.map(x => x.id === piece.id ? { ...x, material: e.target.value } : x))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500">
                            <option value="">— اختر —</option>
                            {(materials as any[]).map((m: any) => (
                              <option key={m.id} value={m.nameAr}>{m.nameAr}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-bold text-sm ${tot > 0 ? "text-amber-400" : "text-white/20"}`}>{tot > 0 ? tot.toFixed(2) : "—"}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {pieces.length > 1 && (
                            <button onClick={() => setPieces(p => p.filter(x => x.id !== piece.id))} className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Summary Tables ── */}
            {pieces.some(p => calcPieceTotal(p) > 0) && (
              <div className="mt-8 space-y-6" dir="rtl">

                {/* ── Table 1: Unit Areas Summary (matches Excel header row) ── */}
                <div>
                  <h3 className="text-white/70 text-xs font-bold mb-2 tracking-wide uppercase">ملخص مساحات الوحدات</h3>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#1a3a5c] text-white">
                          <th className="px-4 py-3 text-center font-bold border-l border-white/10">إجمالي مساحة الوحدات السفلية</th>
                          <th className="px-4 py-3 text-center font-bold border-l border-white/10">مساحة الوحدات العلوية</th>
                          <th className="px-4 py-3 text-center font-bold border-l border-white/10">مساحة وحدات البلاكار</th>
                          <th className="px-4 py-3 text-center font-bold">مساحة الوحدات الطولية</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white/5">
                          <td className="px-4 py-4 text-center">
                            <span className="text-amber-400 font-bold text-lg">{parseFloat(lowerArea) > 0 ? lowerArea + " م²" : "—"}</span>
                          </td>
                          <td className="px-4 py-4 text-center border-l border-white/5">
                            <span className="text-blue-400 font-bold text-lg">{parseFloat(upperArea) > 0 ? upperArea + " م²" : "—"}</span>
                          </td>
                          <td className="px-4 py-4 text-center border-l border-white/5">
                            <span className="text-purple-400 font-bold text-lg">{parseFloat(specialArea) > 0 ? specialArea + " م²" : "—"}</span>
                          </td>
                          <td className="px-4 py-4 text-center border-l border-white/5">
                            <span className="text-green-400 font-bold text-lg">{parseFloat(tallArea) > 0 ? tallArea + " م²" : "—"}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Table 2: Material Totals (SUMIF per material) ── */}
                {(() => {
                  const matMap: Record<string, { area: number; pricePerM: number; nameAr: string }> = {};
                  pieces.forEach(p => {
                    if (!p.material) return;
                    const area = calcPieceTotal(p);
                    if (area <= 0) return;
                    const matData = (materials as any[]).find((m: any) => m.nameAr === p.material);
                    if (!matMap[p.material]) {
                      matMap[p.material] = { area: 0, pricePerM: matData?.pricePerMeter ?? 0, nameAr: p.material };
                    }
                    matMap[p.material].area += area;
                  });
                  const matRows = Object.values(matMap).filter(m => m.area > 0);
                  if (matRows.length === 0) return null;
                  return (
                    <div>
                      <h3 className="text-white/70 text-xs font-bold mb-2 tracking-wide uppercase">إجمالي الخامات</h3>
                      <div className="rounded-xl overflow-hidden border border-white/10 divide-y divide-white/5">
                        {matRows.map((mat) => (
                          <div key={mat.nameAr}>
                            {/* Material header row */}
                            <div className="bg-[#1a3a5c] px-4 py-2 flex items-center gap-2">
                              <span className="text-white/60 text-xs">تفاصيل إجمالية لخامة :</span>
                              <span className="text-amber-300 font-bold text-sm">{mat.nameAr}</span>
                            </div>
                            {/* Material data row */}
                            <div className="bg-white/[0.04] grid grid-cols-3 divide-x-reverse divide-x divide-white/5">
                              <div className="px-4 py-3 text-center">
                                <p className="text-white/50 text-xs mb-1">إجمالى الأمتار</p>
                                <p className="text-white font-bold">{mat.area.toFixed(2)} م²</p>
                              </div>
                              <div className="px-4 py-3 text-center">
                                <p className="text-white/50 text-xs mb-1">سعر المتر</p>
                                <p className="text-amber-400 font-bold">
                                  {mat.pricePerM > 0 ? mat.pricePerM.toLocaleString("ar-EG") + " ج.م" : "—"}
                                </p>
                              </div>
                              <div className="px-4 py-3 text-center">
                                <p className="text-white/50 text-xs mb-1">السعر الإجمالي</p>
                                <p className="text-green-400 font-bold">
                                  {mat.pricePerM > 0
                                    ? (mat.area * mat.pricePerM).toLocaleString("ar-EG", { maximumFractionDigits: 2 }) + " ج.م"
                                    : "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Accessories ── */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">⚙️ الإكسسوارات</h2>
              <div className="flex gap-2 flex-wrap items-center">
                {["all","JT","SX","Other"].map(f => (
                  <button key={f} onClick={() => setAccFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs ${accFilter===f?"bg-amber-600 text-white":"bg-white/10 text-white/60"}`}>
                    {f==="all"?"الكل":f}
                  </button>
                ))}
                <button onClick={() => setAccFilter(accFilter === "__admin" ? "all" : "__admin")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs border ${
                    accFilter === "__admin" ? "bg-blue-600 text-white border-blue-500" : "bg-white/5 text-white/40 border-white/10"
                  }`}>
                  <Upload className="w-3 h-3" /> رفع فيديو
                </button>
              </div>
            </div>

            {/* Admin: Video Upload Panel */}
            {accFilter === "__admin" && (
              <AdminVideoUpload accessories={accessories as any[]} />
            )}

            {selAccessories.length > 0 && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                <h3 className="text-green-400 text-sm font-bold mb-2">المختار ({selAccessories.length})</h3>
                {selAccessories.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{a.nameAr}</span>
                      <span className="text-white/40">×{a.qty}</span>
                      {a.isFree && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">مجاني</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={a.isFree?"line-through text-white/30":"text-amber-400"}>{fmt(a.total)}</span>
                      <button onClick={() => setSelAccessories(p => p.map(x => x.id===a.id?{...x,isFree:!x.isFree}:x))}
                        className="text-xs text-white/40 hover:text-white/70 border border-white/20 px-2 py-0.5 rounded">
                        {a.isFree?"إلغاء":"مجاني"}
                      </button>
                      <button onClick={() => setSelAccessories(p => p.filter(x => x.id !== a.id))} className="text-red-400"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(accessories as any[])
                .filter((a: any) => accFilter === "all" || a.brand === accFilter)
                .map((acc: any) => (
                  <AccCard key={acc.id} acc={acc} onAdd={addAccessory}
                    showPb={showPb === acc.id} onTogglePb={() => setShowPb(showPb === acc.id ? null : acc.id)} />
                ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Marble ── */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">🪨 الرخام والكونتر</h2>
            <p className="text-white/40 text-sm mb-4">الأسعار تقديرية حسب الفئة — يمكن تعديلها لاحقاً</p>
            <div className="mb-2 flex flex-wrap gap-2 text-xs">
              {Object.entries(MARBLE_PRICES).map(([cat, price]) => (
                <span key={cat} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/60">
                  {cat === "granite" ? "جرانيت" : cat === "porcelain" ? "بورسيلين" : cat === "quartz" ? "كوارتز" : "أخرى"}: {fmt(price)}/م²
                </span>
              ))}
            </div>

            {selMarble.length > 0 && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                {selMarble.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-white">{m.nameAr} ({m.code}) — {m.area}م² × {fmt(m.pricePerM2)}/م²</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400">{fmt(m.total)}</span>
                      <button onClick={() => setSelMarble(p => p.filter(x => x.id !== m.id))} className="text-red-400"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(marbles as any[]).map((marble: any) => (
                <MrbCard key={marble.id} marble={marble} onAdd={addMarble} />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 5: Cladding ── */}
        {step === 5 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">🎨 التجاليد والديكور</h2>

            {selCladding.length > 0 && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                {selCladding.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-white">{c.nameAr} × {c.qty} وحدة</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400">{fmt(c.total)}</span>
                      <button onClick={() => setSelCladding(p => p.filter(x => x.id !== c.id))} className="text-red-400"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(claddings as any[]).map((cld: any) => (
                <CldCard key={cld.id} cld={cld} onAdd={addCladding} />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 6: Transport ── */}
        {step === 6 && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">🚚 النقل والتركيب</h2>
            {(transportRules as any[]).length === 0 ? (
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center text-white/40">
                <p>لا توجد قواعد نقل محددة بعد</p>
                <p className="text-xs mt-1">يمكن إضافتها من لوحة الإدارة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(transportRules as any[]).map((rule: any) => (
                  <button key={rule.id} onClick={() => setTransport({ ruleId: rule.id, governorate: rule.governorate, basePrice: rule.basePrice, carryingPrice: rule.carryingPrice, total: rule.basePrice + rule.carryingPrice })}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${transport?.ruleId === rule.id ? "border-amber-500 bg-amber-900/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                    <div className="text-right">
                      <p className="font-bold text-white">{rule.governorate}</p>
                      <p className="text-xs text-white/40">نقل: {fmt(rule.basePrice)} + حمل: {fmt(rule.carryingPrice)}</p>
                    </div>
                    <span className="text-amber-400 font-bold">{fmt(rule.basePrice + rule.carryingPrice)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 7: Discount ── */}
        {step === 7 && (
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold">💰 الخصم والموافقات</h2>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-white/60 text-sm">الإجمالي قبل الخصم</p>
              <p className="text-3xl font-bold text-white">{fmt(subtotal)}</p>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">نوع الخصم</label>
              <div className="flex gap-3">
                {[{v:"none" as const,l:"بدون خصم"},{v:"percentage" as const,l:"نسبة %"},{v:"fixed" as const,l:"مبلغ ثابت"}].map(o => (
                  <button key={o.v} onClick={() => setDiscountType(o.v)}
                    className={`flex-1 py-2 rounded-xl text-sm ${discountType===o.v?"bg-amber-600 text-white":"bg-white/10 text-white/60"}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            {discountType !== "none" && (
              <>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{discountType==="percentage"?"نسبة الخصم (%)":"مبلغ الخصم (ج)"}</label>
                  <input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">سبب الخصم</label>
                  <input value={discountReason} onChange={e => setDiscountReason(e.target.value)} placeholder="مثال: عميل قديم..."
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
                </div>
                {discPct > 15 && (
                  <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm">الخصم ({discPct.toFixed(1)}%) يتجاوز 15% — يحتاج موافقة مدير</p>
                  </div>
                )}
                <div className="p-4 bg-amber-900/20 border border-amber-700/30 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-white/60">قبل الخصم</span><span>{fmt(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-red-400">الخصم</span><span className="text-red-400">-{fmt(discAmt)}</span></div>
                  <div className="flex justify-between text-lg font-bold border-t border-amber-700/30 pt-2"><span className="text-amber-400">الإجمالي</span><span className="text-amber-400">{fmt(grandTotal)}</span></div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 8: Review ── */}
        {step === 8 && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">⚠️ التحذيرات والمراجعة</h2>
              <Button onClick={computeWarnings} variant="outline" size="sm" className="border-amber-600 text-amber-400">
                <RefreshCw className="w-4 h-4 ml-1" /> تحديث
              </Button>
            </div>

            {warnings.length === 0 ? (
              <div className="p-6 bg-green-900/20 border border-green-700/30 rounded-xl flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <div><p className="text-green-400 font-bold">لا توجد تحذيرات</p><p className="text-green-400/60 text-sm">العرض جاهز</p></div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {warnings.map((w, i) => (
                  <div key={i} className={`p-4 rounded-xl flex items-start gap-3 border ${w.severity==="error"?"bg-red-900/20 border-red-700/30":w.severity==="warning"?"bg-yellow-900/20 border-yellow-700/30":"bg-blue-900/20 border-blue-700/30"}`}>
                    {w.severity==="error"?<AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5"/>:w.severity==="warning"?<AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5"/>:<Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5"/>}
                    <p className={`text-sm ${w.severity==="error"?"text-red-300":w.severity==="warning"?"text-yellow-300":"text-blue-300"}`}>{w.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <h3 className="text-white font-bold mb-3">ملخص العرض</h3>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { l: "الخامات",        v: matTotal, c: selMaterials.length },
                    { l: "الإكسسوارات",    v: accTotal, c: selAccessories.length },
                    { l: "الرخام والكونتر",v: mrbTotal, c: selMarble.length },
                    { l: "التجاليد",       v: cldTotal, c: selCladding.length },
                    { l: "النقل والتركيب", v: trpTotal, c: transport ? 1 : 0 },
                  ].map(r => (
                    <tr key={r.l} className="border-b border-white/5">
                      <td className="py-2 text-white/60">{r.l}</td>
                      <td className="py-2 text-center text-white/40">{r.c} بند</td>
                      <td className="py-2 text-left text-white font-medium">{fmt(r.v)}</td>
                    </tr>
                  ))}
                  {discAmt > 0 && (
                    <tr className="border-b border-white/5">
                      <td className="py-2 text-red-400">الخصم</td><td></td>
                      <td className="py-2 text-left text-red-400">-{fmt(discAmt)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-3 text-amber-400 font-bold text-base">الإجمالي النهائي</td><td></td>
                    <td className="py-3 text-left text-amber-400 font-bold text-xl">{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">ملاحظات داخلية</label>
                <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">ملاحظات للعميل</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 9: Internal ── */}
        {step === 9 && (
          <InternalView
            clientName={clientName} clientPhone={clientPhone} address={address} governorate={governorate}
            engineerName={engineerName} projectCode={projectCode}
            selMaterials={selMaterials} selAccessories={selAccessories} selMarble={selMarble}
            selCladding={selCladding} transport={transport}
            matTotal={matTotal} accTotal={accTotal} mrbTotal={mrbTotal} cldTotal={cldTotal} trpTotal={trpTotal}
            subtotal={subtotal} discAmt={discAmt} discountType={discountType} discountValue={discountValue}
            discountReason={discountReason} grandTotal={grandTotal} warnings={warnings}
            internalNotes={internalNotes} notes={notes}
          />
        )}

        {/* ── Step 10: Client ── */}
        {step === 10 && (
          <ClientView
            clientName={clientName} projectCode={projectCode}
            matTotal={matTotal} accTotal={accTotal} mrbTotal={mrbTotal} cldTotal={cldTotal} trpTotal={trpTotal}
            subtotal={subtotal} discAmt={discAmt} grandTotal={grandTotal} notes={notes}
          />
        )}
      </div>

      {/* Footer nav */}
      <div className="sticky bottom-0 bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button onClick={goPrev} disabled={step===1} variant="outline" className="border-white/20 text-white/60">
            <ArrowRight className="w-4 h-4 ml-1" /> السابق
          </Button>
          <span className="text-white/40 text-sm">{step} / {STEPS.length}</span>
          {step < 11 ? (
            <Button onClick={goNext} disabled={!canProceed(step)} className="bg-amber-600 hover:bg-amber-500 text-white">
              التالي <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          ) : (
            <Button onClick={() => { toast.success("تم حفظ العرض!"); navigate("/brands"); }} className="bg-green-600 hover:bg-green-500 text-white">
              <CheckCircle2 className="w-4 h-4 ml-1" /> حفظ وإنهاء
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────
function MatCard({ mat, onAdd, defaultArea }: { mat: any; onAdd: any; defaultArea: number }) {
  const [area, setArea]     = useState(defaultArea > 0 ? String(defaultArea) : "");
  const [loc,  setLoc]      = useState("سفلي وعلوي");
  const total = area && parseFloat(area) > 0 ? Math.round((mat.pricePerMeter ?? 0) * parseFloat(area)) : 0;
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-bold text-white text-sm leading-tight">{mat.nameAr}</h4>
          <p className="text-xs text-amber-400 mt-0.5">{mat.brand}</p>
        </div>
        <span className="text-amber-400 font-bold text-sm shrink-0">{fmt(mat.pricePerMeter ?? 0)}/م²</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <input type="number" step="0.1" value={area} onChange={e => setArea(e.target.value)} placeholder="المساحة م²"
          className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500" />
        <select value={loc} onChange={e => setLoc(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg px-2 py-2 text-white text-xs focus:outline-none focus:border-amber-500">
          <option>سفلي وعلوي</option><option>سفلي فقط</option><option>علوي فقط</option><option>طويل</option><option>خاص</option>
        </select>
      </div>
      {total > 0 && <p className="text-xs text-white/40 mt-1">= {fmt(total)}</p>}
      <Button onClick={() => area && parseFloat(area) > 0 && onAdd(mat, parseFloat(area), loc)}
        className="w-full mt-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 text-xs h-8">
        <Plus className="w-3 h-3 ml-1" /> إضافة
      </Button>
    </div>
  );
}

// Mapping from accessory name keywords to catalog image paths
const ACC_IMAGE_MAP: Record<string, string> = {
  // JustTop - Drawers (مطبقية)
  "مطبقيه لانية":        "/manus-storage/jt_matabkia_standard_e77ada42.jpg",
  "مطبقية ثابتة":        "/manus-storage/sx_matabkia_standard_8f21d78a.jpg",
  "مطبقية هيدروليك":     "/manus-storage/sx_matabkia_hydro_a3782e3a.jpg",
  "مطبقيه هيدروليات اكريليك": "/manus-storage/jt_matabkia_hydro_70_b64f74d8.jpg",
  "مطبقيه سفليه":        "/manus-storage/jt_matabkia_sofli_7edbcdbe.jpg",
  "مطبقيه سفلية":        "/manus-storage/jt_matabkia_sofli_akr_a66f2766.jpg",
  "مطبقيه سلفيه":        "/manus-storage/jt_matabkia_sofli_akr_a66f2766.jpg",
  "مطبقيه سفلي":         "/manus-storage/sx_matabkia_sofli_83bbfbc9.jpg",
  // JustTop - Trolleys (ترولي)
  "ترولي 3 رف زجاج اسود": "/manus-storage/jt_trooli_zmag_aswad_a3e66ab6.jpg",
  "ترولي 3 رف استلس":    "/manus-storage/jt_trooli_stainless_sw_dd482c65.jpg",
  "ترولي استانلس 3 رف":  "/manus-storage/jt_trooli_stainless_3rf_73a20a65.jpg",
  "ترولي جانبي اسود":    "/manus-storage/jt_trooli_janbi_aswad_da76f84d.jpg",
  "ترولي جانبي قاعدة خشبية": "/manus-storage/jt_trooli_janbi_khashabia_bd943f9e.jpg",
  "ترولي جانبي اكريلليك": "/manus-storage/jt_trooli_janbi_aswad_da76f84d.jpg",
  "ترولي 30cm الومنيوم": "/manus-storage/jt_trooli_alum_40_27e1e450.jpg",
  "ترولي 35cm الومنيوم": "/manus-storage/jt_trooli_alum_40_27e1e450.jpg",
  "ترولي 40cm الومنيوم": "/manus-storage/jt_trooli_alum_40_27e1e450.jpg",
  "ترولي استالس 15cm":   "/manus-storage/jt_trooli_stainless_3rf_73a20a65.jpg",
  "ترولي استالس 25cm":   "/manus-storage/jt_trooli_stainless_3rf_73a20a65.jpg",
  "ترولي استالس 30cm":   "/manus-storage/jt_trooli_stainless_3rf_73a20a65.jpg",
  "ترولي استالس 35cm":   "/manus-storage/jt_trooli_stainless_3rf_73a20a65.jpg",
  "ترولي اكريليك سفلي":  "/manus-storage/jt_trooli_janbi_aswad_da76f84d.jpg",
  // Starax - Trolleys (Larder)
  "ترولى زيت 15":        "/manus-storage/sx_telescopic_larder_7a26dffe.jpg",
  "ترولى زيت 20":        "/manus-storage/sx_telescopic_larder_7a26dffe.jpg",
  "ترولى زيت 25":        "/manus-storage/sx_telescopic_larder_7a26dffe.jpg",
  "ترولى زيت 30":        "/manus-storage/sx_telescopic_larder_7a26dffe.jpg",
  "ترولى زيت 40":        "/manus-storage/sx_twin_larder_d30dfd7e.jpg",
  "ترولى زيت 45":        "/manus-storage/sx_twin_larder_d30dfd7e.jpg",
  // Baskets (باسكت)
  "باسكت قمامه سوفت":    "/manus-storage/jt_basket_jt0528_f0ea8467.jpg",
  "باسكت قمامهA300":     "/manus-storage/jt_basket_a300_f0a03f67.jpg",
  "باسكت قمامة مميز 9200": "/manus-storage/jt_basket_bc300_d90316b9.jpg",
  "باسكت قمامة مميز 9400": "/manus-storage/jt_basket_bc400_8bc11f04.jpg",
  "باسكت قمامة مميز 9600": "/manus-storage/jt_basket_bc450_6404f1a2.jpg",
  "باسكت مهملات":        "/manus-storage/jt_basket_bc600_2fe37461.jpg",
  "باسكت القمامه 24":    "/manus-storage/sx_basket_24l_6830a5a0.jpg",
  "باسكت القمامه 32":    "/manus-storage/sx_basket_24l_6830a5a0.jpg",
  "باسكت القمامه 35":    "/manus-storage/sx_basket_55l_575798ca.jpg",
  "سلة مهملات بلاستيك":  "/manus-storage/sx_basket_plastic_79d493b6.jpg",
  // Magic / Corner
  "ماجيك يسار s الومنيوم": "/manus-storage/sx_corner_main_0d75b150.jpg",
  "ماجيك يمين s الومنيوم": "/manus-storage/sx_corner_main_0d75b150.jpg",
  "ماجيك يمين ويسار استانلس": "/manus-storage/sx_corner_main_0d75b150.jpg",
  "ماجيك s يمين ويسار":  "/manus-storage/sx_corner_main_0d75b150.jpg",
  "ماجيك يمين ويسار زجاج": "/manus-storage/sx_corner_main_0d75b150.jpg",
  "ماجيك فلاي مون":      "/manus-storage/sx_corner_main_0d75b150.jpg",
  "ماجيك الحصان":        "/manus-storage/sx_corner_main_0d75b150.jpg",
  "سله 3/4 متحركه":      "/manus-storage/sx_corner_main_0d75b150.jpg",
  "سلة 3/4 دائرة":       "/manus-storage/sx_corner_main_0d75b150.jpg",
  // Cargo (Larder)
  "كارجو 6 رف ثابت":     "/manus-storage/sx_softclose_larder_3a7b850f.jpg",
  "كارجو 6 رف متحرك":    "/manus-storage/sx_twin_larder_d30dfd7e.jpg",
  // Carousels (Midway / Folding)
  "ميكانزم طاولة متحركة 360": "/manus-storage/sx_midway_main_97a46ccc.jpg",
  "ميكانزم طاولة متحركة عذبة": "/manus-storage/sx_folding_table_leg_4135edce.jpg",
  "ميكانزم طاولة متحركة BLTN": "/manus-storage/sx_folding_table_27452a8f.jpg",
  // Dish racks
  "صفايه سمارت كهرباء":  "/manus-storage/jt_safaya_elec_80_73a6689f.jpg",
  "صفايه هيدروليك كهرباء": "/manus-storage/jt_safaya_hydro_elec_6709fdb1.jpg",
  "صفايه هيدروليك بخزنه": "/manus-storage/jt_safaya_hydro_elec_6709fdb1.jpg",
  // Organizers
  "منظم هيدروليات بالرغام": "/manus-storage/jt_hydro_organizer_555_3563df8e.jpg",
  "مطبقيه هيدروليات بالرغام": "/manus-storage/jt_hydro_organizer_554_41d46742.jpg",
  "منظم هيدروليات":      "/manus-storage/jt_organizer_558_76dff8df.jpg",
  // Pull-out
  "بول اوت ميني":        "/manus-storage/sx_pullout_countertop_97f76e74.jpg",
  // Dividers
  "تقسيم معالق":         "/manus-storage/sx_skidproof_roll_b20e4878.jpg",
  // Trays
  "ترابيزة بدون قائم":   "/manus-storage/sx_folding_table_27452a8f.jpg",
  "ترابيزة بقائم":       "/manus-storage/sx_folding_table_leg_4135edce.jpg",
};

function getAccImage(nameAr: string): string | null {
  for (const [key, url] of Object.entries(ACC_IMAGE_MAP)) {
    if (nameAr.includes(key)) return url;
  }
  return null;
}

// ─── Admin Video Upload ────────────────────────────────────────────────────
function AdminVideoUpload({ accessories }: { accessories: any[] }) {
  const [selectedAcc, setSelectedAcc] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFilter, setUploadFilter] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const uploadMutation = trpc.kitchen.uploadAccessoryVideo.useMutation({
    onSuccess: () => {
      toast.success("تم رفع الفيديو بنجاح ✅");
      utils.kitchen.getAccessories.invalidate();
      setSelectedAcc(null);
      setUploading(false);
    },
    onError: (e) => {
      toast.error("فشل الرفع: " + e.message);
      setUploading(false);
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAcc) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("حجم الفيديو أكبر من 50MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      uploadMutation.mutate({ accessoryId: selectedAcc, videoBase64: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const filtered = accessories.filter(a => uploadFilter === "all" || a.brand === uploadFilter);

  return (
    <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-blue-300 font-bold flex items-center gap-2"><Upload className="w-4 h-4" /> رفع فيديوهات الشو روم</h3>
        <div className="flex gap-2">
          {["all","JT","SX","Other"].map(f => (
            <button key={f} onClick={() => setUploadFilter(f)}
              className={`px-2 py-1 rounded text-xs ${uploadFilter===f?"bg-blue-600 text-white":"bg-white/10 text-white/50"}`}>
              {f==="all"?"الكل":f}
            </button>
          ))}
        </div>
      </div>
      <p className="text-blue-300/60 text-xs mb-3">اختار إكسسوار ثم اضغط "رفع فيديو" — الحجم الأقصى 50MB — دعم mp4 / mov / webm</p>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
        {filtered.map((acc: any) => (
          <button key={acc.id}
            onClick={() => {
              setSelectedAcc(acc.id);
              setTimeout(() => fileRef.current?.click(), 50);
            }}
            disabled={uploading}
            className={`flex items-center gap-2 p-2 rounded-lg border text-right transition-all ${
              selectedAcc === acc.id && uploading
                ? "border-amber-500 bg-amber-900/30 animate-pulse"
                : acc.videoUrl
                ? "border-green-700/50 bg-green-900/20 hover:bg-green-900/30"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{acc.nameAr}</p>
              <p className="text-xs text-white/40">{acc.brand}</p>
            </div>
            <div className="shrink-0">
              {selectedAcc === acc.id && uploading ? (
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              ) : acc.videoUrl ? (
                <Video className="w-4 h-4 text-green-400" />
              ) : (
                <Upload className="w-4 h-4 text-white/30" />
              )}
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-white/30 mt-3">الإكسسوارات باللون الأخضر عندها فيديو بالفعل</p>
    </div>
  );
}

// ─── Video Modal ──────────────────────────────────────────────────────────────
function VideoModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm">{name}</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <video
          src={url}
          controls
          autoPlay
          className="w-full rounded-xl bg-black"
          style={{ maxHeight: '70vh' }}
        />
      </div>
    </div>
  );
}

function AccCard({ acc, onAdd, showPb, onTogglePb }: { acc: any; onAdd: any; showPb: boolean; onTogglePb: () => void }) {
  const imgUrl = getAccImage(acc.nameAr);
  const [showVideo, setShowVideo] = useState(false);
  return (
    <>
    {showVideo && acc.videoUrl && (
      <VideoModal url={acc.videoUrl} name={acc.nameAr} onClose={() => setShowVideo(false)} />
    )}
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
      {/* Product Image */}
      <div className="relative bg-white/5 h-40 flex items-center justify-center overflow-hidden">
        {imgUrl ? (
          <img src={imgUrl} alt={acc.nameAr}
            className="w-full h-full object-contain p-2"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white/20">
            <span className="text-4xl">⚙️</span>
            <span className="text-xs mt-1">{acc.brand}</span>
          </div>
        )}
        {/* Brand badge */}
        <span className="absolute top-2 right-2 text-xs bg-amber-600/80 text-white px-2 py-0.5 rounded-full font-bold">{acc.brand}</span>
        {/* Video play button overlay */}
        {acc.videoUrl && (
          <button
            onClick={() => setShowVideo(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
          >
            <div className="w-12 h-12 rounded-full bg-amber-600/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </button>
        )}
        {/* Video indicator badge */}
        {acc.videoUrl && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-xs bg-amber-600/80 text-white px-2 py-0.5 rounded-full">
            <Video className="w-3 h-3" /> فيديو
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h4 className="font-bold text-white text-xs leading-tight mb-1 line-clamp-2">{acc.nameAr}</h4>
        <span className="text-amber-400 font-bold text-sm mb-3">{fmt(acc.price ?? 0)}</span>
        <div className="flex gap-1 mt-auto">
          <Button onClick={() => onAdd(acc)} className="flex-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 text-xs h-8">
            <Plus className="w-3 h-3 ml-1" /> إضافة
          </Button>
          {acc.videoUrl ? (
            <button onClick={() => setShowVideo(true)} className="p-2 rounded-lg bg-amber-900/30 hover:bg-amber-900/50 text-amber-400">
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onTogglePb} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70">
              <BookOpen className="w-4 h-4" />
            </button>
          )}
        </div>
        {showPb && !acc.videoUrl && (
          <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700/30 rounded-lg text-xs text-blue-300">
            <p className="font-bold mb-1">💡 Playbook</p>
            <p>سكريبت المبيعات لهذا الإكسسوار سيظهر هنا بعد إضافة البيانات من لوحة الإدارة.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

function MrbCard({ marble, onAdd }: { marble: any; onAdd: any }) {
  const [area, setArea] = useState("");
  const pricePerM2 = MARBLE_PRICES[marble.category] ?? 700;
  const total = area && parseFloat(area) > 0 ? Math.round(pricePerM2 * parseFloat(area)) : 0;
  const catLabel: Record<string,string> = { granite: "جرانيت", porcelain: "بورسيلين", quartz: "كوارتز", other: "أخرى" };
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-bold text-white text-sm">{marble.nameAr}</h4>
          <p className="text-xs text-white/40">{marble.code} — {catLabel[marble.category] ?? marble.category}</p>
        </div>
        <span className="text-amber-400 font-bold text-sm">{fmt(pricePerM2)}/م²</span>
      </div>
      <input type="number" step="0.1" value={area} onChange={e => setArea(e.target.value)} placeholder="المساحة م²"
        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-xs mt-2 focus:outline-none focus:border-amber-500" />
      {total > 0 && <p className="text-xs text-white/40 mt-1">= {fmt(total)}</p>}
      <Button onClick={() => area && parseFloat(area) > 0 && onAdd(marble, parseFloat(area))}
        className="w-full mt-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 text-xs h-8">
        <Plus className="w-3 h-3 ml-1" /> إضافة
      </Button>
    </div>
  );
}

function CldCard({ cld, onAdd }: { cld: any; onAdd: any }) {
  const [qty, setQty] = useState("");
  const total = qty && parseFloat(qty) > 0 ? Math.round((cld.price ?? 0) * parseFloat(qty)) : 0;
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-white text-sm">{cld.nameAr}</h4>
        <span className="text-amber-400 font-bold text-sm">{fmt(cld.price ?? 0)}/وحدة</span>
      </div>
      <input type="number" step="1" value={qty} onChange={e => setQty(e.target.value)} placeholder="الكمية"
        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-xs mt-2 focus:outline-none focus:border-amber-500" />
      {total > 0 && <p className="text-xs text-white/40 mt-1">= {fmt(total)}</p>}
      <Button onClick={() => qty && parseFloat(qty) > 0 && onAdd(cld, parseFloat(qty))}
        className="w-full mt-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 text-xs h-8">
        <Plus className="w-3 h-3 ml-1" /> إضافة
      </Button>
    </div>
  );
}

// ─── Internal View ────────────────────────────────────────────────────────────
function InternalView(p: any) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">🔒 العرض الداخلي</h2>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 text-sm">
          <Printer className="w-4 h-4" /> طباعة
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-white/60 text-xs mb-2">بيانات العميل</h3>
          <p className="text-white font-bold">{p.clientName || "—"}</p>
          <p className="text-white/60 text-sm">{p.clientPhone}</p>
          <p className="text-white/60 text-sm">{p.address}</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-white/60 text-xs mb-2">بيانات المشروع</h3>
          <p className="text-white font-bold">{p.projectCode}</p>
          <p className="text-white/60 text-sm">المهندس: {p.engineerName || "—"}</p>
          <p className="text-white/60 text-sm">المحافظة: {p.governorate || "—"}</p>
        </div>
      </div>

      {p.selMaterials.length > 0 && (
        <SectionTable title="الخامات" total={p.matTotal} items={p.selMaterials.map((m: SelMaterial) => ({ label: `${m.nameAr} (${m.brand}) — ${m.location} — ${m.area}م²`, value: m.total }))} />
      )}
      {p.selAccessories.length > 0 && (
        <SectionTable title="الإكسسوارات" total={p.accTotal} items={p.selAccessories.map((a: SelAccessory) => ({ label: `${a.nameAr} × ${a.qty}${a.isFree?" [مجاني]":""}`, value: a.isFree ? 0 : a.total, strike: a.isFree }))} />
      )}
      {p.selMarble.length > 0 && (
        <SectionTable title="الرخام والكونتر" total={p.mrbTotal} items={p.selMarble.map((m: SelMarble) => ({ label: `${m.nameAr} (${m.code}) — ${m.area}م²`, value: m.total }))} />
      )}
      {p.selCladding.length > 0 && (
        <SectionTable title="التجاليد والديكور" total={p.cldTotal} items={p.selCladding.map((c: SelCladding) => ({ label: `${c.nameAr} × ${c.qty} وحدة`, value: c.total }))} />
      )}
      {p.transport && (
        <div className="mb-4 bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex justify-between">
            <span className="text-white">النقل والتركيب — {p.transport.governorate}</span>
            <span className="text-amber-400 font-bold">{fmt(p.trpTotal)}</span>
          </div>
        </div>
      )}

      <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-white/60">المجموع الفرعي</span><span>{fmt(p.subtotal)}</span></div>
        {p.discAmt > 0 && <div className="flex justify-between"><span className="text-red-400">الخصم</span><span className="text-red-400">-{fmt(p.discAmt)}</span></div>}
        <div className="flex justify-between text-lg font-bold border-t border-amber-700/30 pt-2"><span className="text-amber-400">الإجمالي النهائي</span><span className="text-amber-400">{fmt(p.grandTotal)}</span></div>
      </div>

      {p.warnings.length > 0 && (
        <div className="mt-4 space-y-2">
          {p.warnings.map((w: Warning, i: number) => (
            <div key={i} className={`p-3 rounded-lg flex items-center gap-2 text-sm ${w.severity==="error"?"bg-red-900/20 text-red-300":w.severity==="warning"?"bg-yellow-900/20 text-yellow-300":"bg-blue-900/20 text-blue-300"}`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />{w.message}
            </div>
          ))}
        </div>
      )}
      {p.internalNotes && (
        <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/40 text-xs mb-1">ملاحظات داخلية</p>
          <p className="text-white/70 text-sm">{p.internalNotes}</p>
        </div>
      )}
    </div>
  );
}

function SectionTable({ title, total, items }: { title: string; total: number; items: { label: string; value: number; strike?: boolean }[] }) {
  return (
    <div className="mb-4 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white/5">
        <h3 className="text-white font-bold text-sm">{title}</h3>
        <span className="text-amber-400 font-bold text-sm">{fmt(total)}</span>
      </div>
      <div className="divide-y divide-white/5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-white/70">{item.label}</span>
            <span className={item.strike ? "line-through text-white/30" : "text-white font-medium"}>{fmt(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Client View ──────────────────────────────────────────────────────────────
function ClientView(p: any) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">📋 عرض العميل</h2>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-600/30 text-sm">
            <Printer className="w-4 h-4" /> طباعة
          </button>
          <button onClick={() => { navigator.clipboard.writeText(`عرض سعر - ${p.projectCode}\nالإجمالي: ${fmt(p.grandTotal)}`); toast.success("تم نسخ الملخص"); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/60 text-sm">
            <Share2 className="w-4 h-4" /> مشاركة
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-900 to-amber-700 rounded-2xl p-6 mb-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">Professor Company</h1>
        <p className="text-amber-200 text-sm">عرض سعر مطبخ</p>
        <p className="text-amber-300 text-xs mt-2">كود: {p.projectCode} | التاريخ: {new Date().toLocaleDateString("ar-EG")}</p>
        {p.clientName && <p className="text-white font-bold mt-3 text-lg">السيد / {p.clientName}</p>}
      </div>

      <div className="space-y-3 mb-6">
        {[
          { l: "الخامات والتصنيع",       v: p.matTotal, show: p.matTotal > 0 },
          { l: "الإكسسوارات والتجهيزات", v: p.accTotal, show: p.accTotal > 0 },
          { l: "الرخام والكونتر",         v: p.mrbTotal, show: p.mrbTotal > 0 },
          { l: "التجاليد والديكور",       v: p.cldTotal, show: p.cldTotal > 0 },
          { l: "النقل والتركيب",          v: p.trpTotal, show: p.trpTotal > 0 },
        ].filter(r => r.show).map(row => (
          <div key={row.l} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-white">{row.l}</span>
            <span className="text-white font-bold">{fmt(row.v)}</span>
          </div>
        ))}
      </div>

      <div className="bg-amber-900/30 border-2 border-amber-600/50 rounded-2xl p-6">
        {p.discAmt > 0 && (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">قبل الخصم</span>
              <span className="text-white line-through">{fmt(p.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-green-400">خصم خاص</span>
              <span className="text-green-400">-{fmt(p.discAmt)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center">
          <span className="text-amber-400 font-bold text-xl">إجمالي العرض</span>
          <span className="text-amber-400 font-bold text-3xl">{fmt(p.grandTotal)}</span>
        </div>
        <p className="text-amber-300/60 text-xs mt-3 text-center">* العرض ساري لمدة 7 أيام من تاريخه</p>
      </div>

      {p.notes && (
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/40 text-xs mb-1">ملاحظات</p>
          <p className="text-white/70 text-sm">{p.notes}</p>
        </div>
      )}
    </div>
  );
}
