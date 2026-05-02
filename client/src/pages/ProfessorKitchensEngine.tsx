import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle, Info,
  ChevronDown, ChevronUp, Eye, EyeOff, FileText, MessageSquare, Play,
  Plus, Minus, Trash2, RefreshCw, Printer, Share2, BookOpen, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SelectedMaterial { id: number; name: string; brand: string; pricePerM2: number; area: number; total: number; location: string; }
interface SelectedAccessory { id: number; name: string; brand: string; unitPrice: number; qty: number; total: number; isFree: boolean; }
interface SelectedMarble { id: number; name: string; type: string; pricePerM2: number; area: number; total: number; }
interface SelectedCladding { id: number; name: string; pricePerM2: number; qty: number; total: number; }
interface TransportData { ruleId: number; governorate: string; basePrice: number; carryingPrice: number; total: number; }
interface Warning { type: string; message: string; severity: "error" | "warning" | "info"; }

const STEPS = [
  { id: 1, title: "بيانات العميل والمشروع", icon: "👤" },
  { id: 2, title: "أبعاد المطبخ", icon: "📐" },
  { id: 3, title: "الخامات", icon: "🪵" },
  { id: 4, title: "الإكسسوارات", icon: "⚙️" },
  { id: 5, title: "الرخام والكونتر", icon: "🪨" },
  { id: 6, title: "التجاليد والديكور", icon: "🎨" },
  { id: 7, title: "النقل والتركيب", icon: "🚚" },
  { id: 8, title: "الخصم والموافقات", icon: "💰" },
  { id: 9, title: "التحذيرات والمراجعة", icon: "⚠️" },
  { id: 10, title: "العرض الداخلي", icon: "🔒" },
  { id: 11, title: "عرض العميل", icon: "📋" },
];

function formatEGP(n: number) { return n.toLocaleString("ar-EG") + " ج"; }

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfessorKitchensEngine() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [viewMode, setViewMode] = useState<"internal" | "client">("internal");

  // Step 1: Client data
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [engineerName, setEngineerName] = useState("");
  const [projectCode] = useState(() => `PRF-${Date.now().toString().slice(-6)}`);

  // Step 2: Dimensions
  const [kitchenLength, setKitchenLength] = useState("");
  const [kitchenWidth, setKitchenWidth] = useState("");
  const [lowerArea, setLowerArea] = useState("");
  const [upperArea, setUpperArea] = useState("");
  const [tallArea, setTallArea] = useState("");
  const [specialArea, setSpecialArea] = useState("");

  // Step 3: Materials
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [materialFilter, setMaterialFilter] = useState("all");

  // Step 4: Accessories
  const [selectedAccessories, setSelectedAccessories] = useState<SelectedAccessory[]>([]);
  const [accessoryFilter, setAccessoryFilter] = useState("all");
  const [showPlaybook, setShowPlaybook] = useState<number | null>(null);

  // Step 5: Marble
  const [selectedMarble, setSelectedMarble] = useState<SelectedMarble[]>([]);

  // Step 6: Cladding
  const [selectedCladding, setSelectedCladding] = useState<SelectedCladding[]>([]);

  // Step 7: Transport
  const [transport, setTransport] = useState<TransportData | null>(null);

  // Step 8: Discount
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState("");

  // Step 9: Warnings
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Data queries
  const { data: materials = [] } = trpc.kitchen.getMaterials.useQuery();
  const { data: accessories = [] } = trpc.kitchen.getAccessories.useQuery();
  const { data: marbles = [] } = trpc.kitchen.getMarble.useQuery();
  const { data: claddings = [] } = trpc.kitchen.getCladding.useQuery();
  const { data: transportRules = [] } = trpc.platform.getTransportRules.useQuery();

  // ─── Totals ───────────────────────────────────────────────────────────────
  const materialsTotal = useMemo(() => selectedMaterials.reduce((s, m) => s + m.total, 0), [selectedMaterials]);
  const accessoriesTotal = useMemo(() => selectedAccessories.filter(a => !a.isFree).reduce((s, a) => s + a.total, 0), [selectedAccessories]);
  const marbleTotal = useMemo(() => selectedMarble.reduce((s, m) => s + m.total, 0), [selectedMarble]);
  const claddingTotal = useMemo(() => selectedCladding.reduce((s, c) => s + c.total, 0), [selectedCladding]);
  const transportTotal = transport?.total ?? 0;
  const subtotal = materialsTotal + accessoriesTotal + marbleTotal + claddingTotal + transportTotal;
  const discountAmount = discountType === "percentage" ? Math.round(subtotal * discountValue / 100) : discountType === "fixed" ? discountValue : 0;
  const grandTotal = subtotal - discountAmount;
  const discountPct = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;

  // ─── Warnings Engine ──────────────────────────────────────────────────────
  const computeWarnings = () => {
    const w: Warning[] = [];
    if (selectedMaterials.length === 0) w.push({ type: "no_materials", message: "لم يتم اختيار أي خامات", severity: "error" });
    if (selectedAccessories.length === 0) w.push({ type: "no_accessories", message: "لم يتم اختيار أي إكسسوارات", severity: "warning" });
    if (selectedMarble.length === 0) w.push({ type: "no_marble", message: "لم يتم اختيار الرخام / الكونتر", severity: "warning" });
    if (!transport) w.push({ type: "no_transport", message: "لم يتم إضافة النقل والتركيب", severity: "warning" });
    if (discountPct > 15) w.push({ type: "high_discount", message: `الخصم (${discountPct.toFixed(1)}%) يتجاوز 15% — يحتاج موافقة مدير`, severity: "error" });
    const freeCount = selectedAccessories.filter(a => a.isFree).length;
    if (freeCount > 2) w.push({ type: "too_many_free", message: `عدد البنود المجانية (${freeCount}) مرتفع`, severity: "error" });
    if (subtotal > 0 && accessoriesTotal / subtotal > 0.4) w.push({ type: "high_acc_ratio", message: "نسبة الإكسسوارات أكثر من 40% من الإجمالي", severity: "warning" });
    if (grandTotal > 0 && grandTotal < 50000) w.push({ type: "low_total", message: "السعر النهائي منخفض جداً (أقل من 50,000 ج)", severity: "warning" });
    setWarnings(w);
    return w;
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const canProceed = (step: number) => {
    if (step === 1) return clientName.trim().length > 0;
    if (step === 2) return lowerArea.length > 0 || upperArea.length > 0;
    if (step === 3) return selectedMaterials.length > 0;
    return true;
  };

  const goNext = () => {
    if (currentStep === 9) computeWarnings();
    if (currentStep < 11) setCurrentStep(s => s + 1);
  };
  const goPrev = () => { if (currentStep > 1) setCurrentStep(s => s - 1); };

  // ─── Material helpers ─────────────────────────────────────────────────────
  const addMaterial = (mat: any, area: number, location: string) => {
    const total = Math.round(mat.pricePerM2 * area);
    setSelectedMaterials(prev => [...prev.filter(m => m.id !== mat.id), { id: mat.id, name: mat.name, brand: mat.brand, pricePerM2: mat.pricePerM2, area, total, location }]);
  };
  const removeMaterial = (id: number) => setSelectedMaterials(prev => prev.filter(m => m.id !== id));

  // ─── Accessory helpers ────────────────────────────────────────────────────
  const addAccessory = (acc: any) => {
    setSelectedAccessories(prev => {
      const ex = prev.find(a => a.id === acc.id);
      if (ex) return prev.map(a => a.id === acc.id ? { ...a, qty: a.qty + 1, total: (a.qty + 1) * a.unitPrice } : a);
      return [...prev, { id: acc.id, name: acc.name, brand: acc.brand, unitPrice: acc.unitPrice, qty: 1, total: acc.unitPrice, isFree: false }];
    });
  };
  const removeAccessory = (id: number) => setSelectedAccessories(prev => prev.filter(a => a.id !== id));
  const toggleFree = (id: number) => setSelectedAccessories(prev => prev.map(a => a.id === id ? { ...a, isFree: !a.isFree } : a));

  // ─── Marble helpers ───────────────────────────────────────────────────────
  const addMarble = (marble: any, area: number) => {
    const total = Math.round(marble.pricePerM2 * area);
    setSelectedMarble(prev => [...prev.filter(m => m.id !== marble.id), { id: marble.id, name: marble.name, type: marble.marbleType, pricePerM2: marble.pricePerM2, area, total }]);
  };

  // ─── Cladding helpers ─────────────────────────────────────────────────────
  const addCladding = (cladding: any, qty: number) => {
    const total = Math.round(cladding.pricePerM2 * qty);
    setSelectedCladding(prev => [...prev.filter(c => c.id !== cladding.id), { id: cladding.id, name: cladding.name, pricePerM2: cladding.pricePerM2, qty, total }]);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/brands")} className="p-2 rounded-lg hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </button>
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
              {viewMode === "internal" ? "عرض العميل" : "العرض الداخلي"}
            </button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                  currentStep === step.id
                    ? "bg-amber-600 text-white font-bold"
                    : currentStep > step.id
                    ? "bg-green-900/50 text-green-400"
                    : "bg-white/5 text-white/40"
                }`}
              >
                <span>{step.icon}</span>
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{step.id}</span>
                {currentStep > step.id && <CheckCircle2 className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Totals Bar */}
      <div className="bg-black/40 border-b border-white/5 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-white/40">خامات: <span className="text-white">{formatEGP(materialsTotal)}</span></span>
            <span className="text-white/40">إكسسوارات: <span className="text-white">{formatEGP(accessoriesTotal)}</span></span>
            <span className="text-white/40">رخام: <span className="text-white">{formatEGP(marbleTotal)}</span></span>
            <span className="text-white/40">نقل: <span className="text-white">{formatEGP(transportTotal)}</span></span>
          </div>
          <div className="flex items-center gap-3">
            {discountAmount > 0 && <span className="text-red-400">خصم: -{formatEGP(discountAmount)}</span>}
            <span className="text-amber-400 font-bold text-sm">الإجمالي: {formatEGP(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Step 1: Client Data ── */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">👤 بيانات العميل والمشروع</h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "اسم العميل *", value: clientName, set: setClientName, placeholder: "محمد أحمد" },
                { label: "رقم الهاتف", value: clientPhone, set: setClientPhone, placeholder: "01xxxxxxxxx" },
                { label: "العنوان", value: address, set: setAddress, placeholder: "المنطقة، المدينة" },
                { label: "اسم المهندس", value: engineerName, set: setEngineerName, placeholder: "م. أحمد" },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-sm text-white/60 mb-1">{field.label}</label>
                  <input
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-white/60 mb-1">المحافظة</label>
                <select
                  value={governorate}
                  onChange={e => setGovernorate(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">اختر المحافظة</option>
                  {(transportRules as any[]).map((r: any) => (
                    <option key={r.id} value={r.governorate}>{r.governorate}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Dimensions ── */}
        {currentStep === 2 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">📐 أبعاد المطبخ</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "طول المطبخ (م)", value: kitchenLength, set: setKitchenLength },
                { label: "عرض المطبخ (م)", value: kitchenWidth, set: setKitchenWidth },
                { label: "مساحة الوحدات السفلية (م²) *", value: lowerArea, set: setLowerArea },
                { label: "مساحة الوحدات العلوية (م²)", value: upperArea, set: setUpperArea },
                { label: "مساحة الوحدات الطويلة (م²)", value: tallArea, set: setTallArea },
                { label: "وحدات خاصة (م²)", value: specialArea, set: setSpecialArea },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-sm text-white/60 mb-1">{field.label}</label>
                  <input
                    type="number" step="0.1" value={field.value}
                    onChange={e => field.set(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>
            {(parseFloat(lowerArea) + parseFloat(upperArea || "0") + parseFloat(tallArea || "0")) > 0 && (
              <div className="mt-4 p-4 bg-amber-900/20 border border-amber-700/30 rounded-xl">
                <p className="text-amber-400 text-sm">
                  إجمالي المساحة: <strong>{(parseFloat(lowerArea || "0") + parseFloat(upperArea || "0") + parseFloat(tallArea || "0") + parseFloat(specialArea || "0")).toFixed(2)} م²</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Materials ── */}
        {currentStep === 3 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">🪵 الخامات</h2>
              <div className="flex gap-2">
                {["all", "First Wood", "Good Wood"].map(f => (
                  <button key={f} onClick={() => setMaterialFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs ${materialFilter === f ? "bg-amber-600 text-white" : "bg-white/10 text-white/60"}`}>
                    {f === "all" ? "الكل" : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected summary */}
            {selectedMaterials.length > 0 && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                <h3 className="text-green-400 text-sm font-bold mb-2">الخامات المختارة ({selectedMaterials.length})</h3>
                <div className="space-y-2">
                  {selectedMaterials.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <span className="text-white">{m.name} — {m.location} — {m.area}م²</span>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400">{formatEGP(m.total)}</span>
                        <button onClick={() => removeMaterial(m.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(materials as any[]).filter((m: any) => materialFilter === "all" || m.brand === materialFilter).map((mat: any) => (
                <MaterialCard key={mat.id} mat={mat} onAdd={addMaterial} totalArea={parseFloat(lowerArea || "0") + parseFloat(upperArea || "0") + parseFloat(tallArea || "0")} />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Accessories ── */}
        {currentStep === 4 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">⚙️ الإكسسوارات</h2>
              <div className="flex gap-2 flex-wrap">
                {["all", "JT", "SX", "عامة"].map(f => (
                  <button key={f} onClick={() => setAccessoryFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs ${accessoryFilter === f ? "bg-amber-600 text-white" : "bg-white/10 text-white/60"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {selectedAccessories.length > 0 && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                <h3 className="text-green-400 text-sm font-bold mb-2">الإكسسوارات المختارة ({selectedAccessories.length})</h3>
                <div className="space-y-2">
                  {selectedAccessories.map(a => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{a.name}</span>
                        <span className="text-white/40">×{a.qty}</span>
                        {a.isFree && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">مجاني</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={a.isFree ? "line-through text-white/30" : "text-amber-400"}>{formatEGP(a.total)}</span>
                        <button onClick={() => toggleFree(a.id)} className="text-xs text-white/40 hover:text-white/70 border border-white/20 px-2 py-0.5 rounded">
                          {a.isFree ? "إلغاء مجاني" : "مجاني"}
                        </button>
                        <button onClick={() => removeAccessory(a.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(accessories as any[]).filter((a: any) => accessoryFilter === "all" || a.brand === accessoryFilter).map((acc: any) => (
                <AccessoryCard key={acc.id} acc={acc} onAdd={addAccessory} showPlaybook={showPlaybook === acc.id} onTogglePlaybook={() => setShowPlaybook(showPlaybook === acc.id ? null : acc.id)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 5: Marble ── */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">🪨 الرخام والكونتر</h2>
            {selectedMarble.length > 0 && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                {selectedMarble.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-white">{m.name} — {m.area}م²</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400">{formatEGP(m.total)}</span>
                      <button onClick={() => setSelectedMarble(prev => prev.filter(x => x.id !== m.id))} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(marbles as any[]).map((marble: any) => (
                <MarbleCard key={marble.id} marble={marble} onAdd={addMarble} />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 6: Cladding ── */}
        {currentStep === 6 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">🎨 التجاليد والديكور</h2>
            {selectedCladding.length > 0 && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                {selectedCladding.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-white">{c.name} — {c.qty}م²</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400">{formatEGP(c.total)}</span>
                      <button onClick={() => setSelectedCladding(prev => prev.filter(x => x.id !== c.id))} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(claddings as any[]).map((cladding: any) => (
                <CladdingCard key={cladding.id} cladding={cladding} onAdd={addCladding} />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 7: Transport ── */}
        {currentStep === 7 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">🚚 النقل والتركيب</h2>
            <div className="space-y-3">
              {(transportRules as any[]).map((rule: any) => (
                <button
                  key={rule.id}
                  onClick={() => setTransport({ ruleId: rule.id, governorate: rule.governorate, basePrice: rule.basePrice, carryingPrice: rule.carryingPrice, total: rule.basePrice + rule.carryingPrice })}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${transport?.ruleId === rule.id ? "border-amber-500 bg-amber-900/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <div className="text-right">
                    <p className="font-bold text-white">{rule.governorate}</p>
                    <p className="text-xs text-white/40">نقل: {formatEGP(rule.basePrice)} + حمل: {formatEGP(rule.carryingPrice)}</p>
                  </div>
                  <span className="text-amber-400 font-bold">{formatEGP(rule.basePrice + rule.carryingPrice)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 8: Discount ── */}
        {currentStep === 8 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">💰 الخصم والموافقات</h2>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-6">
              <p className="text-white/60 text-sm mb-1">الإجمالي قبل الخصم</p>
              <p className="text-3xl font-bold text-white">{formatEGP(subtotal)}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">نوع الخصم</label>
                <div className="flex gap-3">
                  {[{ v: "none" as const, l: "بدون خصم" }, { v: "percentage" as const, l: "نسبة %" }, { v: "fixed" as const, l: "مبلغ ثابت" }].map(opt => (
                    <button key={opt.v} onClick={() => setDiscountType(opt.v)}
                      className={`flex-1 py-2 rounded-xl text-sm transition-colors ${discountType === opt.v ? "bg-amber-600 text-white" : "bg-white/10 text-white/60"}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              {discountType !== "none" && (
                <>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">{discountType === "percentage" ? "نسبة الخصم (%)" : "مبلغ الخصم (ج)"}</label>
                    <input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">سبب الخصم</label>
                    <input value={discountReason} onChange={e => setDiscountReason(e.target.value)}
                      placeholder="مثال: عميل قديم، حجم طلب كبير..."
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  {discountPct > 15 && (
                    <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      <p className="text-red-400 text-sm">الخصم ({discountPct.toFixed(1)}%) يتجاوز 15% — يحتاج موافقة مدير</p>
                    </div>
                  )}
                  <div className="p-4 bg-amber-900/20 border border-amber-700/30 rounded-xl">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/60">الإجمالي قبل الخصم</span>
                      <span className="text-white">{formatEGP(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-red-400">الخصم</span>
                      <span className="text-red-400">-{formatEGP(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-amber-400">الإجمالي النهائي</span>
                      <span className="text-amber-400 text-xl">{formatEGP(grandTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Step 9: Warnings & Review ── */}
        {currentStep === 9 && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">⚠️ التحذيرات والمراجعة</h2>
              <Button onClick={computeWarnings} variant="outline" size="sm" className="border-amber-600 text-amber-400">
                <RefreshCw className="w-4 h-4 ml-1" /> تحديث
              </Button>
            </div>

            {warnings.length === 0 ? (
              <div className="p-6 bg-green-900/20 border border-green-700/30 rounded-xl flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-green-400 font-bold">لا توجد تحذيرات</p>
                  <p className="text-green-400/60 text-sm">العرض جاهز للمراجعة النهائية</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {warnings.map((w, i) => (
                  <div key={i} className={`p-4 rounded-xl flex items-start gap-3 border ${
                    w.severity === "error" ? "bg-red-900/20 border-red-700/30" :
                    w.severity === "warning" ? "bg-yellow-900/20 border-yellow-700/30" :
                    "bg-blue-900/20 border-blue-700/30"
                  }`}>
                    {w.severity === "error" ? <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" /> :
                     w.severity === "warning" ? <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" /> :
                     <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
                    <p className={`text-sm ${w.severity === "error" ? "text-red-300" : w.severity === "warning" ? "text-yellow-300" : "text-blue-300"}`}>
                      {w.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Summary table */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <h3 className="text-white font-bold mb-3">ملخص العرض</h3>
              <table className="w-full text-sm">
                <tbody className="space-y-2">
                  {[
                    { label: "الخامات", value: materialsTotal, count: selectedMaterials.length },
                    { label: "الإكسسوارات", value: accessoriesTotal, count: selectedAccessories.length },
                    { label: "الرخام والكونتر", value: marbleTotal, count: selectedMarble.length },
                    { label: "التجاليد والديكور", value: claddingTotal, count: selectedCladding.length },
                    { label: "النقل والتركيب", value: transportTotal, count: transport ? 1 : 0 },
                  ].map(row => (
                    <tr key={row.label} className="border-b border-white/5">
                      <td className="py-2 text-white/60">{row.label}</td>
                      <td className="py-2 text-center text-white/40">{row.count} بند</td>
                      <td className="py-2 text-left text-white font-medium">{formatEGP(row.value)}</td>
                    </tr>
                  ))}
                  {discountAmount > 0 && (
                    <tr className="border-b border-white/5">
                      <td className="py-2 text-red-400">الخصم</td>
                      <td></td>
                      <td className="py-2 text-left text-red-400">-{formatEGP(discountAmount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-3 text-amber-400 font-bold text-base">الإجمالي النهائي</td>
                    <td></td>
                    <td className="py-3 text-left text-amber-400 font-bold text-xl">{formatEGP(grandTotal)}</td>
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

        {/* ── Step 10: Internal View ── */}
        {currentStep === 10 && (
          <InternalView
            clientName={clientName} clientPhone={clientPhone} address={address} governorate={governorate}
            engineerName={engineerName} projectCode={projectCode}
            kitchenLength={kitchenLength} kitchenWidth={kitchenWidth}
            selectedMaterials={selectedMaterials} selectedAccessories={selectedAccessories}
            selectedMarble={selectedMarble} selectedCladding={selectedCladding} transport={transport}
            materialsTotal={materialsTotal} accessoriesTotal={accessoriesTotal} marbleTotal={marbleTotal}
            claddingTotal={claddingTotal} transportTotal={transportTotal} subtotal={subtotal}
            discountAmount={discountAmount} discountType={discountType} discountValue={discountValue}
            discountReason={discountReason} grandTotal={grandTotal} warnings={warnings}
            internalNotes={internalNotes} notes={notes}
          />
        )}

        {/* ── Step 11: Client View ── */}
        {currentStep === 11 && (
          <ClientView
            clientName={clientName} projectCode={projectCode}
            selectedMaterials={selectedMaterials} selectedAccessories={selectedAccessories}
            selectedMarble={selectedMarble} selectedCladding={selectedCladding} transport={transport}
            materialsTotal={materialsTotal} accessoriesTotal={accessoriesTotal} marbleTotal={marbleTotal}
            claddingTotal={claddingTotal} transportTotal={transportTotal} subtotal={subtotal}
            discountAmount={discountAmount} grandTotal={grandTotal} notes={notes}
          />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button onClick={goPrev} disabled={currentStep === 1} variant="outline" className="border-white/20 text-white/60">
            <ArrowRight className="w-4 h-4 ml-1" /> السابق
          </Button>
          <span className="text-white/40 text-sm">{currentStep} / {STEPS.length}</span>
          {currentStep < 11 ? (
            <Button onClick={goNext} disabled={!canProceed(currentStep)} className="bg-amber-600 hover:bg-amber-500 text-white">
              التالي <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          ) : (
            <Button onClick={() => { toast.success("تم حفظ العرض بنجاح!"); navigate("/brands"); }} className="bg-green-600 hover:bg-green-500 text-white">
              <CheckCircle2 className="w-4 h-4 ml-1" /> حفظ وإنهاء
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function MaterialCard({ mat, onAdd, totalArea }: { mat: any; onAdd: any; totalArea: number }) {
  const [area, setArea] = useState(totalArea > 0 ? totalArea.toString() : "");
  const [location, setLocation] = useState("سفلي وعلوي");
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-bold text-white text-sm">{mat.name}</h4>
          <p className="text-xs text-amber-400">{mat.brand}</p>
        </div>
        <span className="text-amber-400 font-bold text-sm">{formatEGP(mat.pricePerM2)}/م²</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <input type="number" step="0.1" value={area} onChange={e => setArea(e.target.value)}
          placeholder="المساحة م²"
          className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500" />
        <select value={location} onChange={e => setLocation(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg px-2 py-2 text-white text-xs focus:outline-none focus:border-amber-500">
          <option>سفلي وعلوي</option>
          <option>سفلي فقط</option>
          <option>علوي فقط</option>
          <option>طويل</option>
          <option>خاص</option>
        </select>
      </div>
      {area && parseFloat(area) > 0 && (
        <p className="text-xs text-white/40 mt-1">= {formatEGP(Math.round(mat.pricePerM2 * parseFloat(area)))}</p>
      )}
      <Button onClick={() => area && parseFloat(area) > 0 && onAdd(mat, parseFloat(area), location)}
        className="w-full mt-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 text-xs h-8">
        <Plus className="w-3 h-3 ml-1" /> إضافة
      </Button>
    </div>
  );
}

function AccessoryCard({ acc, onAdd, showPlaybook, onTogglePlaybook }: { acc: any; onAdd: any; showPlaybook: boolean; onTogglePlaybook: () => void }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-bold text-white text-sm">{acc.name}</h4>
          <p className="text-xs text-amber-400">{acc.brand}</p>
          {acc.category && <p className="text-xs text-white/40">{acc.category}</p>}
        </div>
        <span className="text-amber-400 font-bold text-sm">{formatEGP(acc.unitPrice)}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={() => onAdd(acc)} className="flex-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 text-xs h-8">
          <Plus className="w-3 h-3 ml-1" /> إضافة
        </Button>
        <button onClick={onTogglePlaybook} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
          <BookOpen className="w-4 h-4" />
        </button>
      </div>
      {showPlaybook && (
        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg text-xs text-blue-300">
          <p className="font-bold mb-1">💡 Playbook</p>
          <p>سكريبت المبيعات لهذا الإكسسوار سيظهر هنا بعد إضافة البيانات من لوحة الإدارة.</p>
        </div>
      )}
    </div>
  );
}

function MarbleCard({ marble, onAdd }: { marble: any; onAdd: any }) {
  const [area, setArea] = useState("");
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-bold text-white text-sm">{marble.name}</h4>
          <p className="text-xs text-white/40">{marble.marbleType}</p>
        </div>
        <span className="text-amber-400 font-bold text-sm">{formatEGP(marble.pricePerM2)}/م²</span>
      </div>
      <input type="number" step="0.1" value={area} onChange={e => setArea(e.target.value)}
        placeholder="المساحة م²"
        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-xs mt-2 focus:outline-none focus:border-amber-500" />
      {area && parseFloat(area) > 0 && (
        <p className="text-xs text-white/40 mt-1">= {formatEGP(Math.round(marble.pricePerM2 * parseFloat(area)))}</p>
      )}
      <Button onClick={() => area && parseFloat(area) > 0 && onAdd(marble, parseFloat(area))}
        className="w-full mt-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 text-xs h-8">
        <Plus className="w-3 h-3 ml-1" /> إضافة
      </Button>
    </div>
  );
}

function CladdingCard({ cladding, onAdd }: { cladding: any; onAdd: any }) {
  const [qty, setQty] = useState("");
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-bold text-white text-sm">{cladding.name}</h4>
          <p className="text-xs text-white/40">{cladding.claddingType}</p>
        </div>
        <span className="text-amber-400 font-bold text-sm">{formatEGP(cladding.pricePerM2)}/م²</span>
      </div>
      <input type="number" step="0.1" value={qty} onChange={e => setQty(e.target.value)}
        placeholder="الكمية / المساحة"
        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-xs mt-2 focus:outline-none focus:border-amber-500" />
      <Button onClick={() => qty && parseFloat(qty) > 0 && onAdd(cladding, parseFloat(qty))}
        className="w-full mt-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 text-xs h-8">
        <Plus className="w-3 h-3 ml-1" /> إضافة
      </Button>
    </div>
  );
}

// ─── Internal View ────────────────────────────────────────────────────────────
function InternalView(props: any) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">🔒 العرض الداخلي</h2>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 text-sm">
            <Printer className="w-4 h-4" /> طباعة
          </button>
        </div>
      </div>

      {/* Client & Project Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-white/60 text-xs mb-2">بيانات العميل</h3>
          <p className="text-white font-bold">{props.clientName || "—"}</p>
          <p className="text-white/60 text-sm">{props.clientPhone}</p>
          <p className="text-white/60 text-sm">{props.address}</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-white/60 text-xs mb-2">بيانات المشروع</h3>
          <p className="text-white font-bold">{props.projectCode}</p>
          <p className="text-white/60 text-sm">المهندس: {props.engineerName || "—"}</p>
          <p className="text-white/60 text-sm">المحافظة: {props.governorate || "—"}</p>
        </div>
      </div>

      {/* Detailed breakdown */}
      {[
        { title: "الخامات", items: props.selectedMaterials, total: props.materialsTotal, renderItem: (m: any) => `${m.name} (${m.brand}) — ${m.location} — ${m.area}م² × ${formatEGP(m.pricePerM2)}/م²` },
        { title: "الإكسسوارات", items: props.selectedAccessories, total: props.accessoriesTotal, renderItem: (a: any) => `${a.name} (${a.brand}) × ${a.qty}${a.isFree ? " [مجاني]" : ""}` },
        { title: "الرخام والكونتر", items: props.selectedMarble, total: props.marbleTotal, renderItem: (m: any) => `${m.name} (${m.type}) — ${m.area}م²` },
        { title: "التجاليد والديكور", items: props.selectedCladding, total: props.claddingTotal, renderItem: (c: any) => `${c.name} — ${c.qty}م²` },
      ].map(section => section.items.length > 0 && (
        <div key={section.title} className="mb-4 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5">
            <h3 className="text-white font-bold text-sm">{section.title}</h3>
            <span className="text-amber-400 font-bold text-sm">{formatEGP(section.total)}</span>
          </div>
          <div className="divide-y divide-white/5">
            {section.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-white/70">{section.renderItem(item)}</span>
                <span className={`font-medium ${item.isFree ? "line-through text-white/30" : "text-white"}`}>{formatEGP(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Transport */}
      {props.transport && (
        <div className="mb-4 bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex justify-between">
            <span className="text-white">النقل والتركيب — {props.transport.governorate}</span>
            <span className="text-amber-400 font-bold">{formatEGP(props.transportTotal)}</span>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-white/60">المجموع الفرعي</span><span className="text-white">{formatEGP(props.subtotal)}</span></div>
          {props.discountAmount > 0 && <div className="flex justify-between"><span className="text-red-400">الخصم ({props.discountType === "percentage" ? `${props.discountValue}%` : "مبلغ ثابت"})</span><span className="text-red-400">-{formatEGP(props.discountAmount)}</span></div>}
          <div className="flex justify-between text-lg font-bold border-t border-amber-700/30 pt-2"><span className="text-amber-400">الإجمالي النهائي</span><span className="text-amber-400">{formatEGP(props.grandTotal)}</span></div>
        </div>
      </div>

      {/* Warnings */}
      {props.warnings.length > 0 && (
        <div className="mt-4 space-y-2">
          {props.warnings.map((w: Warning, i: number) => (
            <div key={i} className={`p-3 rounded-lg flex items-center gap-2 text-sm ${w.severity === "error" ? "bg-red-900/20 text-red-300" : w.severity === "warning" ? "bg-yellow-900/20 text-yellow-300" : "bg-blue-900/20 text-blue-300"}`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {w.message}
            </div>
          ))}
        </div>
      )}

      {props.internalNotes && (
        <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/40 text-xs mb-1">ملاحظات داخلية</p>
          <p className="text-white/70 text-sm">{props.internalNotes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Client View ──────────────────────────────────────────────────────────────
function ClientView(props: any) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">📋 عرض العميل</h2>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-600/30 text-sm">
            <Printer className="w-4 h-4" /> طباعة
          </button>
          <button onClick={() => { navigator.clipboard.writeText(`عرض سعر - ${props.projectCode}\nالإجمالي: ${formatEGP(props.grandTotal)}`); toast.success("تم نسخ الملخص"); }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/60 text-sm">
            <Share2 className="w-4 h-4" /> مشاركة
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-700 rounded-2xl p-6 mb-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">Professor Company</h1>
        <p className="text-amber-200 text-sm">عرض سعر مطبخ</p>
        <p className="text-amber-300 text-xs mt-2">كود: {props.projectCode} | التاريخ: {new Date().toLocaleDateString("ar-EG")}</p>
        {props.clientName && <p className="text-white font-bold mt-3 text-lg">السيد / {props.clientName}</p>}
      </div>

      {/* Category summaries (client-friendly) */}
      <div className="space-y-3 mb-6">
        {[
          { label: "الخامات والتصنيع", value: props.materialsTotal, show: props.materialsTotal > 0 },
          { label: "الإكسسوارات والتجهيزات", value: props.accessoriesTotal, show: props.accessoriesTotal > 0 },
          { label: "الرخام والكونتر", value: props.marbleTotal, show: props.marbleTotal > 0 },
          { label: "التجاليد والديكور", value: props.claddingTotal, show: props.claddingTotal > 0 },
          { label: "النقل والتركيب", value: props.transportTotal, show: props.transportTotal > 0 },
        ].filter(r => r.show).map(row => (
          <div key={row.label} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-white">{row.label}</span>
            <span className="text-white font-bold">{formatEGP(row.value)}</span>
          </div>
        ))}
      </div>

      {/* Grand Total */}
      <div className="bg-amber-900/30 border-2 border-amber-600/50 rounded-2xl p-6">
        {props.discountAmount > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">الإجمالي قبل الخصم</span>
            <span className="text-white line-through">{formatEGP(props.subtotal)}</span>
          </div>
        )}
        {props.discountAmount > 0 && (
          <div className="flex justify-between text-sm mb-3">
            <span className="text-green-400">خصم خاص</span>
            <span className="text-green-400">-{formatEGP(props.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-amber-400 font-bold text-xl">إجمالي العرض</span>
          <span className="text-amber-400 font-bold text-3xl">{formatEGP(props.grandTotal)}</span>
        </div>
        <p className="text-amber-300/60 text-xs mt-3 text-center">* العرض ساري لمدة 7 أيام من تاريخه — الأسعار قابلة للتغيير</p>
      </div>

      {props.notes && (
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/40 text-xs mb-1">ملاحظات</p>
          <p className="text-white/70 text-sm">{props.notes}</p>
        </div>
      )}
    </div>
  );
}
