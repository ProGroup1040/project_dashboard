import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ===================== TYPES =====================
interface QuotationItem {
  id: string;
  name: string;
  category: "materials" | "accessories" | "labor" | "transport";
  price: number;
  quantity: number;
  removed?: boolean;
  discount?: number;
}

interface AccessoryItem {
  id: string;
  name: string;
  price: number;
  benefit1: string;
  benefit2: string;
  benefit3: string;
  categoryTag: string;
  decision: "approved" | "hesitant" | "rejected" | "pending";
  multimediaPlayed: boolean;
  rejectionReason?: string;
  dbId?: number;
}

interface ObjectionItem {
  id: string;
  type: string;
  relatedItem?: string;
  engineerResponse?: string;
  clientReaction?: string;
}

interface ChangeItem {
  id: string;
  changeType: string;
  itemName?: string;
  beforePrice: number;
  afterPrice: number;
  detail?: string;
}

// ===================== STEP LABELS =====================
const STEPS = [
  { num: 1, label: "ملخص العميل", icon: "👤" },
  { num: 2, label: "جولة التصميم", icon: "🏠" },
  { num: 3, label: "مراجعة الإكسسوارات", icon: "✨" },
  { num: 4, label: "تفصيل العرض", icon: "📋" },
  { num: 5, label: "معالجة الاعتراضات", icon: "💬" },
  { num: 6, label: "تعديل العرض", icon: "✏️" },
  { num: 7, label: "الإغلاق", icon: "🎯" },
];

const OBJECTION_TYPES: Record<string, string> = {
  total_price: "إجمالي السعر مرتفع",
  accessories_price: "سعر الإكسسوارات",
  transportation: "رسوم النقل",
  delivery_time: "مدة التسليم",
  materials: "نوع المواد",
  payment_method: "طريقة الدفع",
  competitor_comparison: "مقارنة بمنافس",
  needs_partner_approval: "يحتاج موافقة شريك",
  not_convinced_value: "غير مقتنع بالقيمة",
};

const CHANGE_TYPES: Record<string, string> = {
  remove_item: "حذف بند",
  replace_item: "استبدال بند",
  adjust_quantity: "تعديل الكمية",
  apply_discount: "تطبيق خصم",
  change_material: "تغيير المادة",
};

// ===================== MAIN COMPONENT =====================
export default function NegotiationSession() {
  const params = useParams<{ leadId?: string; sessionId?: string }>();
  const [, navigate] = useLocation();
  

  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId, setSessionId] = useState<number | null>(params.sessionId ? parseInt(params.sessionId) : null);
  const [leadId] = useState<number>(params.leadId ? parseInt(params.leadId) : 0);
  const [engineerName, setEngineerName] = useState("");
  const [isStarted, setIsStarted] = useState(!!params.sessionId);

  // Step 1 state
  const [clientStyle, setClientStyle] = useState("");
  const [clientBudget, setClientBudget] = useState("");
  const [clientPriority, setClientPriority] = useState("");
  const [clientNeedsConfirmed, setClientNeedsConfirmed] = useState(false);

  // Step 2 state
  const [layoutExplained, setLayoutExplained] = useState(false);
  const [storageExplained, setStorageExplained] = useState(false);
  const [materialsExplained, setMaterialsExplained] = useState(false);
  const [lightingExplained, setLightingExplained] = useState(false);

  // Step 3 state
  const [accessories, setAccessories] = useState<AccessoryItem[]>([
    { id: "a1", name: "درج سوفت كلوز", price: 2500, benefit1: "يمنع الأصوات المزعجة", benefit2: "يطيل عمر الدرج", benefit3: "إحساس فاخر عند الإغلاق", categoryTag: "luxury", decision: "pending", multimediaPlayed: false },
    { id: "a2", name: "إضاءة داخلية LED", price: 3200, benefit1: "يُسهّل الرؤية ليلاً", benefit2: "يُضيف لمسة جمالية", benefit3: "موفر للطاقة", categoryTag: "luxury", decision: "pending", multimediaPlayed: false },
    { id: "a3", name: "منظم أدراج", price: 1800, benefit1: "تنظيم مثالي للملابس", benefit2: "يوفر مساحة إضافية", benefit3: "سهل التركيب والتعديل", categoryTag: "storage", decision: "pending", multimediaPlayed: false },
    { id: "a4", name: "رف حذاء دوار", price: 4500, benefit1: "يستوعب ضعف العدد", benefit2: "توفير مساحة الأرضية", benefit3: "تصميم عصري وأنيق", categoryTag: "storage", decision: "pending", multimediaPlayed: false },
    { id: "a5", name: "مرآة كاملة مضاءة", price: 5800, benefit1: "إضاءة متوازنة لكل الجسم", benefit2: "تُضاعف إحساس المساحة", benefit3: "تحكم في درجة الإضاءة", categoryTag: "luxury", decision: "pending", multimediaPlayed: false },
  ]);
  const [currentAccessoryIdx, setCurrentAccessoryIdx] = useState(0);

  // Step 4 state
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([
    { id: "q1", name: "خامات الهيكل الرئيسي", category: "materials", price: 45000, quantity: 1 },
    { id: "q2", name: "واجهات الأبواب", category: "materials", price: 28000, quantity: 1 },
    { id: "q3", name: "إكسسوارات الدواليب", category: "accessories", price: 12000, quantity: 1 },
    { id: "q4", name: "أعمال النجارة والتركيب", category: "labor", price: 18000, quantity: 1 },
    { id: "q5", name: "نقل وتوصيل", category: "transport", price: 3500, quantity: 1 },
  ]);
  const [quotationExplainedCategories, setQuotationExplainedCategories] = useState<Set<string>>(new Set());

  // Step 5 state
  const [objections, setObjections] = useState<ObjectionItem[]>([]);
  const [newObjectionType, setNewObjectionType] = useState("total_price");
  const [newObjectionItem, setNewObjectionItem] = useState("");
  const [newObjectionResponse, setNewObjectionResponse] = useState("");
  const [newObjectionReaction, setNewObjectionReaction] = useState<"accepted" | "still_hesitant" | "rejected">("accepted");

  // Step 6 state
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [newChangeType, setNewChangeType] = useState("apply_discount");
  const [newChangeItem, setNewChangeItem] = useState("");
  const [newChangeBefore, setNewChangeBefore] = useState("");
  const [newChangeAfter, setNewChangeAfter] = useState("");
  const [newChangeDetail, setNewChangeDetail] = useState("");

  // Step 7 state
  const [closingStatus, setClosingStatus] = useState<"ready_to_close" | "needs_revision" | "needs_time" | "lost">("ready_to_close");
  const [nextAction, setNextAction] = useState<"follow_up_call" | "send_revision" | "visit_showroom" | "apply_discount" | "wait_for_decision">("follow_up_call");

  // Mutations
  const createSessionMut = trpc.negotiation.createSession.useMutation();
  const updateSessionMut = trpc.negotiation.updateSession.useMutation();
  const completeSessionMut = trpc.negotiation.completeSession.useMutation();
  const logObjectionMut = trpc.negotiation.logObjection.useMutation();
  const logChangeMut = trpc.negotiation.logChange.useMutation();
  const updateAccessoryMut = trpc.negotiation.updateAccessoryDecision.useMutation();
  const addAccessoryMut = trpc.negotiation.addAccessory.useMutation();

  // Load existing session
  const { data: sessionData } = trpc.negotiation.getSession.useQuery(
    { id: sessionId! },
    { enabled: !!sessionId }
  );

  const { data: leadData } = trpc.crm.getLead.useQuery(
    { id: leadId },
    { enabled: !!leadId }
  );

  // Computed totals
  const activeItems = quotationItems.filter(i => !i.removed);
  const totalMaterials = activeItems.filter(i => i.category === "materials").reduce((s, i) => s + i.price * i.quantity, 0);
  const totalAccessories = activeItems.filter(i => i.category === "accessories").reduce((s, i) => s + i.price * i.quantity, 0);
  const totalLabor = activeItems.filter(i => i.category === "labor").reduce((s, i) => s + i.price * i.quantity, 0);
  const totalTransport = activeItems.filter(i => i.category === "transport").reduce((s, i) => s + i.price * i.quantity, 0);
  const grandTotal = totalMaterials + totalAccessories + totalLabor + totalTransport;

  const approvedAccessoriesTotal = accessories
    .filter(a => a.decision === "approved")
    .reduce((s, a) => s + a.price, 0);

  const totalDiscount = changes
    .filter(c => c.changeType === "apply_discount")
    .reduce((s, c) => s + (c.beforePrice - c.afterPrice), 0);

  // Start session
  async function handleStartSession() {
    if (!engineerName.trim()) {
      toast.error("يرجى إدخال اسم المهندس");
      return;
    }
    try {
      const result = await createSessionMut.mutateAsync({ leadId, engineerName });
      setSessionId(result.id);
      setIsStarted(true);
      toast.success(`جلسة التفاوض #${result.id} بدأت`);
    } catch (e) {
      toast.error("فشل بدء الجلسة");
    }
  }

  // Save step and advance
  async function saveAndAdvance() {
    if (!sessionId) return;
    try {
      const stepKey = `step${currentStep}Completed` as any;
      const updateData: any = { id: sessionId, [stepKey]: true };

      if (currentStep === 1) {
        updateData.clientStyle = clientStyle;
        updateData.clientBudget = clientBudget ? parseInt(clientBudget) : undefined;
        updateData.clientPriority = clientPriority;
        updateData.clientNeedsConfirmed = clientNeedsConfirmed;
      } else if (currentStep === 2) {
        updateData.layoutExplained = layoutExplained;
        updateData.storageExplained = storageExplained;
        updateData.materialsExplained = materialsExplained;
        updateData.lightingExplained = lightingExplained;
      } else if (currentStep === 3) {
        // Save accessories to DB
        for (const acc of accessories) {
          if (!acc.dbId) {
            const res = await addAccessoryMut.mutateAsync({
              sessionId,
              accessoryName: acc.name,
              price: acc.price,
              benefit1: acc.benefit1,
              benefit2: acc.benefit2,
              benefit3: acc.benefit3,
              categoryTag: acc.categoryTag as any,
            });
            if (acc.decision !== "pending") {
              await updateAccessoryMut.mutateAsync({
                id: res.id,
                decision: acc.decision,
                rejectionReason: acc.rejectionReason as any,
                multimediaPlayed: acc.multimediaPlayed,
              });
            }
          }
        }
      } else if (currentStep === 4) {
        updateData.quotationBreakdownJson = JSON.stringify({
          materials: totalMaterials,
          accessories: totalAccessories,
          labor: totalLabor,
          transport: totalTransport,
          total: grandTotal,
        });
        updateData.originalTotal = grandTotal;
      } else if (currentStep === 5) {
        // Objections already saved individually
      } else if (currentStep === 6) {
        updateData.finalTotal = grandTotal - totalDiscount;
        updateData.totalDiscount = totalDiscount;
      }

      await updateSessionMut.mutateAsync(updateData);

      if (currentStep < 7) {
        setCurrentStep(prev => prev + 1);
      }
    } catch (e) {
      toast.error("فشل حفظ البيانات");
    }
  }

  // Complete session
  async function handleComplete() {
    if (!sessionId) return;
    try {
      await completeSessionMut.mutateAsync({
        id: sessionId,
        finalTotal: grandTotal - totalDiscount,
        closingStatus,
        nextAction,
      });
      // Also update lead stage
      toast.success("تم حفظ جلسة التفاوض بنجاح ✅");
      setTimeout(() => navigate("/crm"), 1500);
    } catch (e) {
      toast.error("فشل إغلاق الجلسة");
    }
  }

  // Add objection
  async function handleAddObjection() {
    if (!sessionId) return;
    try {
      await logObjectionMut.mutateAsync({
        sessionId,
        objectionType: newObjectionType as any,
        relatedItemName: newObjectionItem || undefined,
        engineerResponse: newObjectionResponse || undefined,
        clientReaction: newObjectionReaction,
      });
      setObjections(prev => [...prev, {
        id: Date.now().toString(),
        type: newObjectionType,
        relatedItem: newObjectionItem,
        engineerResponse: newObjectionResponse,
        clientReaction: newObjectionReaction,
      }]);
      setNewObjectionItem("");
      setNewObjectionResponse("");
      toast.success("تم تسجيل الاعتراض");
    } catch (e) {
      toast.error("فشل تسجيل الاعتراض");
    }
  }

  // Add change
  async function handleAddChange() {
    if (!sessionId || !newChangeBefore || !newChangeAfter) return;
    try {
      await logChangeMut.mutateAsync({
        sessionId,
        changeType: newChangeType as any,
        itemName: newChangeItem || undefined,
        beforePrice: parseInt(newChangeBefore),
        afterPrice: parseInt(newChangeAfter),
        changeDetail: newChangeDetail || undefined,
      });
      setChanges(prev => [...prev, {
        id: Date.now().toString(),
        changeType: newChangeType,
        itemName: newChangeItem,
        beforePrice: parseInt(newChangeBefore),
        afterPrice: parseInt(newChangeAfter),
        detail: newChangeDetail,
      }]);
      setNewChangeItem("");
      setNewChangeBefore("");
      setNewChangeAfter("");
      setNewChangeDetail("");
      toast.success("تم تسجيل التعديل");
    } catch (e) {
      toast.error("فشل تسجيل التعديل");
    }
  }

  // ===================== RENDER =====================
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center" dir="rtl">
        <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <img src="/professor_logo_clean.png" alt="Pro Group" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-yellow-400">جلسة التفاوض</h1>
            {leadData && (
              <p className="text-gray-300 mt-2">
                العميل: <span className="text-white font-semibold">{leadData.clientName}</span>
              </p>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">اسم المهندس</label>
              <Input
                value={engineerName}
                onChange={e => setEngineerName(e.target.value)}
                placeholder="م. أحمد محمد"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <Button
              onClick={handleStartSession}
              disabled={createSessionMut.isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-3"
            >
              {createSessionMut.isPending ? "جاري البدء..." : "🚀 بدء الجلسة"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/crm")}
              className="w-full border-gray-600 text-gray-300"
            >
              ← العودة للـ CRM
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Header */}
      <div className="bg-gray-900 border-b border-yellow-500/20 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/professor_logo_clean.png" alt="Pro Group" className="h-10" />
            <div>
              <h1 className="text-yellow-400 font-bold text-lg">جلسة التفاوض</h1>
              {leadData && <p className="text-gray-400 text-sm">{leadData.clientName} — {leadData.leadNumber}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
              جلسة #{sessionId}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate("/crm")} className="text-gray-400">
              ✕
            </Button>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-1 overflow-x-auto">
            {STEPS.map(step => (
              <button
                key={step.num}
                onClick={() => step.num <= currentStep && setCurrentStep(step.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                  step.num === currentStep
                    ? "bg-yellow-500 text-black font-bold"
                    : step.num < currentStep
                    ? "bg-green-900/50 text-green-400 border border-green-700/50"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                <span>{step.icon}</span>
                <span>{step.label}</span>
                {step.num < currentStep && <span className="text-green-400">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ===== STEP 1: CLIENT RECAP ===== */}
        {currentStep === 1 && (
          <StepCard title="👤 ملخص احتياجات العميل" subtitle="راجع مع العميل أهدافه وأولوياته قبل البدء">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">أسلوب التصميم المفضل</label>
                <select
                  value={clientStyle}
                  onChange={e => setClientStyle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">اختر الأسلوب</option>
                  <option value="classic">كلاسيك</option>
                  <option value="modern">مودرن</option>
                  <option value="neoclassic">نيو كلاسيك</option>
                  <option value="contemporary">كونتمبوراري</option>
                  <option value="luxury">لاكشري</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">الميزانية المتوقعة (جنيه)</label>
                <Input
                  type="number"
                  value={clientBudget}
                  onChange={e => setClientBudget(e.target.value)}
                  placeholder="مثال: 500000"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-1">الأولويات والملاحظات</label>
              <Textarea
                value={clientPriority}
                onChange={e => setClientPriority(e.target.value)}
                placeholder="مثال: يهتم بالتخزين أكثر من الجماليات، لديه أطفال صغار..."
                className="bg-gray-800 border-gray-600 text-white h-24"
              />
            </div>
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientNeedsConfirmed}
                  onChange={e => setClientNeedsConfirmed(e.target.checked)}
                  className="w-5 h-5 accent-yellow-500"
                />
                <span className="text-blue-300 font-medium">✅ تم مراجعة وتأكيد احتياجات العميل</span>
              </label>
            </div>
            <StepActions onNext={saveAndAdvance} nextDisabled={!clientNeedsConfirmed} />
          </StepCard>
        )}

        {/* ===== STEP 2: DESIGN WALKTHROUGH ===== */}
        {currentStep === 2 && (
          <StepCard title="🏠 جولة التصميم" subtitle="اشرح للعميل كل جانب من جوانب التصميم">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "layout", label: "📐 التخطيط والمساحات", desc: "شرح توزيع الوحدات والمساحات المتاحة", state: layoutExplained, set: setLayoutExplained },
                { key: "storage", label: "📦 حلول التخزين", desc: "شرح خيارات التخزين والأرفف والأدراج", state: storageExplained, set: setStorageExplained },
                { key: "materials", label: "🪵 الخامات والألوان", desc: "عرض عينات الخامات وخيارات الألوان", state: materialsExplained, set: setMaterialsExplained },
                { key: "lighting", label: "💡 الإضاءة", desc: "شرح نظام الإضاءة الداخلية والخارجية", state: lightingExplained, set: setLightingExplained },
              ].map(item => (
                <div
                  key={item.key}
                  onClick={() => item.set(!item.state)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    item.state
                      ? "border-green-500 bg-green-900/20"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{item.label}</h3>
                    <span className={`text-2xl ${item.state ? "text-green-400" : "text-gray-600"}`}>
                      {item.state ? "✅" : "⭕"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-sm text-yellow-300">
              💡 تأكد من شرح كل جانب للعميل قبل الانتقال للخطوة التالية
            </div>
            <StepActions
              onNext={saveAndAdvance}
              onBack={() => setCurrentStep(1)}
              nextDisabled={!layoutExplained || !storageExplained || !materialsExplained || !lightingExplained}
            />
          </StepCard>
        )}

        {/* ===== STEP 3: ACCESSORIES REVIEW ===== */}
        {currentStep === 3 && (
          <StepCard title="✨ مراجعة الإكسسوارات" subtitle="اعرض كل إكسسوار مع مزاياه وسجّل قرار العميل">
            {/* Progress */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {accessories.map((acc, idx) => (
                <button
                  key={acc.id}
                  onClick={() => setCurrentAccessoryIdx(idx)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    idx === currentAccessoryIdx ? "bg-yellow-500 text-black" :
                    acc.decision === "approved" ? "bg-green-600 text-white" :
                    acc.decision === "rejected" ? "bg-red-700 text-white" :
                    acc.decision === "hesitant" ? "bg-yellow-700 text-white" :
                    "bg-gray-700 text-gray-300"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Current Accessory */}
            {accessories[currentAccessoryIdx] && (
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{accessories[currentAccessoryIdx].name}</h3>
                    <p className="text-yellow-400 font-semibold mt-1">
                      {accessories[currentAccessoryIdx].price.toLocaleString()} جنيه
                    </p>
                  </div>
                  <Badge className={`
                    ${accessories[currentAccessoryIdx].categoryTag === "luxury" ? "bg-purple-700" :
                      accessories[currentAccessoryIdx].categoryTag === "storage" ? "bg-blue-700" :
                      "bg-gray-700"}
                  `}>
                    {accessories[currentAccessoryIdx].categoryTag === "luxury" ? "فاخر" :
                     accessories[currentAccessoryIdx].categoryTag === "storage" ? "تخزين" : "عملي"}
                  </Badge>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    accessories[currentAccessoryIdx].benefit1,
                    accessories[currentAccessoryIdx].benefit2,
                    accessories[currentAccessoryIdx].benefit3,
                  ].map((benefit, i) => (
                    <div key={i} className="bg-gray-700/50 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">{["🌟", "💎", "🎯"][i]}</div>
                      <p className="text-sm text-gray-300">{benefit}</p>
                    </div>
                  ))}
                </div>

                {/* Multimedia */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accessories[currentAccessoryIdx].multimediaPlayed}
                      onChange={e => {
                        const updated = [...accessories];
                        updated[currentAccessoryIdx].multimediaPlayed = e.target.checked;
                        setAccessories(updated);
                      }}
                      className="w-4 h-4 accent-yellow-500"
                    />
                    <span className="text-sm text-gray-300">🎬 تم عرض الفيديو/الصور للعميل</span>
                  </label>
                </div>

                {/* Decision Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      const updated = [...accessories];
                      updated[currentAccessoryIdx].decision = "approved";
                      setAccessories(updated);
                    }}
                    className={`py-2 rounded-lg font-semibold transition-all ${
                      accessories[currentAccessoryIdx].decision === "approved"
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-green-800"
                    }`}
                  >
                    ✅ موافق
                  </button>
                  <button
                    onClick={() => {
                      const updated = [...accessories];
                      updated[currentAccessoryIdx].decision = "hesitant";
                      setAccessories(updated);
                    }}
                    className={`py-2 rounded-lg font-semibold transition-all ${
                      accessories[currentAccessoryIdx].decision === "hesitant"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-yellow-800"
                    }`}
                  >
                    🤔 متردد
                  </button>
                  <button
                    onClick={() => {
                      const updated = [...accessories];
                      updated[currentAccessoryIdx].decision = "rejected";
                      setAccessories(updated);
                    }}
                    className={`py-2 rounded-lg font-semibold transition-all ${
                      accessories[currentAccessoryIdx].decision === "rejected"
                        ? "bg-red-700 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-red-800"
                    }`}
                  >
                    ❌ رفض
                  </button>
                </div>

                {/* Rejection reason */}
                {accessories[currentAccessoryIdx].decision === "rejected" && (
                  <div className="mt-3">
                    <label className="block text-sm text-gray-400 mb-1">سبب الرفض</label>
                    <select
                      value={accessories[currentAccessoryIdx].rejectionReason || ""}
                      onChange={e => {
                        const updated = [...accessories];
                        updated[currentAccessoryIdx].rejectionReason = e.target.value;
                        setAccessories(updated);
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="">اختر السبب</option>
                      <option value="price">السعر مرتفع</option>
                      <option value="not_useful">غير مفيد</option>
                      <option value="needs_alternative">يريد بديل</option>
                      <option value="not_convinced">غير مقتنع</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Navigation between accessories */}
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentAccessoryIdx(Math.max(0, currentAccessoryIdx - 1))}
                disabled={currentAccessoryIdx === 0}
                className="border-gray-600 text-gray-300"
              >
                ← السابق
              </Button>
              <span className="text-gray-400 text-sm self-center">
                {currentAccessoryIdx + 1} / {accessories.length}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentAccessoryIdx(Math.min(accessories.length - 1, currentAccessoryIdx + 1))}
                disabled={currentAccessoryIdx === accessories.length - 1}
                className="border-gray-600 text-gray-300"
              >
                التالي →
              </Button>
            </div>

            {/* Summary */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-green-900/30 border border-green-700/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">{accessories.filter(a => a.decision === "approved").length}</div>
                <div className="text-xs text-gray-400">موافق عليه</div>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-400">{accessories.filter(a => a.decision === "hesitant").length}</div>
                <div className="text-xs text-gray-400">متردد</div>
              </div>
              <div className="bg-red-900/30 border border-red-700/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-400">{accessories.filter(a => a.decision === "rejected").length}</div>
                <div className="text-xs text-gray-400">مرفوض</div>
              </div>
            </div>

            <StepActions
              onNext={saveAndAdvance}
              onBack={() => setCurrentStep(2)}
              nextDisabled={accessories.some(a => a.decision === "pending")}
              nextLabel="حفظ وانتقل للعرض المالي →"
            />
          </StepCard>
        )}

        {/* ===== STEP 4: QUOTATION BREAKDOWN ===== */}
        {currentStep === 4 && (
          <StepCard title="📋 تفصيل العرض المالي" subtitle="اشرح كل فئة للعميل بالتفصيل قبل الإجمالي">
            {/* Category explanation checklist */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { key: "materials", label: "الخامات", icon: "🪵", total: totalMaterials },
                { key: "accessories", label: "الإكسسوارات", icon: "✨", total: totalAccessories },
                { key: "labor", label: "العمالة", icon: "🔨", total: totalLabor },
                { key: "transport", label: "النقل", icon: "🚚", total: totalTransport },
              ].map(cat => (
                <div
                  key={cat.key}
                  onClick={() => setQuotationExplainedCategories(prev => {
                    const next = new Set(prev);
                    if (next.has(cat.key)) next.delete(cat.key);
                    else next.add(cat.key);
                    return next;
                  })}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                    quotationExplainedCategories.has(cat.key)
                      ? "border-green-500 bg-green-900/20"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-500"
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-sm font-semibold text-white">{cat.label}</div>
                  <div className="text-yellow-400 text-sm font-bold mt-1">{cat.total.toLocaleString()} ج</div>
                  {quotationExplainedCategories.has(cat.key) && <div className="text-green-400 text-xs mt-1">✅ تم الشرح</div>}
                </div>
              ))}
            </div>

            {/* Items table */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-2 text-right text-gray-300">البند</th>
                    <th className="px-4 py-2 text-center text-gray-300">الفئة</th>
                    <th className="px-4 py-2 text-center text-gray-300">السعر</th>
                    <th className="px-4 py-2 text-center text-gray-300">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationItems.map(item => (
                    <tr key={item.id} className={`border-t border-gray-700 ${item.removed ? "opacity-40" : ""}`}>
                      <td className="px-4 py-2 text-white">{item.name}</td>
                      <td className="px-4 py-2 text-center">
                        <Badge className={`text-xs ${
                          item.category === "materials" ? "bg-blue-700" :
                          item.category === "accessories" ? "bg-purple-700" :
                          item.category === "labor" ? "bg-orange-700" : "bg-gray-600"
                        }`}>
                          {item.category === "materials" ? "خامات" :
                           item.category === "accessories" ? "إكسسوارات" :
                           item.category === "labor" ? "عمالة" : "نقل"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-center text-yellow-400 font-semibold">
                        {item.price.toLocaleString()} ج
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => setQuotationItems(prev => prev.map(i => i.id === item.id ? { ...i, removed: !i.removed } : i))}
                          className={`text-xs px-2 py-1 rounded ${item.removed ? "bg-green-800 text-green-300" : "bg-red-900/50 text-red-400 hover:bg-red-800"}`}
                        >
                          {item.removed ? "استعادة" : "حذف"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 bg-gray-800 rounded-xl p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>الخامات</span><span className="text-white">{totalMaterials.toLocaleString()} ج</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>الإكسسوارات</span><span className="text-white">{totalAccessories.toLocaleString()} ج</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>العمالة</span><span className="text-white">{totalLabor.toLocaleString()} ج</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>النقل</span><span className="text-white">{totalTransport.toLocaleString()} ج</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-600 pt-2 mt-2">
                  <span className="text-yellow-400">الإجمالي</span>
                  <span className="text-yellow-400">{grandTotal.toLocaleString()} ج</span>
                </div>
              </div>
            </div>

            <StepActions
              onNext={saveAndAdvance}
              onBack={() => setCurrentStep(3)}
              nextDisabled={quotationExplainedCategories.size < 4}
              nextLabel="الانتقال لمعالجة الاعتراضات →"
            />
          </StepCard>
        )}

        {/* ===== STEP 5: OBJECTION HANDLING ===== */}
        {currentStep === 5 && (
          <StepCard title="💬 معالجة الاعتراضات" subtitle="سجّل كل اعتراض وردّ المهندس وردّ فعل العميل">
            {/* Add objection form */}
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-3">➕ تسجيل اعتراض جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">نوع الاعتراض</label>
                  <select
                    value={newObjectionType}
                    onChange={e => setNewObjectionType(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    {Object.entries(OBJECTION_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">البند المرتبط (اختياري)</label>
                  <Input
                    value={newObjectionItem}
                    onChange={e => setNewObjectionItem(e.target.value)}
                    placeholder="مثال: رسوم النقل"
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">رد المهندس</label>
                  <Input
                    value={newObjectionResponse}
                    onChange={e => setNewObjectionResponse(e.target.value)}
                    placeholder="الرد على الاعتراض..."
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ردّ فعل العميل</label>
                  <select
                    value={newObjectionReaction}
                    onChange={e => setNewObjectionReaction(e.target.value as any)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="accepted">✅ قبل</option>
                    <option value="still_hesitant">🤔 لا يزال مترددًا</option>
                    <option value="rejected">❌ رفض</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleAddObjection}
                className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                disabled={logObjectionMut.isPending}
              >
                تسجيل الاعتراض
              </Button>
            </div>

            {/* Objections list */}
            {objections.length > 0 && (
              <div className="space-y-2">
                {objections.map(obj => (
                  <div key={obj.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{OBJECTION_TYPES[obj.type]}</span>
                      <Badge className={`text-xs ${
                        obj.clientReaction === "accepted" ? "bg-green-700" :
                        obj.clientReaction === "rejected" ? "bg-red-700" : "bg-yellow-700"
                      }`}>
                        {obj.clientReaction === "accepted" ? "قبل" :
                         obj.clientReaction === "rejected" ? "رفض" : "متردد"}
                      </Badge>
                    </div>
                    {obj.relatedItem && <p className="text-xs text-gray-400">البند: {obj.relatedItem}</p>}
                    {obj.engineerResponse && <p className="text-xs text-gray-300 mt-1">الرد: {obj.engineerResponse}</p>}
                  </div>
                ))}
              </div>
            )}

            {objections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد اعتراضات مسجلة بعد</p>
                <p className="text-sm mt-1">يمكنك الانتقال للخطوة التالية إذا لم يكن هناك اعتراضات</p>
              </div>
            )}

            <StepActions
              onNext={saveAndAdvance}
              onBack={() => setCurrentStep(4)}
              nextLabel="الانتقال لتعديل العرض →"
            />
          </StepCard>
        )}

        {/* ===== STEP 6: DYNAMIC QUOTATION UPDATES ===== */}
        {currentStep === 6 && (
          <StepCard title="✏️ تعديل العرض الديناميكي" subtitle="سجّل كل تعديل على العرض مع الأسعار قبل وبعد">
            {/* Add change form */}
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-3">➕ تسجيل تعديل جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">نوع التعديل</label>
                  <select
                    value={newChangeType}
                    onChange={e => setNewChangeType(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    {Object.entries(CHANGE_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">اسم البند</label>
                  <Input
                    value={newChangeItem}
                    onChange={e => setNewChangeItem(e.target.value)}
                    placeholder="مثال: درج سوفت كلوز"
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">السعر قبل (جنيه)</label>
                  <Input
                    type="number"
                    value={newChangeBefore}
                    onChange={e => setNewChangeBefore(e.target.value)}
                    placeholder="106500"
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">السعر بعد (جنيه)</label>
                  <Input
                    type="number"
                    value={newChangeAfter}
                    onChange={e => setNewChangeAfter(e.target.value)}
                    placeholder="100000"
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">تفاصيل إضافية</label>
                  <Input
                    value={newChangeDetail}
                    onChange={e => setNewChangeDetail(e.target.value)}
                    placeholder="مثال: خصم 5% على الإجمالي"
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddChange}
                className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                disabled={logChangeMut.isPending}
              >
                تسجيل التعديل
              </Button>
            </div>

            {/* Changes log */}
            {changes.length > 0 && (
              <div className="space-y-2 mb-4">
                <h3 className="text-white font-semibold text-sm">سجل التعديلات:</h3>
                {changes.map(ch => (
                  <div key={ch.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center justify-between">
                    <div>
                      <span className="text-white text-sm font-medium">{CHANGE_TYPES[ch.changeType]}</span>
                      {ch.itemName && <span className="text-gray-400 text-xs mr-2">— {ch.itemName}</span>}
                      {ch.detail && <p className="text-xs text-gray-400 mt-0.5">{ch.detail}</p>}
                    </div>
                    <div className="text-left">
                      <div className="text-red-400 text-xs line-through">{ch.beforePrice.toLocaleString()} ج</div>
                      <div className="text-green-400 text-sm font-bold">{ch.afterPrice.toLocaleString()} ج</div>
                      <div className="text-gray-400 text-xs">
                        وفر: {(ch.beforePrice - ch.afterPrice).toLocaleString()} ج
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Final totals */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between text-gray-300 mb-2">
                <span>الإجمالي الأصلي</span>
                <span>{grandTotal.toLocaleString()} ج</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-red-400 mb-2">
                  <span>إجمالي الخصومات</span>
                  <span>- {totalDiscount.toLocaleString()} ج</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold border-t border-gray-600 pt-2">
                <span className="text-yellow-400">الإجمالي النهائي</span>
                <span className="text-yellow-400">{(grandTotal - totalDiscount).toLocaleString()} ج</span>
              </div>
            </div>

            <StepActions
              onNext={saveAndAdvance}
              onBack={() => setCurrentStep(5)}
              nextLabel="الانتقال للإغلاق →"
            />
          </StepCard>
        )}

        {/* ===== STEP 7: CLOSING ===== */}
        {currentStep === 7 && (
          <StepCard title="🎯 إغلاق الجلسة" subtitle="سجّل النتيجة النهائية والخطوة التالية">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <SummaryCard label="الإجمالي الأصلي" value={`${grandTotal.toLocaleString()} ج`} color="blue" />
              <SummaryCard label="إجمالي الخصومات" value={`${totalDiscount.toLocaleString()} ج`} color="red" />
              <SummaryCard label="الإجمالي النهائي" value={`${(grandTotal - totalDiscount).toLocaleString()} ج`} color="yellow" />
              <SummaryCard label="إكسسوارات مقبولة" value={`${approvedAccessoriesTotal.toLocaleString()} ج`} color="green" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">حالة الإغلاق</label>
                <div className="space-y-2">
                  {[
                    { v: "ready_to_close", label: "✅ جاهز للإغلاق", color: "green" },
                    { v: "needs_revision", label: "📝 يحتاج مراجعة", color: "yellow" },
                    { v: "needs_time", label: "⏳ يحتاج وقتاً", color: "blue" },
                    { v: "lost", label: "❌ خسرنا الصفقة", color: "red" },
                  ].map(opt => (
                    <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="closingStatus"
                        value={opt.v}
                        checked={closingStatus === opt.v}
                        onChange={() => setClosingStatus(opt.v as any)}
                        className="accent-yellow-500"
                      />
                      <span className="text-white">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">الخطوة التالية</label>
                <div className="space-y-2">
                  {[
                    { v: "follow_up_call", label: "📞 متابعة هاتفية" },
                    { v: "send_revision", label: "📧 إرسال مراجعة" },
                    { v: "visit_showroom", label: "🏪 زيارة المعرض" },
                    { v: "apply_discount", label: "💰 تطبيق خصم" },
                    { v: "wait_for_decision", label: "⏳ انتظار القرار" },
                  ].map(opt => (
                    <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="nextAction"
                        value={opt.v}
                        checked={nextAction === opt.v}
                        onChange={() => setNextAction(opt.v as any)}
                        className="accent-yellow-500"
                      />
                      <span className="text-white">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(6)}
                className="border-gray-600 text-gray-300"
              >
                ← السابق
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completeSessionMut.isPending}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-3"
              >
                {completeSessionMut.isPending ? "جاري الحفظ..." : "🎯 إغلاق الجلسة وحفظ النتائج"}
              </Button>
            </div>
          </StepCard>
        )}
      </div>
    </div>
  );
}

// ===================== HELPER COMPONENTS =====================
function StepCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function StepActions({
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = "حفظ والمتابعة →",
}: {
  onNext: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-3 mt-6">
      {onBack && (
        <Button variant="outline" onClick={onBack} className="border-gray-600 text-gray-300">
          ← السابق
        </Button>
      )}
      <Button
        onClick={onNext}
        disabled={nextDisabled}
        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold disabled:opacity-40"
      >
        {nextLabel}
      </Button>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-700/30 bg-blue-900/20 text-blue-400",
    red: "border-red-700/30 bg-red-900/20 text-red-400",
    yellow: "border-yellow-700/30 bg-yellow-900/20 text-yellow-400",
    green: "border-green-700/30 bg-green-900/20 text-green-400",
  };
  return (
    <div className={`border rounded-xl p-3 text-center ${colorMap[color]}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
