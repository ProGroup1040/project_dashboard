import { useState, useEffect, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ── Types ────────────────────────────────────────────────────
type Brand = { id: number; code: string; nameAr: string; nameEn: string; systemType: string };
type Space = { id: number; nameAr: string; nameEn: string };
type Product = { id: number; nameAr: string; nameEn: string };
type ProductType = { id: number; nameAr: string; nameEn: string; basePrice: number };
type Variable = { id: number; category: string; code: string; nameAr: string; nameEn: string; priceModifier: number; isDefault: boolean };
type Complexity = { id: number; level: string; nameAr: string; multiplier: string; description: string | null };
type BasketItem = {
  id: number;
  brandId: number;
  spaceId: number;
  productId: number;
  productTypeId: number;
  selectedVariables: string;
  complexityLevel: string;
  quantity: number;
  basePrice: number;
  materialsTotal: number;
  addonsTotal: number;
  complexityMultiplier: string;
  finalPrice: number;
  notes?: string | null;
  // display helpers
  brandName?: string;
  spaceName?: string;
  productName?: string;
  productTypeName?: string;
  variableNames?: string[];
  complexityName?: string;
};

// ── Session ID ───────────────────────────────────────────────
function getSessionId() {
  let id = localStorage.getItem("pricing_session");
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("pricing_session", id);
  }
  return id;
}

// ── Format currency ──────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("ar-EG") + " ج";
}

// ── Step indicator ───────────────────────────────────────────
const STEPS = ["البراند", "الفضاء", "المنتج", "النوع", "المواصفات", "التعقيد", "الكمية"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-6 flex-wrap">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
            i < current ? "bg-amber-500 text-black" :
            i === current ? "bg-amber-400 text-black ring-2 ring-amber-300" :
            "bg-zinc-700 text-zinc-400"
          }`}>{i + 1}</div>
          <span className={`text-xs hidden sm:inline ${i === current ? "text-amber-300 font-semibold" : "text-zinc-500"}`}>{s}</span>
          {i < STEPS.length - 1 && <div className={`w-4 h-0.5 ${i < current ? "bg-amber-500" : "bg-zinc-700"}`} />}
        </div>
      ))}
    </div>
  );
}

// ── Selection Card ───────────────────────────────────────────
function SelectCard({ label, sublabel, selected, onClick }: {
  label: string; sublabel?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-right p-3 rounded-lg border transition-all cursor-pointer ${
        selected
          ? "border-amber-400 bg-amber-400/10 text-amber-200"
          : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
      }`}
    >
      <div className="font-semibold text-sm">{label}</div>
      {sublabel && <div className="text-xs text-zinc-400 mt-0.5">{sublabel}</div>}
    </button>
  );
}

// ── Variable Group ───────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  dimension: "المقاس",
  material: "الخامة / الهيكل",
  fabric: "القماش",
  finish: "التشطيب",
  hardware: "الهيد بورد",
  addon: "الإضافات",
};

function VariableGroup({
  category, variables, selected, onToggle, isMulti
}: {
  category: string;
  variables: Variable[];
  selected: Set<number>;
  onToggle: (id: number, isMulti: boolean) => void;
  isMulti: boolean;
}) {
  return (
    <div className="mb-4">
      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
        {CATEGORY_LABELS[category] || category}
        {isMulti && <span className="text-zinc-500 normal-case font-normal ml-2">(اختر أكثر من واحد)</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {variables.map(v => (
          <SelectCard
            key={v.id}
            label={v.nameAr}
            sublabel={v.priceModifier > 0 ? `+ ${fmt(v.priceModifier)}` : v.priceModifier < 0 ? `- ${fmt(Math.abs(v.priceModifier))}` : "مجاني"}
            selected={selected.has(v.id)}
            onClick={() => onToggle(v.id, isMulti)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function PricingWizard() {
  const [sessionId] = useState(getSessionId);
  const [step, setStep] = useState(0);

  // Selections
  const [brandId, setBrandId] = useState<number | null>(null);
  const [spaceId, setSpaceId] = useState<number | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [productTypeId, setProductTypeId] = useState<number | null>(null);
  const [selectedVarIds, setSelectedVarIds] = useState<Set<number>>(new Set());
  const [complexityLevel, setComplexityLevel] = useState<string>("standard");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showBasket, setShowBasket] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [quotationInfo, setQuotationInfo] = useState({ clientName: "", projectName: "", engineerName: "" });

  // Queries
  const { data: brands = [] } = trpc.pricing.getBrands.useQuery();
  const { data: spaces = [], isLoading: spacesLoading } = trpc.pricing.getSpaces.useQuery(
    { brandId: brandId! }, { enabled: !!brandId }
  );
  const { data: products = [], isLoading: productsLoading } = trpc.pricing.getProducts.useQuery(
    { spaceId: spaceId! }, { enabled: !!spaceId }
  );
  const { data: productTypes = [], isLoading: productTypesLoading } = trpc.pricing.getProductTypes.useQuery(
    { productId: productId! }, { enabled: !!productId }
  );
  const { data: variables = [] } = trpc.pricing.getVariables.useQuery(
    { productTypeId: productTypeId! }, { enabled: !!productTypeId }
  );
  const { data: complexityOptions = [] } = trpc.pricing.getComplexity.useQuery(
    { productTypeId: productTypeId! }, { enabled: !!productTypeId }
  );
  const { data: basketItems = [], refetch: refetchBasket } = trpc.pricing.getBasket.useQuery(
    { sessionId }
  );

  // Mutations
  const addToBasket = trpc.pricing.addToBasket.useMutation({ onSuccess: () => refetchBasket() });
  const removeFromBasket = trpc.pricing.removeFromBasket.useMutation({ onSuccess: () => refetchBasket() });
  const clearBasketMut = trpc.pricing.clearBasket.useMutation({ onSuccess: () => refetchBasket() });
  const saveQuotationMut = trpc.pricing.saveQuotation.useMutation();

  // Auto-select defaults when product type changes
  useEffect(() => {
    if (variables.length > 0) {
      const defaults = new Set(variables.filter(v => v.isDefault).map(v => v.id));
      setSelectedVarIds(defaults);
    }
  }, [variables]);

  // Price calculation
  const currentProductType = productTypes.find(pt => pt.id === productTypeId);
  const currentComplexity = complexityOptions.find(c => c.level === complexityLevel);

  const priceBreakdown = useMemo(() => {
    if (!currentProductType) return { base: 0, materials: 0, addons: 0, multiplier: 1, total: 0 };
    const base = currentProductType.basePrice;
    let materials = 0;
    let addons = 0;
    for (const id of Array.from(selectedVarIds)) {
      const v = variables.find(x => x.id === id);
      if (!v) continue;
      if (v.category === "addon") addons += v.priceModifier;
      else materials += v.priceModifier;
    }
    const multiplier = currentComplexity ? parseFloat(currentComplexity.multiplier) : 1;
    const total = Math.round((base + materials + addons) * multiplier * quantity);
    return { base, materials, addons, multiplier, total };
  }, [currentProductType, selectedVarIds, variables, currentComplexity, quantity]);

  // Variable groups
  const variablesByCategory = useMemo(() => {
    const groups: Record<string, Variable[]> = {};
    for (const v of variables) {
      if (!groups[v.category]) groups[v.category] = [];
      groups[v.category].push(v);
    }
    return groups;
  }, [variables]);

  const MULTI_SELECT_CATEGORIES = new Set(["addon"]);

  const handleVarToggle = useCallback((id: number, isMulti: boolean) => {
    const v = variables.find(x => x.id === id);
    if (!v) return;
    setSelectedVarIds(prev => {
      const next = new Set(prev);
      if (isMulti) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        // Single select within category — deselect others in same category
        for (const other of variables.filter(x => x.category === v.category)) {
          next.delete(other.id);
        }
        next.add(id);
      }
      return next;
    });
  }, [variables]);

  // Basket total
  const basketTotal = basketItems.reduce((sum, item) => sum + item.finalPrice, 0);

  // Helpers for display names
  const selectedBrand = brands.find(b => b.id === brandId);
  const selectedSpace = spaces.find(s => s.id === spaceId);
  const selectedProduct = products.find(p => p.id === productId);

  function handleAddToBasket() {
    if (!brandId || !spaceId || !productId || !productTypeId || !currentProductType) return;
    const varNames = Array.from(selectedVarIds).map(id => variables.find(v => v.id === id)?.nameAr || "").filter(Boolean);
    addToBasket.mutate({
      sessionId,
      brandId,
      spaceId,
      productId,
      productTypeId,
      selectedVariables: JSON.stringify(Array.from(selectedVarIds)),
      complexityLevel: complexityLevel as any,
      quantity,
      basePrice: priceBreakdown.base,
      materialsTotal: priceBreakdown.materials,
      addonsTotal: priceBreakdown.addons,
      complexityMultiplier: String(priceBreakdown.multiplier),
      finalPrice: priceBreakdown.total,
      notes: notes || undefined,
    });
    // Reset for next item
    setStep(2);
    setProductId(null);
    setProductTypeId(null);
    setSelectedVarIds(new Set());
    setComplexityLevel("standard");
    setQuantity(1);
    setNotes("");
    setShowBasket(true);
  }

  function handleSaveQuotation() {
    const qNum = `QT-${Date.now().toString().slice(-6)}`;
    saveQuotationMut.mutate({
      sessionId,
      quotationNumber: qNum,
      clientName: quotationInfo.clientName || undefined,
      projectName: quotationInfo.projectName || undefined,
      engineerName: quotationInfo.engineerName || undefined,
      totalAmount: basketTotal,
    });
    setShowQuotation(true);
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-cairo" dir="rtl">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img
            src="/professor_logo_clean.png"
            alt="Professor Logo"
            className="h-10 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div className="text-amber-400 font-bold text-base">Pro Group</div>
            <div className="text-zinc-400 text-xs">نظام التسعير الذكي</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/kitchen"
            className="text-zinc-400 hover:text-zinc-200 text-xs px-3 py-2 rounded-lg border border-zinc-700 hover:border-amber-500 transition-all"
          >
            🍽️ مطابخ
          </a>
          <a
            href="/"
            className="text-zinc-400 hover:text-zinc-200 text-xs px-3 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-all"
          >
            ← الرئيسية
          </a>
          <button
            onClick={() => setShowBasket(!showBasket)}
            className="relative flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-lg text-sm hover:bg-amber-500/20 transition-all"
          >
            <span>🛒</span>
            <span>السلة</span>
            {basketItems.length > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-amber-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {basketItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Basket Panel */}
        {showBasket && (
          <div className="mb-6 bg-zinc-900 border border-zinc-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-amber-400 font-bold text-base">🛒 السلة ({basketItems.length} عنصر)</h2>
              <div className="flex gap-2">
                {basketItems.length > 0 && (
                  <>
                    <button
                      onClick={handleSaveQuotation}
                      className="bg-amber-500 text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-all"
                    >
                      إنشاء عرض سعر
                    </button>
                    <button
                      onClick={() => clearBasketMut.mutate({ sessionId })}
                      className="bg-red-900/50 text-red-300 text-xs px-3 py-1.5 rounded-lg hover:bg-red-900 transition-all"
                    >
                      مسح الكل
                    </button>
                  </>
                )}
                <button onClick={() => setShowBasket(false)} className="text-zinc-500 hover:text-zinc-300 text-xs px-2">✕</button>
              </div>
            </div>

            {basketItems.length === 0 ? (
              <div className="text-center text-zinc-500 py-6 text-sm">السلة فارغة — أضف عناصر من الأسفل</div>
            ) : (
              <div className="space-y-2">
                {basketItems.map((item, i) => (
                  <div key={item.id} className="flex items-start justify-between bg-zinc-800 rounded-lg p-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-200">
                        {item.notes || `عنصر ${i + 1}`}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        الكمية: {item.quantity} × {fmt(Math.round(item.finalPrice / item.quantity))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-amber-300 font-bold text-sm">{fmt(item.finalPrice)}</span>
                      <button
                        onClick={() => removeFromBasket.mutate({ id: item.id, sessionId })}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >✕</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-zinc-700">
                  <span className="text-zinc-400 text-sm">الإجمالي</span>
                  <span className="text-amber-400 font-bold text-lg">{fmt(basketTotal)}</span>
                </div>
              </div>
            )}

            {/* Quotation Info */}
            {showQuotation && (
              <div className="mt-4 bg-zinc-800 rounded-xl p-4 border border-amber-500/30">
                <h3 className="text-amber-400 font-bold mb-3 text-sm">📄 بيانات عرض السعر</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  {[
                    { key: "clientName", label: "اسم العميل" },
                    { key: "projectName", label: "اسم المشروع" },
                    { key: "engineerName", label: "اسم المهندس" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-zinc-400 block mb-1">{f.label}</label>
                      <input
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                        value={(quotationInfo as any)[f.key]}
                        onChange={e => setQuotationInfo(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.label}
                      />
                    </div>
                  ))}
                </div>
                <QuotationView
                  items={basketItems}
                  total={basketTotal}
                  info={quotationInfo}
                  qNum={`QT-${Date.now().toString().slice(-6)}`}
                />
              </div>
            )}
          </div>
        )}

        {/* Wizard */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <StepBar current={step} />

          {/* Step 0: Brand */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-bold text-amber-300 mb-4">اختر البراند</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {brands.map(b => (
                  <SelectCard
                    key={b.id}
                    label={b.nameAr}
                    sublabel={b.nameEn}
                    selected={brandId === b.id}
                    onClick={() => { setBrandId(b.id); setSpaceId(null); setProductId(null); setProductTypeId(null); setStep(1); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Space */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(0)} className="text-zinc-500 hover:text-zinc-300 text-sm">← رجوع</button>
                <h2 className="text-lg font-bold text-amber-300">اختر الفضاء / الغرفة</h2>
              </div>
              {spacesLoading ? (
                <div className="text-center text-amber-400 py-8 text-sm">⏳ جاري تحميل الغرف...</div>
              ) : spaces.length === 0 ? (
                <div className="text-center text-zinc-500 py-8 text-sm">لا توجد غرف لهذا البراند حتى الآن</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {spaces.map(s => (
                    <SelectCard
                      key={s.id}
                      label={s.nameAr}
                      sublabel={s.nameEn}
                      selected={spaceId === s.id}
                      onClick={() => { setSpaceId(s.id); setProductId(null); setProductTypeId(null); setStep(2); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Product */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(1)} className="text-zinc-500 hover:text-zinc-300 text-sm">← رجوع</button>
                <h2 className="text-lg font-bold text-amber-300">اختر المنتج</h2>
              </div>
              {productsLoading ? (
                <div className="text-center text-amber-400 py-8 text-sm">⏳ جاري تحميل المنتجات...</div>
              ) : products.length === 0 ? (
                <div className="text-center text-zinc-500 py-8 text-sm">لا توجد منتجات لهذه الغرفة حتى الآن</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {products.map(p => (
                    <SelectCard
                      key={p.id}
                      label={p.nameAr}
                      sublabel={p.nameEn}
                      selected={productId === p.id}
                      onClick={() => { setProductId(p.id); setProductTypeId(null); setStep(3); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Product Type */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(2)} className="text-zinc-500 hover:text-zinc-300 text-sm">← رجوع</button>
                <h2 className="text-lg font-bold text-amber-300">اختر النوع</h2>
              </div>
              {productTypesLoading ? (
                <div className="text-center text-amber-400 py-8 text-sm">⏳ جاري تحميل الأنواع...</div>
              ) : productTypes.length === 0 ? (
                <div className="text-center text-zinc-500 py-8 text-sm">لا توجد أنواع لهذا المنتج حتى الآن</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {productTypes.map(pt => (
                    <SelectCard
                      key={pt.id}
                      label={pt.nameAr}
                      sublabel={`سعر أساسي: ${fmt(pt.basePrice)}`}
                      selected={productTypeId === pt.id}
                      onClick={() => { setProductTypeId(pt.id); setStep(4); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Specifications */}
          {step === 4 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(3)} className="text-zinc-500 hover:text-zinc-300 text-sm">← رجوع</button>
                <h2 className="text-lg font-bold text-amber-300">المواصفات والخيارات</h2>
              </div>
              {Object.entries(variablesByCategory).map(([cat, vars]) => (
                <VariableGroup
                  key={cat}
                  category={cat}
                  variables={vars}
                  selected={selectedVarIds}
                  onToggle={handleVarToggle}
                  isMulti={MULTI_SELECT_CATEGORIES.has(cat)}
                />
              ))}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setStep(5)}
                  className="bg-amber-500 text-black font-bold px-6 py-2 rounded-lg hover:bg-amber-400 transition-all"
                >
                  التالي: مستوى التعقيد →
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Complexity */}
          {step === 5 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(4)} className="text-zinc-500 hover:text-zinc-300 text-sm">← رجوع</button>
                <h2 className="text-lg font-bold text-amber-300">مستوى التعقيد</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {complexityOptions.map(c => (
                  <SelectCard
                    key={c.id}
                    label={c.nameAr}
                    sublabel={`× ${c.multiplier} — ${c.description || ""}`}
                    selected={complexityLevel === c.level}
                    onClick={() => setComplexityLevel(c.level)}
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setStep(6)}
                  className="bg-amber-500 text-black font-bold px-6 py-2 rounded-lg hover:bg-amber-400 transition-all"
                >
                  التالي: الكمية →
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Quantity + Summary + Add to basket */}
          {step === 6 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(5)} className="text-zinc-500 hover:text-zinc-300 text-sm">← رجوع</button>
                <h2 className="text-lg font-bold text-amber-300">الكمية والملاحظات</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">الكمية</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 bg-zinc-700 rounded-lg text-lg font-bold hover:bg-zinc-600 transition-all">−</button>
                    <span className="text-xl font-bold text-amber-300 w-8 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 bg-zinc-700 rounded-lg text-lg font-bold hover:bg-zinc-600 transition-all">+</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">ملاحظات (اختياري)</label>
                  <input
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="مثال: غرفة نوم ماستر"
                  />
                </div>
              </div>

              {/* Price breakdown */}
              <div className="bg-zinc-800 rounded-xl p-4 mb-5 border border-zinc-700">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">تفاصيل السعر</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>السعر الأساسي</span>
                    <span className="text-zinc-200">{fmt(priceBreakdown.base)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>الخامات والمواصفات</span>
                    <span className="text-zinc-200">+ {fmt(priceBreakdown.materials)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>الإضافات</span>
                    <span className="text-zinc-200">+ {fmt(priceBreakdown.addons)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>معامل التعقيد</span>
                    <span className="text-zinc-200">× {priceBreakdown.multiplier}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>الكمية</span>
                    <span className="text-zinc-200">× {quantity}</span>
                  </div>
                  <Separator className="bg-zinc-700" />
                  <div className="flex justify-between font-bold text-base">
                    <span className="text-zinc-200">السعر النهائي</span>
                    <span className="text-amber-400 text-lg">{fmt(priceBreakdown.total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddToBasket}
                disabled={addToBasket.isPending}
                className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl text-base hover:bg-amber-400 transition-all disabled:opacity-50"
              >
                {addToBasket.isPending ? "جاري الإضافة..." : "✚ أضف للسلة"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quotation View ────────────────────────────────────────────
function QuotationView({
  items, total, info, qNum
}: {
  items: BasketItem[];
  total: number;
  info: { clientName: string; projectName: string; engineerName: string };
  qNum: string;
}) {
  const today = new Date().toLocaleDateString("ar-EG");
  const validity = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("ar-EG");

  return (
    <div className="bg-white text-zinc-900 rounded-xl p-5 text-sm print:shadow-none" id="quotation-print">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="text-xl font-black text-amber-600">Pro Group</div>
          <div className="text-xs text-zinc-500">نظام التسعير المتكامل</div>
        </div>
        <div className="text-left text-xs text-zinc-500">
          <div>رقم العرض: <span className="font-bold text-zinc-800">{qNum}</span></div>
          <div>التاريخ: {today}</div>
          <div>صالح حتى: {validity}</div>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
        {[
          { label: "العميل", val: info.clientName },
          { label: "المشروع", val: info.projectName },
          { label: "المهندس", val: info.engineerName },
        ].map(f => (
          <div key={f.label} className="bg-zinc-50 rounded-lg p-2">
            <div className="text-zinc-400">{f.label}</div>
            <div className="font-semibold text-zinc-800">{f.val || "—"}</div>
          </div>
        ))}
      </div>

      {/* Items Table */}
      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="bg-amber-500 text-black">
            <th className="p-2 text-right rounded-tr-lg">#</th>
            <th className="p-2 text-right">البند</th>
            <th className="p-2 text-center">الكمية</th>
            <th className="p-2 text-left">السعر الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} className={i % 2 === 0 ? "bg-zinc-50" : "bg-white"}>
              <td className="p-2 text-zinc-500">{i + 1}</td>
              <td className="p-2 font-medium">{item.notes || `عنصر ${i + 1}`}</td>
              <td className="p-2 text-center">{item.quantity}</td>
              <td className="p-2 text-left font-bold text-amber-700">{fmt(item.finalPrice)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-amber-500">
            <td colSpan={3} className="p-2 font-bold text-left">الإجمالي الكلي</td>
            <td className="p-2 font-black text-amber-700 text-base text-left">{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="text-xs text-zinc-400 border-t border-zinc-200 pt-3">
        * العرض صالح لمدة 7 أيام من تاريخه. الأسعار قابلة للتغيير بعد انتهاء مدة الصلاحية.
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => window.print()}
          className="bg-amber-500 text-black font-bold px-4 py-2 rounded-lg text-xs hover:bg-amber-400 transition-all print:hidden"
        >
          🖨️ طباعة / PDF
        </button>
      </div>
    </div>
  );
}
