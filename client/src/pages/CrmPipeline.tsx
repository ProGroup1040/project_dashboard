import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DarkSelect, DarkOption } from "@/components/DarkSelect";

// ===================== TYPES =====================
type PipelineStage =
  | "new_lead"
  | "design_in_progress"
  | "design_approved"
  | "negotiation_session"
  | "proposal"
  | "closing"
  | "won"
  | "lost";

type ProjectType = "kitchen" | "dressing" | "furniture" | "finishing" | "smart_home" | "full";

const STAGE_LABELS: Record<PipelineStage, string> = {
  new_lead: "عميل جديد",
  design_in_progress: "التصميم قيد العمل",
  design_approved: "التصميم معتمد",
  negotiation_session: "جلسة التفاوض",
  proposal: "العرض المقدم",
  closing: "الإغلاق",
  won: "تم الإغلاق ✅",
  lost: "خسرنا ❌",
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  new_lead: "bg-blue-900/30 border-blue-700/40",
  design_in_progress: "bg-purple-900/30 border-purple-700/40",
  design_approved: "bg-indigo-900/30 border-indigo-700/40",
  negotiation_session: "bg-yellow-900/30 border-yellow-700/40",
  proposal: "bg-orange-900/30 border-orange-700/40",
  closing: "bg-red-900/30 border-red-700/40",
  won: "bg-green-900/30 border-green-700/40",
  lost: "bg-gray-900/30 border-gray-700/40",
};

const STAGE_BADGE_COLORS: Record<PipelineStage, string> = {
  new_lead: "bg-blue-700",
  design_in_progress: "bg-purple-700",
  design_approved: "bg-indigo-700",
  negotiation_session: "bg-yellow-700 text-black",
  proposal: "bg-orange-700",
  closing: "bg-red-700",
  won: "bg-green-700",
  lost: "bg-gray-700",
};

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  kitchen: "🍳 مطبخ",
  dressing: "👗 دريسنج",
  furniture: "🛋️ أثاث",
  finishing: "🏗️ تشطيب",
  smart_home: "🏠 سمارت هوم",
  full: "🏢 مشروع كامل",
};

const ALL_STAGES: PipelineStage[] = [
  "new_lead",
  "design_in_progress",
  "design_approved",
  "negotiation_session",
  "proposal",
  "closing",
  "won",
  "lost",
];

// ===================== MAIN COMPONENT =====================
export default function CrmPipeline() {
  const [, navigate] = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");
  const [filterStage, setFilterStage] = useState<PipelineStage | "all">("all");

  // Form state
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newProjectType, setNewProjectType] = useState<ProjectType>("kitchen");
  const [newQuotationValue, setNewQuotationValue] = useState("");
  const [newEngineer, setNewEngineer] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Queries
  const { data: leads = [], refetch } = trpc.crm.getLeads.useQuery();
  const { data: stats } = trpc.crm.getStats.useQuery();

  // Mutations
  const createLeadMut = trpc.crm.createLead.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddForm(false);
      resetForm();
      toast.success("تم إضافة العميل بنجاح");
    },
    onError: () => toast.error("فشل إضافة العميل"),
  });

  const updateStageMut = trpc.crm.updateStage.useMutation({
    onSuccess: () => { refetch(); toast.success("تم تحديث المرحلة"); },
    onError: () => toast.error("فشل تحديث المرحلة"),
  });

  const createSessionMut = trpc.negotiation.createSession.useMutation({
    onSuccess: (data) => {
      navigate(`/negotiation/${selectedLead?.id}/${data.id}`);
    },
    onError: () => toast.error("فشل بدء الجلسة"),
  });

  function resetForm() {
    setNewClientName("");
    setNewClientPhone("");
    setNewProjectType("kitchen");
    setNewQuotationValue("");
    setNewEngineer("");
    setNewNotes("");
  }

  async function handleCreateLead() {
    if (!newClientName.trim()) { toast.error("يرجى إدخال اسم العميل"); return; }
    await createLeadMut.mutateAsync({
      clientName: newClientName,
      clientPhone: newClientPhone || undefined,
      projectType: newProjectType,
      quotationValue: newQuotationValue ? parseInt(newQuotationValue) : undefined,
      assignedEngineer: newEngineer || undefined,
      notes: newNotes || undefined,
    });
  }

  async function handleStartNegotiation(lead: any) {
    setSelectedLead(lead);
    await createSessionMut.mutateAsync({ leadId: lead.id, engineerName: lead.assignedEngineer });
  }

  const filteredLeads = filterStage === "all" ? leads : leads.filter((l: any) => l.pipelineStage === filterStage);

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Header */}
      <div className="bg-gray-900 border-b border-yellow-500/20 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img src="/professor_logo_clean.png" alt="Pro Group" className="h-10" />
            <div>
              <h1 className="text-yellow-400 font-bold text-xl">CRM Pipeline</h1>
              <p className="text-gray-400 text-sm">إدارة العملاء ومتابعة الصفقات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              + إضافة عميل
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="border-gray-600 text-gray-300"
            >
              ← الرئيسية
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-gray-900/50 border-b border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-4 overflow-x-auto pb-1">
              <StatPill label="الكل" value={(stats as any).total || 0} color="gray" onClick={() => setFilterStage("all")} active={filterStage === "all"} />
              <StatPill label="جديد" value={(stats as any).new_lead || 0} color="blue" onClick={() => setFilterStage("new_lead")} active={filterStage === "new_lead"} />
              <StatPill label="تصميم" value={(stats as any).design_in_progress || 0} color="purple" onClick={() => setFilterStage("design_in_progress")} active={filterStage === "design_in_progress"} />
              <StatPill label="تفاوض" value={(stats as any).negotiation_session || 0} color="yellow" onClick={() => setFilterStage("negotiation_session")} active={filterStage === "negotiation_session"} />
              <StatPill label="مغلق ✅" value={(stats as any).won || 0} color="green" onClick={() => setFilterStage("won")} active={filterStage === "won"} />
              <StatPill label="خسرنا ❌" value={(stats as any).lost || 0} color="red" onClick={() => setFilterStage("lost")} active={filterStage === "lost"} />
              <div className="flex items-center gap-1 bg-yellow-900/30 border border-yellow-700/30 rounded-full px-3 py-1 whitespace-nowrap">
                <span className="text-yellow-400 text-xs">💰</span>
                <span className="text-yellow-400 text-sm font-bold">{((stats as any).totalValue || 0).toLocaleString()} ج</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Add Lead Form */}
        {showAddForm && (
          <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">➕ إضافة عميل جديد</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">اسم العميل *</label>
                <Input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="م. أحمد محمد" className="bg-gray-800 border-gray-600 text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">رقم الهاتف</label>
                <Input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="01xxxxxxxxx" className="bg-gray-800 border-gray-600 text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">نوع المشروع</label>
                <DarkSelect value={newProjectType} onChange={e => setNewProjectType(e.target.value as ProjectType)} className="w-full px-3 py-2 text-sm">
                  {Object.entries(PROJECT_TYPE_LABELS).map(([k, v]) => <DarkOption key={k} value={k}>{v}</DarkOption>)}
                </DarkSelect>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">قيمة العرض (جنيه)</label>
                <Input type="number" value={newQuotationValue} onChange={e => setNewQuotationValue(e.target.value)} placeholder="500000" className="bg-gray-800 border-gray-600 text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">المهندس المسؤول</label>
                <Input value={newEngineer} onChange={e => setNewEngineer(e.target.value)} placeholder="م. سارة أحمد" className="bg-gray-800 border-gray-600 text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">ملاحظات</label>
                <Input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="ملاحظات إضافية..." className="bg-gray-800 border-gray-600 text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleCreateLead} disabled={createLeadMut.isPending} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                {createLeadMut.isPending ? "جاري الحفظ..." : "حفظ العميل"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="border-gray-600 text-gray-300">إلغاء</Button>
            </div>
          </div>
        )}

        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg">لا يوجد عملاء بعد</p>
            <p className="text-sm mt-2">اضغط على "إضافة عميل" لبدء تتبع العملاء</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead: any) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onStageChange={(stage) => updateStageMut.mutate({ id: lead.id, stage })}
                onStartNegotiation={() => handleStartNegotiation(lead)}
                isStartingSession={createSessionMut.isPending && selectedLead?.id === lead.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== LEAD CARD =====================
function LeadCard({
  lead,
  onStageChange,
  onStartNegotiation,
  isStartingSession,
}: {
  lead: any;
  onStageChange: (stage: PipelineStage) => void;
  onStartNegotiation: () => void;
  isStartingSession: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${STAGE_COLORS[lead.pipelineStage as PipelineStage] || "bg-gray-900 border-gray-700"}`}>
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">{lead.clientName}</h3>
                <Badge className={`text-xs ${STAGE_BADGE_COLORS[lead.pipelineStage as PipelineStage] || "bg-gray-700"}`}>
                  {STAGE_LABELS[lead.pipelineStage as PipelineStage]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                <span>{lead.leadNumber}</span>
                {lead.clientPhone && <span>📞 {lead.clientPhone}</span>}
                <span>{PROJECT_TYPE_LABELS[lead.projectType as ProjectType]}</span>
                {lead.assignedEngineer && <span>👤 {lead.assignedEngineer}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lead.quotationValue > 0 && (
              <span className="text-yellow-400 font-bold text-sm">
                {lead.quotationValue.toLocaleString()} ج
              </span>
            )}
            <span className="text-gray-500 text-sm">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-700/50 p-4 bg-gray-900/50">
          {lead.notes && (
            <p className="text-gray-300 text-sm mb-3">📝 {lead.notes}</p>
          )}

          {/* Stage Change */}
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">تغيير المرحلة:</label>
            <div className="flex flex-wrap gap-1">
              {ALL_STAGES.map(stage => (
                <button
                  key={stage}
                  onClick={() => onStageChange(stage)}
                  className={`text-xs px-2 py-1 rounded-full transition-all ${
                    lead.pipelineStage === stage
                      ? "bg-yellow-500 text-black font-bold"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={onStartNegotiation}
              disabled={isStartingSession}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-xs"
            >
              {isStartingSession ? "جاري البدء..." : "🚀 بدء جلسة تفاوض"}
            </Button>
            <div className="text-xs text-gray-500 self-center">
              {new Date(lead.createdAt).toLocaleDateString("ar-EG")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== STAT PILL =====================
function StatPill({
  label,
  value,
  color,
  onClick,
  active,
}: {
  label: string;
  value: number;
  color: string;
  onClick: () => void;
  active: boolean;
}) {
  const colorMap: Record<string, string> = {
    gray: "bg-gray-700 text-gray-300",
    blue: "bg-blue-700 text-white",
    purple: "bg-purple-700 text-white",
    yellow: "bg-yellow-700 text-black",
    green: "bg-green-700 text-white",
    red: "bg-red-700 text-white",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm whitespace-nowrap transition-all border-2 ${
        active ? "border-yellow-500" : "border-transparent"
      } ${colorMap[color] || "bg-gray-700 text-gray-300"}`}
    >
      <span className="font-bold">{value}</span>
      <span className="text-xs opacity-80">{label}</span>
    </button>
  );
}
