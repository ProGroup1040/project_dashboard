import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ArrowLeft, Utensils, Sofa, Layers, Shirt, Palette, Settings, TrendingUp, Package, Wrench, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Brand Definitions ────────────────────────────────────────────────────────
const BRANDS = [
  {
    key: "professor_kitchens",
    name: "Professor Kitchens",
    nameAr: "بروفيسور كيتشنز",
    tagline: "مطابخ احترافية بمعايير عالمية",
    color: "from-amber-900 to-amber-700",
    accentColor: "bg-amber-600",
    borderColor: "border-amber-600",
    textColor: "text-amber-600",
    icon: Utensils,
    services: [
      {
        key: "kitchens",
        nameAr: "المطابخ",
        description: "نظام التسعير التفاعلي الكامل للمطابخ",
        icon: Utensils,
        route: "/brand/professor_kitchens/kitchens",
        available: true,
      },
      {
        key: "appliances",
        nameAr: "الأجهزة المدمجة",
        description: "أجهزة مدمجة وإكسسوارات المطبخ",
        icon: Settings,
        route: "/brand/professor_kitchens/appliances",
        available: false,
      },
      {
        key: "upgrades",
        nameAr: "الترقيات والإضافات",
        description: "ترقيات الخامات والإكسسوارات المميزة",
        icon: TrendingUp,
        route: "/brand/professor_kitchens/upgrades",
        available: false,
      },
    ],
  },
  {
    key: "promax_furniture",
    name: "ProMax Furniture",
    nameAr: "بروماكس فيرنتشر",
    tagline: "أثاث مخصص بجودة استثنائية",
    color: "from-slate-800 to-slate-600",
    accentColor: "bg-slate-600",
    borderColor: "border-slate-500",
    textColor: "text-slate-400",
    icon: Sofa,
    services: [
      {
        key: "living_room",
        nameAr: "غرف المعيشة",
        description: "أثاث غرف المعيشة والجلوس",
        icon: Sofa,
        route: "/brand/promax_furniture/living_room",
        available: false,
      },
      {
        key: "bedroom",
        nameAr: "غرف النوم",
        description: "غرف نوم كاملة ومخصصة",
        icon: Package,
        route: "/brand/promax_furniture/bedroom",
        available: false,
      },
    ],
  },
  {
    key: "pro_porcelain",
    name: "Pro Porcelain",
    nameAr: "برو بورسيلين",
    tagline: "بورسيلين وسيراميك للمشاريع الراقية",
    color: "from-stone-700 to-stone-500",
    accentColor: "bg-stone-500",
    borderColor: "border-stone-400",
    textColor: "text-stone-400",
    icon: Layers,
    services: [
      {
        key: "flooring",
        nameAr: "أرضيات",
        description: "بورسيلين وسيراميك للأرضيات",
        icon: Layers,
        route: "/brand/pro_porcelain/flooring",
        available: false,
      },
      {
        key: "walls",
        nameAr: "تكسيات وجدران",
        description: "تكسيات حوائط وديكور",
        icon: Package,
        route: "/brand/pro_porcelain/walls",
        available: false,
      },
    ],
  },
  {
    key: "pro_dressing",
    name: "Pro Dressing",
    nameAr: "برو دريسينج",
    tagline: "غرف ملابس وتخزين ذكي",
    color: "from-purple-900 to-purple-700",
    accentColor: "bg-purple-600",
    borderColor: "border-purple-500",
    textColor: "text-purple-400",
    icon: Shirt,
    services: [
      {
        key: "dressing_rooms",
        nameAr: "غرف الملابس",
        description: "تصميم وتسعير غرف الملابس",
        icon: Shirt,
        route: "/brand/pro_dressing/dressing_rooms",
        available: false,
      },
      {
        key: "storage",
        nameAr: "وحدات التخزين",
        description: "وحدات تخزين ذكية ومخصصة",
        icon: Package,
        route: "/brand/pro_dressing/storage",
        available: false,
      },
    ],
  },
  {
    key: "pro_design_studio",
    name: "Pro Design Studio",
    nameAr: "برو ديزاين ستوديو",
    tagline: "استشارات التصميم الداخلي المتكاملة",
    color: "from-rose-900 to-rose-700",
    accentColor: "bg-rose-600",
    borderColor: "border-rose-500",
    textColor: "text-rose-400",
    icon: Palette,
    services: [
      {
        key: "interior_design",
        nameAr: "التصميم الداخلي",
        description: "خدمات التصميم الداخلي الكاملة",
        icon: Palette,
        route: "/brand/pro_design_studio/interior_design",
        available: false,
      },
      {
        key: "finishing",
        nameAr: "التشطيبات",
        description: "إدارة مشاريع التشطيبات",
        icon: Wrench,
        route: "/brand/pro_design_studio/finishing",
        available: false,
      },
      {
        key: "transport",
        nameAr: "النقل والتركيب",
        description: "خدمات النقل والتركيب والتوصيل",
        icon: Truck,
        route: "/brand/pro_design_studio/transport",
        available: false,
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function BrandHub() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const activeBrand = BRANDS.find(b => b.key === selectedBrand);

  const handleServiceClick = (route: string, available: boolean) => {
    if (!available) return;
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedBrand && (
              <button
                onClick={() => setSelectedBrand(null)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">
                {selectedBrand ? activeBrand?.nameAr : "Professor Company"}
              </h1>
              <p className="text-xs text-white/50">
                {selectedBrand ? activeBrand?.tagline : "اختر البراند للبدء"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 bg-white/5 px-3 py-1 rounded-full">
              {selectedBrand ? "اختر الخدمة" : "Step 1: اختر البراند"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {!selectedBrand ? (
          /* ── Brand Selection ── */
          <>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-3">اختر البراند</h2>
              <p className="text-white/50 text-lg">كل براند نظام مستقل بمحرك تسعير وبلايبوك وسكريبت مبيعات خاص به</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BRANDS.map((brand) => {
                const Icon = brand.icon;
                const availableCount = brand.services.filter(s => s.available).length;
                return (
                  <button
                    key={brand.key}
                    onClick={() => setSelectedBrand(brand.key)}
                    className={`group relative text-right p-6 rounded-2xl border ${brand.borderColor} bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
                  >
                    {/* Brand accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${brand.color}`} />

                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${brand.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {availableCount > 0 && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          {availableCount} خدمة متاحة
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{brand.nameAr}</h3>
                    <p className="text-sm text-white/40 mb-1">{brand.name}</p>
                    <p className="text-sm text-white/60 mb-4">{brand.tagline}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/30">{brand.services.length} خدمات</span>
                      <ChevronRight className={`w-5 h-5 ${brand.textColor} group-hover:translate-x-[-4px] transition-transform`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* ── Service Selection ── */
          <>
            <div className="text-center mb-12">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r ${activeBrand?.color} mb-4`}>
                {activeBrand && <activeBrand.icon className="w-6 h-6 text-white" />}
                <span className="text-xl font-bold text-white">{activeBrand?.nameAr}</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">اختر الخدمة</h2>
              <p className="text-white/50">كل خدمة تحتوي على نظام تسعير مستقل</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {activeBrand?.services.map((service) => {
                const ServiceIcon = service.icon;
                return (
                  <button
                    key={service.key}
                    onClick={() => handleServiceClick(service.route, service.available)}
                    disabled={!service.available}
                    className={`group relative text-right p-6 rounded-2xl border transition-all duration-300 ${
                      service.available
                        ? `${activeBrand.borderColor} bg-white/5 hover:bg-white/10 hover:scale-[1.02] cursor-pointer`
                        : "border-white/10 bg-white/2 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${service.available ? `bg-gradient-to-br ${activeBrand.color}` : "bg-white/10"}`}>
                        <ServiceIcon className="w-6 h-6 text-white" />
                      </div>
                      {service.available ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">متاح</span>
                      ) : (
                        <span className="text-xs bg-white/10 text-white/30 px-2 py-1 rounded-full">قريباً</span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{service.nameAr}</h3>
                    <p className="text-sm text-white/60 mb-4">{service.description}</p>

                    {service.available && (
                      <div className="flex items-center justify-end">
                        <ChevronRight className={`w-5 h-5 ${activeBrand.textColor} group-hover:translate-x-[-4px] transition-transform`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-white">
                  {activeBrand?.services.filter(s => s.available).length}
                </div>
                <div className="text-xs text-white/40 mt-1">خدمات متاحة</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-white">
                  {activeBrand?.services.length}
                </div>
                <div className="text-xs text-white/40 mt-1">إجمالي الخدمات</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-amber-400">نشط</div>
                <div className="text-xs text-white/40 mt-1">حالة البراند</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
