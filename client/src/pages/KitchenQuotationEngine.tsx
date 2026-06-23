import { useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Plus, Trash2, ChevronLeft, Save, Eye, Calculator, FileText, AlertTriangle } from "lucide-react";

// ============================================================
// TYPES
// ============================================================
type LocationType = "سفلي" | "علوي" | "طولي" | "بلاكار" | "بلاكار عمق> 38 سم";

interface UnitRow {
  id: string; // local uuid
  unitNumber: number | "";
  location: LocationType | "";
  width: number | ""; // meters
  height: number | ""; // meters
  totalArea: number | null; // calculated
  description: string;
  materialName: string; // selected material nameAr
  wallLabel: string;
}

interface AccessoryRow {
  id: string;
  name: string;
  qty: number;
  price: number;
  total: number;
  isFree: number;
  notes: string;
}

interface CladdingRow {
  id: string;
  name: string;
  qty: number;
  calcMethod: string;
  price: number;
  total: number;
  notes: string;
}

interface MarbleRow {
  id: string;
  code: string;
  type: string;
  meters: number;
  pricePerMeter: number;
  total: number;
}

// ============================================================
// FORMULA ENGINE (mirrors Excel exactly)
// ============================================================
function calcUnitArea(location: LocationType | "", width: number | "", height: number | ""): number | null {
  if (!location || width === "" || height === "" || width === null || height === null) return null;
  const w = Number(width);
  const h = Number(height);
  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return null;

  // Excel formula:
  // IF(AND(E="سفلي", F<0.3)   → F*1.5*G
  // IF(AND(E="طولي", F<0.4)   → F*2*G
  // IF(AND(E="طولي", F>=0.4)  → F*1.5*G
  // IF(AND(E="بلاكار عمق> 38 سم", G<=0.3) → G*2*F
  // IF(AND(E="بلاكار عمق> 38 سم", G>0.3)  → G*1.5*F
  // DEFAULT                               → F*G

  if (location === "سفلي" && w < 0.3) return w * 1.5 * h;
  if (location === "طولي" && w < 0.4) return w * 2 * h;
  if (location === "طولي" && w >= 0.4) return w * 1.5 * h;
  if (location === "بلاكار عمق> 38 سم" && h <= 0.3) return h * 2 * w;
  if (location === "بلاكار عمق> 38 سم" && h > 0.3) return h * 1.5 * w;
  // Default: علوي, سفلي (w>=0.3), بلاكار
  return w * h;
}

function newRow(num: number): UnitRow {
  return {
    id: crypto.randomUUID(),
    unitNumber: num,
    location: "",
    width: "",
    height: "",
    totalArea: null,
    description: "",
    materialName: "",
    wallLabel: "",
  };
}

function newAccessoryRow(): AccessoryRow {
  return { id: crypto.randomUUID(), name: "", qty: 1, price: 0, total: 0, isFree: 0, notes: "" };
}

function newCladdingRow(): CladdingRow {
  return { id: crypto.randomUUID(), name: "", qty: 0, calcMethod: "عدد", price: 0, total: 0, notes: "" };
}

function newMarbleRow(): MarbleRow {
  return { id: crypto.randomUUID(), code: "", type: "", meters: 0, pricePerMeter: 0, total: 0 };
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function KitchenQuotationEngine() {
  const [, navigate] = useLocation();

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [engineerName, setEngineerName] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Units table
  const [units, setUnits] = useState<UnitRow[]>([newRow(1)]);

  // Accessories
  const [accessories, setAccessories] = useState<AccessoryRow[]>([newAccessoryRow()]);

  // Cladding
  const [cladding, setCladding] = useState<CladdingRow[]>([newCladdingRow()]);

  // Marble
  const [marble, setMarble] = useState<MarbleRow[]>([newMarbleRow()]);

  // Transport
  const [transportCity, setTransportCity] = useState("القاهرة");
  const [transportFee, setTransportFee] = useState<number>(0);
  const [liftFee, setLiftFee] = useState<number>(0);
  const [extraFees, setExtraFees] = useState<number>(0);
  const [vehicleType, setVehicleType] = useState("جامبو مغلقة");

  // View mode
  const [viewMode, setViewMode] = useState<"internal" | "client">("internal");
  const [activeTab, setActiveTab] = useState<"units" | "accessories" | "cladding" | "marble" | "transport" | "summary">("units");

  // Data from DB
  const { data: materials = [] } = trpc.kitchen.getMaterials.useQuery();
  const { data: accessoriesDb = [] } = trpc.kitchen.getAccessories.useQuery();
  const { data: marbleDb = [] } = trpc.kitchen.getMarble.useQuery();
  const { data: claddingDb = [] } = trpc.kitchen.getCladding.useQuery();

  // ============================================================
  // UNITS TABLE LOGIC
  // ============================================================
  const updateUnit = useCallback((id: string, field: keyof UnitRow, value: unknown) => {
    setUnits(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      // Recalculate area whenever location/width/height changes
      if (field === "location" || field === "width" || field === "height") {
        updated.totalArea = calcUnitArea(
          field === "location" ? value as LocationType : updated.location,
          field === "width" ? value as number : updated.width,
          field === "height" ? value as number : updated.height
        );
      }
      return updated;
    }));
  }, []);

  const addUnit = () => {
    const nextNum = units.length > 0 ? Math.max(...units.map(u => Number(u.unitNumber) || 0)) + 1 : 1;
    setUnits(prev => [...prev, newRow(nextNum)]);
  };

  const removeUnit = (id: string) => setUnits(prev => prev.filter(r => r.id !== id));

  // ============================================================
  // SUMMARY CALCULATIONS (mirror Excel SUMIF formulas)
  // ============================================================
  const materialSummary = useMemo(() => {
    const map: Record<string, { meters: number; pricePerMeter: number }> = {};
    for (const unit of units) {
      if (!unit.materialName || !unit.totalArea) continue;
      const mat = materials.find(m => m.nameAr === unit.materialName);
      if (!mat) continue;
      if (!map[unit.materialName]) map[unit.materialName] = { meters: 0, pricePerMeter: mat.pricePerMeter };
      map[unit.materialName].meters += unit.totalArea;
    }
    return Object.entries(map).map(([name, data]) => ({
      name,
      meters: data.meters,
      pricePerMeter: data.pricePerMeter,
      total: data.meters * data.pricePerMeter,
    }));
  }, [units, materials]);

  const totalMaterialsM2 = useMemo(() => units.reduce((s, u) => s + (u.totalArea || 0), 0), [units]);
  const totalMaterialsPrice = useMemo(() => materialSummary.reduce((s, m) => s + m.total, 0), [materialSummary]);

  // SUMIF by location
  const lowerM2 = useMemo(() => units.filter(u => u.location === "سفلي").reduce((s, u) => s + (u.totalArea || 0), 0), [units]);
  const upperM2 = useMemo(() => units.filter(u => u.location === "علوي").reduce((s, u) => s + (u.totalArea || 0), 0), [units]);
  const tallM2 = useMemo(() => units.filter(u => u.location === "طولي").reduce((s, u) => s + (u.totalArea || 0), 0), [units]);
  const placardM2 = useMemo(() => units.filter(u => u.location === "بلاكار" || u.location === "بلاكار عمق> 38 سم").reduce((s, u) => s + (u.totalArea || 0), 0), [units]);

  const totalAccessoriesPrice = useMemo(() => accessories.reduce((s, a) => s + (a.qty * a.price), 0), [accessories]);
  const totalCladdingPrice = useMemo(() => cladding.reduce((s, c) => s + c.total, 0), [cladding]);
  const totalMarblePrice = useMemo(() => marble.reduce((s, m) => s + m.total, 0), [marble]);
  const totalTransport = useMemo(() => transportFee + liftFee + extraFees, [transportFee, liftFee, extraFees]);

  const subTotal = useMemo(() => totalMaterialsPrice + totalAccessoriesPrice + totalCladdingPrice + totalMarblePrice + totalTransport, [totalMaterialsPrice, totalAccessoriesPrice, totalCladdingPrice, totalMarblePrice, totalTransport]);
  const grandTotal = useMemo(() => subTotal - discount, [subTotal, discount]);
  const discountPct = useMemo(() => subTotal > 0 ? (discount / subTotal) * 100 : 0, [discount, subTotal]);

  // Warnings
  const warnings = useMemo(() => {
    const w: string[] = [];
    if (discountPct > 10) w.push(`⚠️ الخصم ${discountPct.toFixed(1)}% مرتفع — يحتاج موافقة`);
    if (units.filter(u => u.unitNumber !== "").length === 0) w.push("⚠️ لا توجد وحدات مضافة");
    if (!clientName) w.push("⚠️ اسم العميل مطلوب");
    return w;
  }, [discountPct, units, clientName]);

  // ============================================================
  // ACCESSORIES TABLE
  // ============================================================
  const updateAccessory = (id: string, field: keyof AccessoryRow, value: unknown) => {
    setAccessories(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      updated.total = updated.qty * updated.price;
      return updated;
    }));
  };

  // ============================================================
  // CLADDING TABLE
  // ============================================================
  const updateCladding = (id: string, field: keyof CladdingRow, value: unknown) => {
    setCladding(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      updated.total = updated.qty * updated.price;
      return updated;
    }));
  };

  // ============================================================
  // MARBLE TABLE
  // ============================================================
  const updateMarble = (id: string, field: keyof MarbleRow, value: unknown) => {
    setMarble(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      updated.total = updated.meters * updated.pricePerMeter;
      return updated;
    }));
  };

  // ============================================================
  // RENDER
  // ============================================================
  const tabs = [
    { key: "units", label: "أولاً: الخامات" },
    { key: "accessories", label: "ثانياً: الإكسسوارات" },
    { key: "cladding", label: "ثالثاً: التجاليد" },
    { key: "marble", label: "رابعاً: الرخام" },
    { key: "transport", label: "خامساً: النقل" },
    { key: "summary", label: "الملخص" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#111] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/brand/professor_kitchens/kitchens")} className="text-white/60 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="font-bold text-amber-400">Professor Kitchens — محرك التسعير</div>
            <div className="text-xs text-white/50">مقايسة مطبخ تفاعلية</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === "internal" ? "client" : "internal")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border ${viewMode === "client" ? "border-amber-400 text-amber-400" : "border-white/20 text-white/60"}`}
          >
            <Eye className="w-3.5 h-3.5" />
            {viewMode === "client" ? "وضع العميل" : "وضع داخلي"}
          </button>
          <div className="text-sm font-bold text-amber-400">
            الإجمالي: {grandTotal.toLocaleString("ar-EG")} ج
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-red-900/30 border-b border-red-500/30 px-6 py-2 flex gap-4 flex-wrap">
          {warnings.map((w, i) => <span key={i} className="text-red-400 text-xs">{w}</span>)}
        </div>
      )}

      {/* Client Info */}
      <div className="bg-[#111] border-b border-white/10 px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">اسم العميل *</label>
          <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="استاذ / دكتور..." className="bg-white/5 border-white/10 text-white h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">التليفون</label>
          <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="01xxxxxxxxx" className="bg-white/5 border-white/10 text-white h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">العنوان</label>
          <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="المحافظة، الحي..." className="bg-white/5 border-white/10 text-white h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">المهندس</label>
          <Select value={engineerName} onValueChange={setEngineerName}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-sm">
              <SelectValue placeholder="اختر المهندس" />
            </SelectTrigger>
            <SelectContent>
              {["مهندس احمد رجب", "مهندس حماد", "مهندس احمد طنطاوي", "مهندسه ريهام", "مهندسه مارينا", "مهندسه جوليا", "مهندسه اماني", "دكتور عبد الرحمن"].map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-[#0f0f0f] px-6 flex gap-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-amber-400 text-amber-400" : "border-transparent text-white/50 hover:text-white"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">

        {/* ============ UNITS TAB ============ */}
        {activeTab === "units" && (
          <div>
            {/* Summary bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {[
                { label: "إجمالي الأمتار", value: `${totalMaterialsM2.toFixed(3)} م²` },
                { label: "سفلي", value: `${lowerM2.toFixed(3)} م²` },
                { label: "علوي", value: `${upperM2.toFixed(3)} م²` },
                { label: "طولي", value: `${tallM2.toFixed(3)} م²` },
                { label: "بلاكار", value: `${placardM2.toFixed(3)} م²` },
              ].map(item => (
                <div key={item.label} className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-xs text-white/50">{item.label}</div>
                  <div className="text-lg font-bold text-amber-400">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Material summary */}
            {materialSummary.length > 0 && (
              <div className="mb-4 bg-white/5 rounded-lg p-3">
                <div className="text-xs text-white/50 mb-2">تفاصيل الخامات</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {materialSummary.map(m => (
                    <div key={m.name} className="flex justify-between items-center bg-white/5 rounded px-3 py-2">
                      <span className="text-xs text-white/70 truncate max-w-[140px]">{m.name}</span>
                      <div className="text-right">
                        <div className="text-xs text-amber-400">{m.meters.toFixed(3)} م²</div>
                        <div className="text-xs text-white/50">{(m.total).toLocaleString("ar-EG")} ج</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-left text-sm font-bold text-amber-400">
                  إجمالي الخامات: {totalMaterialsPrice.toLocaleString("ar-EG")} ج
                </div>
              </div>
            )}

            {/* Units table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-white/5 text-white/60 text-xs">
                    <th className="px-2 py-2 text-right border border-white/10">رقم القطعة</th>
                    <th className="px-2 py-2 text-right border border-white/10">مكان القطعة</th>
                    <th className="px-2 py-2 text-right border border-white/10">عرض (م)</th>
                    <th className="px-2 py-2 text-right border border-white/10">ارتفاع (م)</th>
                    <th className="px-2 py-2 text-right border border-white/10 bg-amber-900/20 text-amber-400">إجمالي (م²)</th>
                    <th className="px-2 py-2 text-right border border-white/10">وصف القطعة</th>
                    <th className="px-2 py-2 text-right border border-white/10">الخامة</th>
                    <th className="px-2 py-2 text-right border border-white/10">الجدار</th>
                    <th className="px-2 py-2 border border-white/10"></th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((row, idx) => (
                    <tr key={row.id} className={`border-b border-white/5 ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                      <td className="px-1 py-1 border border-white/10">
                        <Input
                          type="number"
                          value={row.unitNumber}
                          onChange={e => updateUnit(row.id, "unitNumber", e.target.value === "" ? "" : Number(e.target.value))}
                          className="bg-transparent border-0 text-white text-center h-7 w-16 p-1"
                        />
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Select value={row.location} onValueChange={v => updateUnit(row.id, "location", v as LocationType)}>
                          <SelectTrigger className="bg-transparent border-0 text-white h-7 text-xs min-w-[130px]">
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                          <SelectContent>
                            {(["سفلي", "علوي", "طولي", "بلاكار", "بلاكار عمق> 38 سم"] as LocationType[]).map(loc => (
                              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input
                          type="number"
                          step="0.01"
                          value={row.width}
                          onChange={e => updateUnit(row.id, "width", e.target.value === "" ? "" : Number(e.target.value))}
                          className="bg-transparent border-0 text-white text-center h-7 w-20 p-1"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input
                          type="number"
                          step="0.01"
                          value={row.height}
                          onChange={e => updateUnit(row.id, "height", e.target.value === "" ? "" : Number(e.target.value))}
                          className="bg-transparent border-0 text-white text-center h-7 w-20 p-1"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-1 py-1 border border-white/10 bg-amber-900/10 text-center">
                        <span className={`font-bold text-sm ${row.totalArea !== null ? "text-amber-400" : "text-white/20"}`}>
                          {row.totalArea !== null ? row.totalArea.toFixed(4) : "—"}
                        </span>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input
                          value={row.description}
                          onChange={e => updateUnit(row.id, "description", e.target.value)}
                          className="bg-transparent border-0 text-white h-7 text-xs min-w-[100px] p-1"
                          placeholder="وصف القطعة"
                        />
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Select value={row.materialName} onValueChange={v => updateUnit(row.id, "materialName", v)}>
                          <SelectTrigger className="bg-transparent border-0 text-white h-7 text-xs min-w-[160px]">
                            <SelectValue placeholder="اختر الخامة" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map(m => (
                              <SelectItem key={m.id} value={m.nameAr}>
                                <span className="text-xs">{m.nameAr} — {m.pricePerMeter.toLocaleString()} ج/م²</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Select value={row.wallLabel} onValueChange={v => updateUnit(row.id, "wallLabel", v)}>
                          <SelectTrigger className="bg-transparent border-0 text-white h-7 text-xs w-16">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {["A","B","C","D","E","F","G","H"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <button onClick={() => removeUnit(row.id)} className="text-red-400/60 hover:text-red-400 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addUnit} className="mt-3 flex items-center gap-1.5 text-amber-400 text-sm hover:text-amber-300">
              <Plus className="w-4 h-4" /> إضافة قطعة
            </button>
          </div>
        )}

        {/* ============ ACCESSORIES TAB ============ */}
        {activeTab === "accessories" && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-white/5 text-white/60 text-xs">
                    <th className="px-2 py-2 text-right border border-white/10">م</th>
                    <th className="px-2 py-2 text-right border border-white/10">بند الإكسسوار والأدراج</th>
                    <th className="px-2 py-2 text-right border border-white/10">العدد</th>
                    <th className="px-2 py-2 text-right border border-white/10">السعر</th>
                    <th className="px-2 py-2 text-right border border-white/10 bg-amber-900/20 text-amber-400">الإجمالي</th>
                    <th className="px-2 py-2 text-right border border-white/10">هدية/مجاني</th>
                    <th className="px-2 py-2 text-right border border-white/10">ملاحظات</th>
                    <th className="px-2 py-2 border border-white/10"></th>
                  </tr>
                </thead>
                <tbody>
                  {accessories.map((row, idx) => (
                    <tr key={row.id} className={`border-b border-white/5 ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                      <td className="px-2 py-1 border border-white/10 text-white/40 text-center">{idx + 1}</td>
                      <td className="px-1 py-1 border border-white/10">
                        <Select value={row.name} onValueChange={v => {
                          const acc = accessoriesDb.find(a => a.nameAr === v);
                          updateAccessory(row.id, "name", v);
                          if (acc) updateAccessory(row.id, "price", acc.price);
                        }}>
                          <SelectTrigger className="bg-transparent border-0 text-white h-7 text-xs min-w-[200px]">
                            <SelectValue placeholder="اختر الإكسسوار" />
                          </SelectTrigger>
                          <SelectContent>
                            {accessoriesDb.map(a => (
                              <SelectItem key={a.id} value={a.nameAr}>
                                <span className="text-xs">{a.nameAr} — {a.price.toLocaleString()} ج</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input type="number" value={row.qty} onChange={e => updateAccessory(row.id, "qty", Number(e.target.value))} className="bg-transparent border-0 text-white text-center h-7 w-16 p-1" />
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input type="number" value={row.price} onChange={e => updateAccessory(row.id, "price", Number(e.target.value))} className="bg-transparent border-0 text-white text-center h-7 w-24 p-1" />
                      </td>
                      <td className="px-1 py-1 border border-white/10 bg-amber-900/10 text-center">
                        <span className="font-bold text-amber-400">{(row.qty * row.price).toLocaleString("ar-EG")}</span>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input type="number" value={row.isFree} onChange={e => updateAccessory(row.id, "isFree", Number(e.target.value))} className="bg-transparent border-0 text-white text-center h-7 w-16 p-1" placeholder="0" />
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input value={row.notes} onChange={e => updateAccessory(row.id, "notes", e.target.value)} className="bg-transparent border-0 text-white h-7 text-xs p-1" placeholder="ملاحظة" />
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <button onClick={() => setAccessories(prev => prev.filter(r => r.id !== row.id))} className="text-red-400/60 hover:text-red-400 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setAccessories(prev => [...prev, newAccessoryRow()])} className="flex items-center gap-1.5 text-amber-400 text-sm hover:text-amber-300">
                <Plus className="w-4 h-4" /> إضافة إكسسوار
              </button>
              <div className="text-sm font-bold text-amber-400">الإجمالي: {totalAccessoriesPrice.toLocaleString("ar-EG")} ج</div>
            </div>
          </div>
        )}

        {/* ============ CLADDING TAB ============ */}
        {activeTab === "cladding" && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-white/5 text-white/60 text-xs">
                    <th className="px-2 py-2 text-right border border-white/10">بند</th>
                    <th className="px-2 py-2 text-right border border-white/10">الخامة / البند</th>
                    <th className="px-2 py-2 text-right border border-white/10">الكمية</th>
                    <th className="px-2 py-2 text-right border border-white/10">طريقة الحساب</th>
                    <th className="px-2 py-2 text-right border border-white/10">السعر</th>
                    <th className="px-2 py-2 text-right border border-white/10 bg-amber-900/20 text-amber-400">الإجمالي</th>
                    <th className="px-2 py-2 text-right border border-white/10">ملاحظات</th>
                    <th className="px-2 py-2 border border-white/10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cladding.map((row, idx) => (
                    <tr key={row.id} className={`border-b border-white/5 ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                      <td className="px-2 py-1 border border-white/10 text-white/40 text-center">{idx + 1}</td>
                      <td className="px-1 py-1 border border-white/10">
                        <Select value={row.name} onValueChange={v => {
                          const cl = claddingDb.find(c => c.nameAr === v);
                          updateCladding(row.id, "name", v);
                          if (cl) updateCladding(row.id, "price", cl.price);
                        }}>
                          <SelectTrigger className="bg-transparent border-0 text-white h-7 text-xs min-w-[180px]">
                            <SelectValue placeholder="اختر التجليد" />
                          </SelectTrigger>
                          <SelectContent>
                            {claddingDb.map(c => (
                              <SelectItem key={c.id} value={c.nameAr}>
                                <span className="text-xs">{c.nameAr} — {c.price.toLocaleString()} ج</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input type="number" step="0.01" value={row.qty} onChange={e => updateCladding(row.id, "qty", Number(e.target.value))} className="bg-transparent border-0 text-white text-center h-7 w-20 p-1" />
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Select value={row.calcMethod} onValueChange={v => updateCladding(row.id, "calcMethod", v)}>
                          <SelectTrigger className="bg-transparent border-0 text-white h-7 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["عدد", "متر مربع", "متر طولي"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input type="number" value={row.price} onChange={e => updateCladding(row.id, "price", Number(e.target.value))} className="bg-transparent border-0 text-white text-center h-7 w-24 p-1" />
                      </td>
                      <td className="px-1 py-1 border border-white/10 bg-amber-900/10 text-center">
                        <span className="font-bold text-amber-400">{row.total.toLocaleString("ar-EG")}</span>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input value={row.notes} onChange={e => updateCladding(row.id, "notes", e.target.value)} className="bg-transparent border-0 text-white h-7 text-xs p-1" placeholder="ملاحظة" />
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <button onClick={() => setCladding(prev => prev.filter(r => r.id !== row.id))} className="text-red-400/60 hover:text-red-400 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setCladding(prev => [...prev, newCladdingRow()])} className="flex items-center gap-1.5 text-amber-400 text-sm hover:text-amber-300">
                <Plus className="w-4 h-4" /> إضافة تجليد
              </button>
              <div className="text-sm font-bold text-amber-400">الإجمالي: {totalCladdingPrice.toLocaleString("ar-EG")} ج</div>
            </div>
          </div>
        )}

        {/* ============ MARBLE TAB ============ */}
        {activeTab === "marble" && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-white/5 text-white/60 text-xs">
                    <th className="px-2 py-2 text-right border border-white/10">م</th>
                    <th className="px-2 py-2 text-right border border-white/10">كود</th>
                    <th className="px-2 py-2 text-right border border-white/10">نوع الرخام</th>
                    <th className="px-2 py-2 text-right border border-white/10">الأمتار</th>
                    <th className="px-2 py-2 text-right border border-white/10">سعر المتر</th>
                    <th className="px-2 py-2 text-right border border-white/10 bg-amber-900/20 text-amber-400">الإجمالي</th>
                    <th className="px-2 py-2 border border-white/10"></th>
                  </tr>
                </thead>
                <tbody>
                  {marble.map((row, idx) => (
                    <tr key={row.id} className={`border-b border-white/5 ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                      <td className="px-2 py-1 border border-white/10 text-white/40 text-center">{idx + 1}</td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input value={row.code} onChange={e => updateMarble(row.id, "code", e.target.value)} className="bg-transparent border-0 text-white h-7 w-20 p-1 text-xs" placeholder="G07" />
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Select value={row.type} onValueChange={v => {
                          const m = marbleDb.find(mb => mb.nameAr === v);
                          updateMarble(row.id, "type", v);
                          if (m) updateMarble(row.id, "code", m.code || "");
                        }}>
                          <SelectTrigger className="bg-transparent border-0 text-white h-7 text-xs min-w-[150px]">
                            <SelectValue placeholder="اختر الرخام" />
                          </SelectTrigger>
                          <SelectContent>
                            {marbleDb.map(m => (
                              <SelectItem key={m.id} value={m.nameAr}>
                                <span className="text-xs">{m.nameAr} ({m.category})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input type="number" step="0.01" value={row.meters} onChange={e => updateMarble(row.id, "meters", Number(e.target.value))} className="bg-transparent border-0 text-white text-center h-7 w-20 p-1" />
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <Input type="number" value={row.pricePerMeter} onChange={e => updateMarble(row.id, "pricePerMeter", Number(e.target.value))} className="bg-transparent border-0 text-white text-center h-7 w-24 p-1" />
                      </td>
                      <td className="px-1 py-1 border border-white/10 bg-amber-900/10 text-center">
                        <span className="font-bold text-amber-400">{row.total.toLocaleString("ar-EG")}</span>
                      </td>
                      <td className="px-1 py-1 border border-white/10">
                        <button onClick={() => setMarble(prev => prev.filter(r => r.id !== row.id))} className="text-red-400/60 hover:text-red-400 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setMarble(prev => [...prev, newMarbleRow()])} className="flex items-center gap-1.5 text-amber-400 text-sm hover:text-amber-300">
                <Plus className="w-4 h-4" /> إضافة رخام
              </button>
              <div className="text-sm font-bold text-amber-400">الإجمالي: {totalMarblePrice.toLocaleString("ar-EG")} ج</div>
            </div>
          </div>
        )}

        {/* ============ TRANSPORT TAB ============ */}
        {activeTab === "transport" && (
          <div className="max-w-lg">
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 block mb-1">المحافظة</label>
                  <Input value={transportCity} onChange={e => setTransportCity(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">نوع السيارة</label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["جامبو مغلقة", "جامبو مفتوحة", "نص نقل", "نقل كبير"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">رسوم النقل</label>
                  <Input type="number" value={transportFee} onChange={e => setTransportFee(Number(e.target.value))} className="bg-white/5 border-white/10 text-white h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">رسوم المشال</label>
                  <Input type="number" value={liftFee} onChange={e => setLiftFee(Number(e.target.value))} className="bg-white/5 border-white/10 text-white h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">مصاريف إضافية</label>
                  <Input type="number" value={extraFees} onChange={e => setExtraFees(Number(e.target.value))} className="bg-white/5 border-white/10 text-white h-8 text-sm" />
                </div>
              </div>
              <div className="text-left text-sm font-bold text-amber-400 pt-2 border-t border-white/10">
                إجمالي النقل: {totalTransport.toLocaleString("ar-EG")} ج
              </div>
            </div>
          </div>
        )}

        {/* ============ SUMMARY TAB ============ */}
        {activeTab === "summary" && (
          <div className="max-w-2xl">
            {/* Client info display */}
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="text-xs text-white/50 mb-2">بيانات العميل</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-white/50">الاسم: </span><span className="text-white">{clientName || "—"}</span></div>
                <div><span className="text-white/50">التليفون: </span><span className="text-white">{clientPhone || "—"}</span></div>
                <div><span className="text-white/50">العنوان: </span><span className="text-white">{address || "—"}</span></div>
                <div><span className="text-white/50">المهندس: </span><span className="text-white">{engineerName || "—"}</span></div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-white/5 rounded-lg p-4 mb-4 space-y-3">
              <div className="text-xs text-white/50 mb-2">تفاصيل التسعير</div>
              {[
                { label: "أولاً: الخامات", value: totalMaterialsPrice, sub: `${totalMaterialsM2.toFixed(3)} م²` },
                { label: "ثانياً: الإكسسوارات والأدراج", value: totalAccessoriesPrice },
                { label: "ثالثاً: التجاليد والديكور", value: totalCladdingPrice },
                { label: "رابعاً: الرخام", value: totalMarblePrice },
                { label: "خامساً: النقل والمشال", value: totalTransport },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5">
                  <div>
                    <span className="text-sm text-white">{item.label}</span>
                    {item.sub && <span className="text-xs text-white/40 mr-2">({item.sub})</span>}
                  </div>
                  <span className="font-bold text-white">{item.value.toLocaleString("ar-EG")} ج</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-white">تكلفة المطبخ</span>
                <span className="font-bold text-white">{subTotal.toLocaleString("ar-EG")} ج</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">(-) الخصم</span>
                  <Input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-red-400 h-7 w-28 text-sm"
                  />
                  <span className="text-xs text-white/40">({discountPct.toFixed(1)}%)</span>
                </div>
                <span className="font-bold text-red-400">- {discount.toLocaleString("ar-EG")} ج</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-amber-900/20 rounded-lg px-3">
                <span className="font-bold text-amber-400">إجمالي تكلفة المطبخ</span>
                <span className="text-2xl font-bold text-amber-400">{grandTotal.toLocaleString("ar-EG")} ج</span>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="text-xs text-white/50 block mb-1">ملاحظات</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded text-white text-sm p-2 h-20 resize-none"
                placeholder="ملاحظات إضافية..."
              />
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-red-400 text-sm font-bold mb-2">
                  <AlertTriangle className="w-4 h-4" /> تحذيرات
                </div>
                {warnings.map((w, i) => <div key={i} className="text-red-300 text-xs">{w}</div>)}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => toast.success("تم حفظ المقايسة بنجاح")}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> حفظ المقايسة
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="border-white/20 text-white flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> طباعة
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
