import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ───────────────────────────────────────────────────────────────────
type UnitLocation = "upper" | "lower" | "tall" | "placard" | "placard_deep";
interface KitchenUnit {
  id: string;
  unitNumber: number;
  location: UnitLocation;
  width: number;
  height: number;
  totalArea: number;
  description: string;
  wallLabel: string;
}
interface SelectedAccessory {
  id: number;
  nameAr: string;
  price: number;
  qty: number;
}
interface SelectedCladding {
  id: number;
  nameAr: string;
  price: number;
  qty: number;
}

const LOCATION_LABELS: Record<UnitLocation, string> = {
  upper: "علوي",
  lower: "سفلي",
  tall: "طولي",
  placard: "بلاكار",
  placard_deep: "بلاكار عميق",
};

const HINGE_OPTIONS = ["بلوم", "JT", "كلارو", "بدون"];
const DRAWER_OPTIONS = ["بلوم تاندم بوكس", "JT سوفت كلوز", "كلارو", "بدون"];
const HANDLE_OPTIONS = ["مقابض بلت ان", "مقابض ظاهرة", "تاتش", "وزر مضيء", "بدون"];
const CHASSIS_OPTIONS = ["كرونوسبان MDF", "بوبلار", "MDF عادي"];
const COLOR_OPTIONS_PLINTH = ["أبيض", "رمادي", "أسود", "بيج", "خشبي"];
const COLOR_OPTIONS_LIGHTING = ["أبيض دافئ", "أبيض بارد", "RGB", "بدون"];
const COLOR_OPTIONS_GLASS = ["شفاف", "مصنفر", "أخضر مضيء", "بدون"];
const COLOR_OPTIONS_INNER = ["أبيض", "رمادي فاتح", "بيج", "خشبي داكن"];
const COLOR_OPTIONS_HANDLE = ["ستانلس", "أسود مات", "ذهبي", "فضي", "بدون"];
const COLOR_OPTIONS_GLASS_FRAME = ["ألومنيوم فضي", "ألومنيوم أسود", "ألومنيوم ذهبي", "بدون"];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function KitchenPricing() {
  const [step, setStep] = useState<"info" | "materials" | "units" | "accessories" | "cladding" | "summary">("info");

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [engineerName, setEngineerName] = useState("");
  const [notes, setNotes] = useState("");

  // Materials
  const [material1Id, setMaterial1Id] = useState<number | null>(null);
  const [material1Meters, setMaterial1Meters] = useState("");
  const [material2Id, setMaterial2Id] = useState<number | null>(null);
  const [material2Meters, setMaterial2Meters] = useState("");
  const [material3Id, setMaterial3Id] = useState<number | null>(null);
  const [material3Meters, setMaterial3Meters] = useState("");

  // Colors & Options
  const [hingeType, setHingeType] = useState("");
  const [drawerSlideType, setDrawerSlideType] = useState("");
  const [handleTypeLower, setHandleTypeLower] = useState("");
  const [handleTypeUpper, setHandleTypeUpper] = useState("");
  const [chassisType, setChassisType] = useState("");
  const [plinthColor, setPlinthColor] = useState("");
  const [lightingColor, setLightingColor] = useState("");
  const [glassColor, setGlassColor] = useState("");
  const [innerBoxColor, setInnerBoxColor] = useState("");
  const [handleColor, setHandleColor] = useState("");
  const [glassFrameColor, setGlassFrameColor] = useState("");

  // Marble
  const [marbleId, setMarbleId] = useState<number | null>(null);
  const [marblePricePerMeter, setMarblePricePerMeter] = useState("");
  const [marbleMeters, setMarbleMeters] = useState("");

  // Units
  const [units, setUnits] = useState<KitchenUnit[]>([]);
  const [newUnit, setNewUnit] = useState<Partial<KitchenUnit>>({ location: "lower", width: 60, height: 85, wallLabel: "A" });

  // Accessories
  const [selectedAccessories, setSelectedAccessories] = useState<SelectedAccessory[]>([]);
  const [selectedCladding, setSelectedCladding] = useState<SelectedCladding[]>([]);

  // Data queries
  const { data: materials = [] } = trpc.kitchen.getMaterials.useQuery();
  const { data: accessories = [] } = trpc.kitchen.getAccessories.useQuery();
  const { data: marbles = [] } = trpc.kitchen.getMarble.useQuery();
  const { data: claddingItems = [] } = trpc.kitchen.getCladding.useQuery();

  const createQuotation = trpc.kitchen.createQuotation.useMutation();

  // ─── Calculations ───────────────────────────────────────────────────────────
  const materialsTotalPrice = useMemo(() => {
    let total = 0;
    if (material1Id && material1Meters) {
      const mat = materials.find(m => m.id === material1Id);
      if (mat) total += mat.pricePerMeter * parseFloat(material1Meters || "0");
    }
    if (material2Id && material2Meters) {
      const mat = materials.find(m => m.id === material2Id);
      if (mat) total += mat.pricePerMeter * parseFloat(material2Meters || "0");
    }
    if (material3Id && material3Meters) {
      const mat = materials.find(m => m.id === material3Id);
      if (mat) total += mat.pricePerMeter * parseFloat(material3Meters || "0");
    }
    return Math.round(total);
  }, [material1Id, material1Meters, material2Id, material2Meters, material3Id, material3Meters, materials]);

  const accessoriesTotalPrice = useMemo(() => {
    return selectedAccessories.reduce((sum, a) => sum + a.price * a.qty, 0);
  }, [selectedAccessories]);

  const marbleTotalPrice = useMemo(() => {
    const price = parseFloat(marblePricePerMeter || "0");
    const meters = parseFloat(marbleMeters || "0");
    return Math.round(price * meters);
  }, [marblePricePerMeter, marbleMeters]);

  const claddingTotalPrice = useMemo(() => {
    return selectedCladding.reduce((sum, c) => sum + c.price * c.qty, 0);
  }, [selectedCladding]);

  const grandTotal = materialsTotalPrice + accessoriesTotalPrice + marbleTotalPrice + claddingTotalPrice;

  // ─── Unit helpers ───────────────────────────────────────────────────────────
  const addUnit = () => {
    if (!newUnit.location || !newUnit.width || !newUnit.height) return;
    const area = ((newUnit.width! / 100) * (newUnit.height! / 100));
    const unit: KitchenUnit = {
      id: Date.now().toString(),
      unitNumber: units.length + 1,
      location: newUnit.location as UnitLocation,
      width: newUnit.width!,
      height: newUnit.height!,
      totalArea: Math.round(area * 100) / 100,
      description: newUnit.description || "",
      wallLabel: newUnit.wallLabel || "A",
    };
    setUnits(prev => [...prev, unit]);
    setNewUnit({ location: "lower", width: 60, height: 85, wallLabel: "A" });
  };

  const removeUnit = (id: string) => setUnits(prev => prev.filter(u => u.id !== id));

  // Accessory helpers
  const toggleAccessory = (acc: { id: number; nameAr: string; price: number }) => {
    setSelectedAccessories(prev => {
      const exists = prev.find(a => a.id === acc.id);
      if (exists) return prev.filter(a => a.id !== acc.id);
      return [...prev, { ...acc, qty: 1 }];
    });
  };

  const updateAccessoryQty = (id: number, qty: number) => {
    setSelectedAccessories(prev => prev.map(a => a.id === id ? { ...a, qty: Math.max(1, qty) } : a));
  };

  // Cladding helpers
  const toggleCladding = (cl: { id: number; nameAr: string; price: number }) => {
    setSelectedCladding(prev => {
      const exists = prev.find(c => c.id === cl.id);
      if (exists) return prev.filter(c => c.id !== cl.id);
      return [...prev, { ...cl, qty: 1 }];
    });
  };

  const updateCladdingQty = (id: number, qty: number) => {
    setSelectedCladding(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, qty) } : c));
  };

  // ─── Save & Print ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    const code = `KIT-${Date.now().toString().slice(-6)}`;
    await createQuotation.mutateAsync({
      quotationCode: code,
      clientName, clientPhone, address, engineerName, notes,
      material1Id: material1Id ?? undefined,
      material1Meters,
      material2Id: material2Id ?? undefined,
      material2Meters,
      material3Id: material3Id ?? undefined,
      material3Meters,
      hingeType, drawerSlideType, handleTypeLower, handleTypeUpper,
      chassisType, plinthColor, lightingColor, glassColor, innerBoxColor,
      handleColor, glassFrameColor,
      marbleId: marbleId ?? undefined,
      marblePricePerMeter: marblePricePerMeter ? parseInt(marblePricePerMeter) : undefined,
      marbleMeters,
      accessoriesJson: JSON.stringify(selectedAccessories),
      claddingJson: JSON.stringify(selectedCladding),
      materialsTotalPrice,
      accessoriesTotalPrice,
      marbleTotalPrice,
      claddingTotalPrice,
      grandTotal,
    });
    window.print();
  };

  // ─── Step indicator ─────────────────────────────────────────────────────────
  const steps = [
    { key: "info", label: "بيانات العميل" },
    { key: "materials", label: "الخامات والألوان" },
    { key: "units", label: "الوحدات" },
    { key: "accessories", label: "الاكسسوارات" },
    { key: "cladding", label: "التجاليد" },
    { key: "summary", label: "الملخص" },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === step);

  // ─── Grouped data ───────────────────────────────────────────────────────────
  const materialsByBrand = useMemo(() => {
    const groups: Record<string, typeof materials> = {};
    for (const m of materials) {
      if (!groups[m.brand]) groups[m.brand] = [];
      groups[m.brand].push(m);
    }
    return groups;
  }, [materials]);

  const accessoriesByBrand = useMemo(() => {
    const groups: Record<string, typeof accessories> = {};
    for (const a of accessories) {
      if (!groups[a.brand]) groups[a.brand] = [];
      groups[a.brand].push(a);
    }
    return groups;
  }, [accessories]);

  const marbleByCategory = useMemo(() => {
    const groups: Record<string, typeof marbles> = {};
    for (const m of marbles) {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    }
    return groups;
  }, [marbles]);

  const categoryLabels: Record<string, string> = {
    granite: "جرانيت",
    porcelain: "بورسيلين",
    quartz: "كوارتز",
    other: "أخرى",
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 print:bg-white" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/professor_logo.png" alt="Professor" className="h-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-gray-800">نظام تسعير المطابخ</h1>
              <p className="text-xs text-gray-500">Professor Kitchens</p>
            </div>
          </div>
          <Link href="/pricing">
            <Button variant="outline" size="sm">← نظام التسعير</Button>
          </Link>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex gap-1 overflow-x-auto">
            {steps.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setStep(s.key as typeof step)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  s.key === step
                    ? "bg-amber-500 text-white"
                    : i < currentStepIndex
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {i + 1}. {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── STEP 1: Client Info ── */}
        {step === "info" && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
              بيانات العميل والمشروع
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم العميل</Label>
                <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="أدخل اسم العميل" className="mt-1" />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="01xxxxxxxxx" className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label>العنوان</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="عنوان الوحدة" className="mt-1" />
              </div>
              <div>
                <Label>المهندس المسؤول</Label>
                <Select value={engineerName} onValueChange={setEngineerName}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر المهندس" />
                  </SelectTrigger>
                  <SelectContent>
                    {["مهندس احمد رجب", "مهندس حماد", "مهندس احمد طنطاوي", "مهندسه ريهام", "مهندسه مارينا", "مهندسه جوليا", "مهندسه اماني", "دكتور عبد الرحمن"].map(eng => (
                      <SelectItem key={eng} value={eng}>{eng}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>ملاحظات</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي ملاحظات إضافية..." className="mt-1" rows={3} />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep("materials")} className="bg-amber-500 hover:bg-amber-600 text-white px-8">
                التالي: الخامات والألوان ←
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Materials & Colors ── */}
        {step === "materials" && (
          <div className="space-y-6">
            {/* Materials */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
                اختيار الخامات
              </h2>
              <p className="text-sm text-gray-500 mb-4">يمكن اختيار حتى 3 خامات مختلفة (مثلاً: علوي + سفلي + جزيرة)</p>

              {[
                { id: material1Id, setId: setMaterial1Id, meters: material1Meters, setMeters: setMaterial1Meters, label: "الخامة الأولى" },
                { id: material2Id, setId: setMaterial2Id, meters: material2Meters, setMeters: setMaterial2Meters, label: "الخامة الثانية (اختياري)" },
                { id: material3Id, setId: setMaterial3Id, meters: material3Meters, setMeters: setMaterial3Meters, label: "الخامة الثالثة (اختياري)" },
              ].map((mat, idx) => (
                <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <Label className="font-semibold text-gray-700">{mat.label}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    <div className="md:col-span-2">
                      <Select value={mat.id?.toString() || ""} onValueChange={v => mat.setId(v ? parseInt(v) : null)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الخامة..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(materialsByBrand).map(([brand, mats]) => (
                            <div key={brand}>
                              <div className="px-2 py-1 text-xs font-bold text-amber-600 bg-amber-50">{brand}</div>
                              {mats.map(m => (
                                <SelectItem key={m.id} value={m.id.toString()}>
                                  {m.nameAr} — {m.pricePerMeter.toLocaleString()} ج/م²
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={mat.meters}
                        onChange={e => mat.setMeters(e.target.value)}
                        placeholder="عدد الأمتار"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                  {mat.id && mat.meters && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      الإجمالي: {(materials.find(m => m.id === mat.id)?.pricePerMeter || 0) * parseFloat(mat.meters || "0")} جنيه
                    </p>
                  )}
                </div>
              ))}

              <div className="bg-amber-50 rounded-lg p-3 text-left">
                <span className="text-sm font-bold text-amber-700">إجمالي الخامات: {materialsTotalPrice.toLocaleString()} جنيه</span>
              </div>
            </div>

            {/* Colors & Options */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">الألوان والخيارات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "نوع المفصلة", value: hingeType, setValue: setHingeType, options: HINGE_OPTIONS },
                  { label: "نوع مجري الدرج", value: drawerSlideType, setValue: setDrawerSlideType, options: DRAWER_OPTIONS },
                  { label: "مقبض الوحدات السفلية", value: handleTypeLower, setValue: setHandleTypeLower, options: HANDLE_OPTIONS },
                  { label: "مقبض الوحدات العلوية", value: handleTypeUpper, setValue: setHandleTypeUpper, options: HANDLE_OPTIONS },
                  { label: "نوع الهيكل (الشاسيه)", value: chassisType, setValue: setChassisType, options: CHASSIS_OPTIONS },
                  { label: "لون الكنتور (القاعدة)", value: plinthColor, setValue: setPlinthColor, options: COLOR_OPTIONS_PLINTH },
                  { label: "لون الإضاءة", value: lightingColor, setValue: setLightingColor, options: COLOR_OPTIONS_LIGHTING },
                  { label: "لون الزجاج", value: glassColor, setValue: setGlassColor, options: COLOR_OPTIONS_GLASS },
                  { label: "لون الصندوق الداخلي", value: innerBoxColor, setValue: setInnerBoxColor, options: COLOR_OPTIONS_INNER },
                  { label: "لون المقابض", value: handleColor, setValue: setHandleColor, options: COLOR_OPTIONS_HANDLE },
                  { label: "لون قطاعات الزجاج", value: glassFrameColor, setValue: setGlassFrameColor, options: COLOR_OPTIONS_GLASS_FRAME },
                ].map(opt => (
                  <div key={opt.label}>
                    <Label className="text-sm">{opt.label}</Label>
                    <Select value={opt.value} onValueChange={opt.setValue}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر..." />
                      </SelectTrigger>
                      <SelectContent>
                        {opt.options.map(o => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Marble */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">الرخام / الكونتر توب</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>نوع الرخام</Label>
                  <Select value={marbleId?.toString() || ""} onValueChange={v => setMarbleId(v ? parseInt(v) : null)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر نوع الرخام..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(marbleByCategory).map(([cat, items]) => (
                        <div key={cat}>
                          <div className="px-2 py-1 text-xs font-bold text-blue-600 bg-blue-50">{categoryLabels[cat] || cat}</div>
                          {items.map(m => (
                            <SelectItem key={m.id} value={m.id.toString()}>
                              [{m.code}] {m.nameAr}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>سعر المتر (جنيه)</Label>
                  <Input type="number" value={marblePricePerMeter} onChange={e => setMarblePricePerMeter(e.target.value)} placeholder="سعر/م²" className="mt-1" />
                </div>
                <div>
                  <Label>عدد الأمتار</Label>
                  <Input type="number" value={marbleMeters} onChange={e => setMarbleMeters(e.target.value)} placeholder="م²" className="mt-1" />
                </div>
              </div>
              {marbleTotalPrice > 0 && (
                <p className="text-sm text-green-600 mt-2 font-medium">إجمالي الرخام: {marbleTotalPrice.toLocaleString()} جنيه</p>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("info")}>← السابق</Button>
              <Button onClick={() => setStep("units")} className="bg-amber-500 hover:bg-amber-600 text-white px-8">
                التالي: الوحدات ←
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Units ── */}
        {step === "units" && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
              جدول الوحدات
            </h2>

            {/* Add unit form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-5">
              <h3 className="font-semibold text-gray-700 mb-3">إضافة وحدة جديدة</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div>
                  <Label className="text-xs">الجدار</Label>
                  <Input value={newUnit.wallLabel || ""} onChange={e => setNewUnit(p => ({ ...p, wallLabel: e.target.value }))} placeholder="A" className="mt-1" maxLength={2} />
                </div>
                <div>
                  <Label className="text-xs">المكان</Label>
                  <Select value={newUnit.location || "lower"} onValueChange={v => setNewUnit(p => ({ ...p, location: v as UnitLocation }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOCATION_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">العرض (سم)</Label>
                  <Input type="number" value={newUnit.width || ""} onChange={e => setNewUnit(p => ({ ...p, width: parseInt(e.target.value) }))} placeholder="60" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">الارتفاع (سم)</Label>
                  <Input type="number" value={newUnit.height || ""} onChange={e => setNewUnit(p => ({ ...p, height: parseInt(e.target.value) }))} placeholder="85" className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">الوصف</Label>
                  <Input value={newUnit.description || ""} onChange={e => setNewUnit(p => ({ ...p, description: e.target.value }))} placeholder="مثال: درج + باب" className="mt-1" />
                </div>
              </div>
              <Button onClick={addUnit} className="mt-3 bg-green-600 hover:bg-green-700 text-white">+ إضافة وحدة</Button>
            </div>

            {/* Units table */}
            {units.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="p-2 text-center border">#</th>
                      <th className="p-2 text-center border">الجدار</th>
                      <th className="p-2 text-center border">المكان</th>
                      <th className="p-2 text-center border">العرض</th>
                      <th className="p-2 text-center border">الارتفاع</th>
                      <th className="p-2 text-center border">المساحة م²</th>
                      <th className="p-2 text-center border">الوصف</th>
                      <th className="p-2 text-center border print:hidden">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u, i) => (
                      <tr key={u.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="p-2 text-center border">{u.unitNumber}</td>
                        <td className="p-2 text-center border font-bold">{u.wallLabel}</td>
                        <td className="p-2 text-center border">{LOCATION_LABELS[u.location]}</td>
                        <td className="p-2 text-center border">{u.width}</td>
                        <td className="p-2 text-center border">{u.height}</td>
                        <td className="p-2 text-center border font-medium text-blue-600">{u.totalArea}</td>
                        <td className="p-2 border">{u.description}</td>
                        <td className="p-2 text-center border print:hidden">
                          <button onClick={() => removeUnit(u.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-bold">
                      <td colSpan={5} className="p-2 text-left border">الإجمالي</td>
                      <td className="p-2 text-center border text-amber-700">
                        {units.reduce((s, u) => s + u.totalArea, 0).toFixed(2)} م²
                      </td>
                      <td colSpan={2} className="border"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">لم يتم إضافة وحدات بعد</div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep("materials")}>← السابق</Button>
              <Button onClick={() => setStep("accessories")} className="bg-amber-500 hover:bg-amber-600 text-white px-8">
                التالي: الاكسسوارات ←
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Accessories ── */}
        {step === "accessories" && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
              الاكسسوارات
            </h2>
            <p className="text-sm text-gray-500 mb-4">اضغط على الاكسسوار لإضافته، ثم حدد الكمية</p>

            {Object.entries(accessoriesByBrand).map(([brand, accs]) => (
              <div key={brand} className="mb-6">
                <h3 className="font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg mb-3">{brand}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {accs.map(acc => {
                    const selected = selectedAccessories.find(a => a.id === acc.id);
                    return (
                      <div
                        key={acc.id}
                        onClick={() => toggleAccessory(acc)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                          selected ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-200"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{acc.nameAr}</p>
                          <p className="text-xs text-gray-500">{acc.price.toLocaleString()} جنيه</p>
                        </div>
                        {selected && (
                          <div className="flex items-center gap-2 mr-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => updateAccessoryQty(acc.id, selected.qty - 1)} className="w-6 h-6 bg-gray-200 rounded text-sm font-bold">-</button>
                            <span className="text-sm font-bold w-6 text-center">{selected.qty}</span>
                            <button onClick={() => updateAccessoryQty(acc.id, selected.qty + 1)} className="w-6 h-6 bg-amber-500 text-white rounded text-sm font-bold">+</button>
                          </div>
                        )}
                        {selected && <Badge className="mr-2 bg-amber-500 text-white text-xs">{(acc.price * selected.qty).toLocaleString()}</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="bg-amber-50 rounded-lg p-3 text-left sticky bottom-4">
              <span className="text-sm font-bold text-amber-700">
                إجمالي الاكسسوارات: {accessoriesTotalPrice.toLocaleString()} جنيه
                {selectedAccessories.length > 0 && ` (${selectedAccessories.length} قطعة)`}
              </span>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep("units")}>← السابق</Button>
              <Button onClick={() => setStep("cladding")} className="bg-amber-500 hover:bg-amber-600 text-white px-8">
                التالي: التجاليد ←
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Cladding ── */}
        {step === "cladding" && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">5</span>
              التجاليد والديكورات
            </h2>
            <p className="text-sm text-gray-500 mb-4">اضغط على التجليد لإضافته، ثم حدد الكمية</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {claddingItems.map(cl => {
                const selected = selectedCladding.find(c => c.id === cl.id);
                return (
                  <div
                    key={cl.id}
                    onClick={() => toggleCladding(cl)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selected ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{cl.nameAr}</p>
                      <p className="text-xs text-gray-500">{cl.price.toLocaleString()} جنيه</p>
                    </div>
                    {selected && (
                      <div className="flex items-center gap-2 mr-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => updateCladdingQty(cl.id, selected.qty - 1)} className="w-6 h-6 bg-gray-200 rounded text-sm font-bold">-</button>
                        <span className="text-sm font-bold w-6 text-center">{selected.qty}</span>
                        <button onClick={() => updateCladdingQty(cl.id, selected.qty + 1)} className="w-6 h-6 bg-blue-500 text-white rounded text-sm font-bold">+</button>
                      </div>
                    )}
                    {selected && <Badge className="mr-2 bg-blue-500 text-white text-xs">{(cl.price * selected.qty).toLocaleString()}</Badge>}
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 rounded-lg p-3 text-left mt-4 sticky bottom-4">
              <span className="text-sm font-bold text-blue-700">
                إجمالي التجاليد: {claddingTotalPrice.toLocaleString()} جنيه
                {selectedCladding.length > 0 && ` (${selectedCladding.length} بند)`}
              </span>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep("accessories")}>← السابق</Button>
              <Button onClick={() => setStep("summary")} className="bg-amber-500 hover:bg-amber-600 text-white px-8">
                التالي: الملخص ←
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Summary ── */}
        {step === "summary" && (
          <div className="space-y-5">
            {/* Print header */}
            <div className="hidden print:flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold">عرض سعر مطبخ</h1>
                <p className="text-gray-500">Professor Kitchens</p>
              </div>
              <div className="text-left text-sm text-gray-600">
                <p>التاريخ: {new Date().toLocaleDateString("ar-EG")}</p>
                <p>صالح لمدة 7 أيام</p>
              </div>
            </div>

            {/* Client info */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="font-bold text-gray-800 mb-3">بيانات العميل</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">الاسم:</span> <span className="font-medium">{clientName || "-"}</span></div>
                <div><span className="text-gray-500">الهاتف:</span> <span className="font-medium">{clientPhone || "-"}</span></div>
                <div><span className="text-gray-500">العنوان:</span> <span className="font-medium">{address || "-"}</span></div>
                <div><span className="text-gray-500">المهندس:</span> <span className="font-medium">{engineerName || "-"}</span></div>
              </div>
            </div>

            {/* Materials summary */}
            {materialsTotalPrice > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-gray-800 mb-3">الخامات</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { id: material1Id, meters: material1Meters },
                    { id: material2Id, meters: material2Meters },
                    { id: material3Id, meters: material3Meters },
                  ].filter(m => m.id && m.meters).map((m, i) => {
                    const mat = materials.find(x => x.id === m.id);
                    return mat ? (
                      <div key={i} className="flex justify-between py-1 border-b">
                        <span>{mat.nameAr} × {m.meters} م²</span>
                        <span className="font-medium">{(mat.pricePerMeter * parseFloat(m.meters!)).toLocaleString()} ج</span>
                      </div>
                    ) : null;
                  })}
                  <div className="flex justify-between font-bold text-amber-700 pt-1">
                    <span>إجمالي الخامات</span>
                    <span>{materialsTotalPrice.toLocaleString()} جنيه</span>
                  </div>
                </div>
              </div>
            )}

            {/* Units summary */}
            {units.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-gray-800 mb-3">الوحدات ({units.length} وحدة)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-right">#</th>
                        <th className="p-2 text-right">الجدار</th>
                        <th className="p-2 text-right">المكان</th>
                        <th className="p-2 text-right">العرض</th>
                        <th className="p-2 text-right">الارتفاع</th>
                        <th className="p-2 text-right">م²</th>
                        <th className="p-2 text-right">الوصف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((u, i) => (
                        <tr key={u.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="p-2">{u.unitNumber}</td>
                          <td className="p-2 font-bold">{u.wallLabel}</td>
                          <td className="p-2">{LOCATION_LABELS[u.location]}</td>
                          <td className="p-2">{u.width}</td>
                          <td className="p-2">{u.height}</td>
                          <td className="p-2 font-medium text-blue-600">{u.totalArea}</td>
                          <td className="p-2">{u.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Accessories summary */}
            {selectedAccessories.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-gray-800 mb-3">الاكسسوارات</h3>
                <div className="space-y-1 text-sm">
                  {selectedAccessories.map(a => (
                    <div key={a.id} className="flex justify-between py-1 border-b">
                      <span>{a.nameAr} × {a.qty}</span>
                      <span className="font-medium">{(a.price * a.qty).toLocaleString()} ج</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-amber-700 pt-1">
                    <span>إجمالي الاكسسوارات</span>
                    <span>{accessoriesTotalPrice.toLocaleString()} جنيه</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cladding summary */}
            {selectedCladding.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-gray-800 mb-3">التجاليد</h3>
                <div className="space-y-1 text-sm">
                  {selectedCladding.map(c => (
                    <div key={c.id} className="flex justify-between py-1 border-b">
                      <span>{c.nameAr} × {c.qty}</span>
                      <span className="font-medium">{(c.price * c.qty).toLocaleString()} ج</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-blue-700 pt-1">
                    <span>إجمالي التجاليد</span>
                    <span>{claddingTotalPrice.toLocaleString()} جنيه</span>
                  </div>
                </div>
              </div>
            )}

            {/* Grand Total */}
            <div className="bg-gray-900 text-white rounded-xl p-6">
              <div className="space-y-2 text-sm mb-4">
                {materialsTotalPrice > 0 && <div className="flex justify-between"><span>الخامات</span><span>{materialsTotalPrice.toLocaleString()} ج</span></div>}
                {marbleTotalPrice > 0 && <div className="flex justify-between"><span>الرخام</span><span>{marbleTotalPrice.toLocaleString()} ج</span></div>}
                {accessoriesTotalPrice > 0 && <div className="flex justify-between"><span>الاكسسوارات</span><span>{accessoriesTotalPrice.toLocaleString()} ج</span></div>}
                {claddingTotalPrice > 0 && <div className="flex justify-between"><span>التجاليد</span><span>{claddingTotalPrice.toLocaleString()} ج</span></div>}
              </div>
              <Separator className="bg-gray-600 mb-4" />
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">الإجمالي الكلي</span>
                <span className="text-3xl font-bold text-amber-400">{grandTotal.toLocaleString()} جنيه</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">* العرض صالح لمدة 7 أيام من تاريخ الإصدار</p>
            </div>

            {notes && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-gray-800 mb-2">ملاحظات</h3>
                <p className="text-sm text-gray-600">{notes}</p>
              </div>
            )}

            <div className="flex justify-between print:hidden">
              <Button variant="outline" onClick={() => setStep("cladding")}>← السابق</Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.print()}>🖨️ طباعة</Button>
                <Button
                  onClick={handleSave}
                  disabled={createQuotation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  {createQuotation.isPending ? "جاري الحفظ..." : "💾 حفظ وطباعة"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
