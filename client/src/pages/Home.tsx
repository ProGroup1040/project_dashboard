import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import ProjectLogin from "./ProjectLogin";

// ===================== CONTACT HELPERS =====================
const formatPhoneDisplay = (phone: string) => {
  // Convert international format to display format
  if (phone.startsWith("20")) {
    const local = "0" + phone.slice(2);
    return local.replace(/(\d{4})(\d{4})(\d{3})/, "$1 $2 $3");
  }
  return phone;
};

const WhatsAppButton = ({ whatsapp, name, size = "sm" }: { whatsapp: string; name: string; size?: "sm" | "xs" }) => {
  const msg = encodeURIComponent(`مرحباً أنا أتواصل بخصوص مشروع تشطيب شقة مدينتي - Professor`);
  const url = `https://wa.me/${whatsapp}?text=${msg}`;
  const btnSize = size === "xs" ? { fontSize: "0.6rem", padding: "2px 6px", gap: "3px" } : { fontSize: "0.68rem", padding: "3px 8px", gap: "4px" };
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#25D366",
        color: "#fff",
        borderRadius: "999px",
        textDecoration: "none",
        fontWeight: 700,
        fontFamily: "'Cairo', sans-serif",
        marginTop: "0.35rem",
        ...btnSize,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      واتساب
    </a>
  );
};

const PhoneLink = ({ phone, size = "sm" }: { phone: string; size?: "sm" | "xs" }) => {
  const btnSize = size === "xs" ? { fontSize: "0.6rem", padding: "2px 6px", gap: "3px" } : { fontSize: "0.68rem", padding: "3px 8px", gap: "4px" };
  return (
    <a
      href={`tel:${phone}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "oklch(0.25 0.02 75)",
        border: "1px solid oklch(0.78 0.12 75 / 0.4)",
        color: "oklch(0.78 0.12 75)",
        borderRadius: "999px",
        textDecoration: "none",
        fontWeight: 600,
        fontFamily: "'Cairo', sans-serif",
        marginTop: "0.35rem",
        direction: "ltr",
        ...btnSize,
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14h-.08z"/>
      </svg>
      {formatPhoneDisplay(phone)}
    </a>
  );
};

type ProjectUser = {
  id: number;
  username: string;
  displayName: string;
  role: "admin" | "engineer" | "aftersales" | "client";
};

// ===================== CDN BASE =====================
const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663366992461/mRvpKEsVM97L32dYU7ka6B";

// ===================== DATA =====================

// ===================== TEAM DATA (Hierarchical) =====================
type TeamMember = {
  id: string;
  name: string;
  title: string;
  role: string;
  duties: string[];
  img: string | null;
  level: number;
  department: string;
  color: string;
  phone?: string;       // رقم الهاتف للاتصال
  whatsapp?: string;    // رقم واتساب (بدون مسافات أو رموز، مع كود الدولة)
};

const teamData: TeamMember[] = [
  // Level 1 - Top Leadership
  {
    id: "t1",
    name: "د. عبد الرحمن ممدوح",
    title: "رئيس مجلس الإدارة",
    role: "القيادة والإشراف",
    duties: [
      "الإشراف العام على استراتيجية المشروع",
      "متابعة الجودة والتسليم النهائي",
      "إدارة الاجتماعات الرئيسية المرتبطة بتنفيذ بنود المشروع",
    ],
    img: `${CDN}/dr_abdulrahman_4ef9e1e0.png`,
    level: 1,
    department: "القيادة",
    color: "oklch(0.78 0.12 75)",
    phone: "01022624007",
    whatsapp: "201092925649",
  },
  // Level 1.5 - Project Management (New Level 2)
  {
    id: "pm1",
    name: "بشمهندس محمد محمود عبد العاطي",
    title: "مدير المشروع",
    role: "إدارة المشروع",
    duties: [
      "الإشراف الكامل على تنفيذ المشروع من البداية حتى التسليم النهائي",
      "التنسيق بين جميع أقسام الفريق لضمان سير العمل وفق الجدول الزمني",
      "متابعة جودة التنفيذ في الموقع ومطابقتها للمواصفات والرسومات المعتمدة",
      "إدارة اجتماعات المشروع الدورية وإعداد تقارير التقدم للإدارة والعميل",
      "حل المشكلات الطارئة واتخاذ القرارات التشغيلية السريعة في الموقع",
      "ضمان الالتزام بالميزانية المحددة ومتابعة تكاليف التنفيذ",
    ],
    img: `${CDN}/1000794536_926d604c.jpg`,
    level: 1.5,
    department: "إدارة المشروع",
    color: "oklch(0.75 0.11 75)",
    phone: "201221503192",
    whatsapp: "201221503192",
  },
  {
    id: "pm2",
    name: "بشمهندس مصطفى قنديل",
    title: "مهندس الديكور والإشراف",
    role: "الإشراف الميداني",
    duties: [
      "الإشراف الميداني المباشر على أعمال المقاولين في الموقع",
      "التسليم الدقيق لكل بند من بنود المشروع في الموقع وفق المواصفات",
      "متابعة جودة التشطيبات والتأكد من مطابقتها للتصميم المعتمد",
      "تنسيق جداول العمل بين المقاولين المختلفين لتفادي التعارض",
      "رصد أي انحرافات في التنفيذ والإبلاغ الفوري لاتخاذ الإجراءات التصحيحية",
      "إعداد محاضر الاستلام والتسليم لكل مرحلة من مراحل التنفيذ",
    ],
    img: `${CDN}/1000798929_85f351bb.jpg`,
    level: 1.5,
    department: "إدارة المشروع",
    color: "oklch(0.75 0.11 75)",
    phone: "201278729335",
    whatsapp: "201278729335",
  },
  // Level 2 - Direct Reports
  {
    id: "t2",
    name: "أ. كاميليا",
    title: "Personal Assistant to Chairman",
    role: "الدعم الإداري",
    duties: [
      "تنسيق جدول أعمال واجتماعات رئيس مجلس الإدارة",
      "حلقة الوصل بين الإدارة العليا وباقي الأقسام",
      "متابعة تنفيذ التكليفات الإدارية لضمان سير العمل",
      "إدارة المراسلات والتقارير السرية للمشروع",
    ],
    img: `${CDN}/kamilia_0e6a6c5a.png`,
    level: 2,
    department: "الإدارة",
    color: "oklch(0.72 0.1 75)",
    phone: "201222151042",
    whatsapp: "201222151042",
  },
  {
    id: "t3",
    name: "م. آية إبراهيم",
    title: "مدير التصميم وتجربة العميل",
    role: "التصميم وتجربة العميل",
    duties: [
      "Account Manager: المسؤولة عن التواصل المباشر بين العميل وفريق العمل",
      "Admin Sales: تنسيق عروض الأسعار، إدارة ملف المشروع، والتعاقدات",
      "دعم المبيعات: تقديم الدعم لمهندسي المبيعات أثناء المتابعة",
    ],
    img: `${CDN}/aya_ibrahim_4b909945.png`,
    level: 2,
    department: "التصميم",
    color: "oklch(0.72 0.1 75)",
    phone: "201019948401",
    whatsapp: "201019948401",
  },
  {
    id: "t4",
    name: "أ. محمد عادل",
    title: "مدير الشؤون المالية والإدارية",
    role: "الشؤون المالية والإدارية",
    duties: [
      "الإشراف الكامل على منظومة التوريدات وسلاسل الإمداد",
      "مراقبة تكاليف المشروع وإدارة الدفعات المالية",
      "إدارة التخطيط المالي والموازنات لضمان كفاءة الصرف",
      "الإشراف على الشؤون الإدارية وتنسيق العمليات التشغيلية",
    ],
    img: `${CDN}/mohammed_adel_cff50a1a.png`,
    level: 2,
    department: "المالية",
    color: "oklch(0.72 0.1 75)",
    phone: "201224887373",
    whatsapp: "201224887373",
  },
  // Level 3 - Technical Team
  {
    id: "t5",
    name: "م. أماني",
    title: "مدير المكتب الفني",
    role: "المكتب الفني",
    duties: [
      "إصدار الرسومات التنفيذية (Shop Drawings) لكافة بنود المشروع بدقة عالية",
      "متابعة الرسومات الفنية وتفاصيلها لضمان مطابقتها للمواصفات قبل التنفيذ",
      "تقديم الدعم الفني الكامل لفريق الإنتاج بالبيانات والقياسات اللازمة للتصنيع",
      "إعداد وحصر الكميات والمواصفات الفنية لضمان دقة التوريدات والتكاليف",
    ],
    img: `${CDN}/amani_a5474c5a.png`,
    level: 3,
    department: "التقني",
    color: "oklch(0.65 0.08 75)",
    phone: "201117339682",
    whatsapp: "201117339682",
  },
  {
    id: "t6",
    name: "م. أحمد ورداني",
    title: "مدير إدارة الإنتاج",
    role: "إدارة الإنتاج",
    duties: [
      "تنفيذ كافة أعمال الديكور والأخشاب والأثاث بأعلى معايير الجودة",
      "تنسيق واعتماد عينات الخامات والتشطيبات النهائية مع العميل",
      "الإشراف الكامل على مراحل تصنيع الأثاث لضمان مطابقته للتصميم",
      "متابعة الجدول الزمني للإنتاج والتركيب لضمان التسليم في الموعد المحدد",
    ],
    img: `${CDN}/ahmed_wardani_33ec4e0c.png`,
    level: 3,
    department: "التقني",
    color: "oklch(0.65 0.08 75)",
    phone: "201142944325",
    whatsapp: "201142944325",
  },
  {
    id: "t7",
    name: "م. بيشوي",
    title: "مهندس التصميم الداخلي",
    role: "التصميم الداخلي",
    duties: [
      "متابعة كافة التعديلات والتصميمات المطلوبة مع العميل",
      "إصدار لوحات التنفيذ وعمل حصر دقيق للكميات",
      "تقديم الرسم الفني والهندسي للمكتب الفني (حلقة الوصل الأساسية)",
      "متابعة التعديلات الفنية للرسومات واعتمادها مع العميل",
    ],
    img: `${CDN}/bishoy_c51b9679.png`,
    level: 3,
    department: "التصميم",
    color: "oklch(0.65 0.08 75)",
  },
  {
    id: "t8",
    name: "م. ريهام رشاد",
    title: "Sales Engineer",
    role: "مهندسة مبيعات وتصميم",
    duties: [
      "تصميم المطابخ وغرف الملابس (Dressing Rooms) بأحدث الأساليب العصرية",
      "تنسيق أكواد الألوان والخامات مع العميل لضمان التناغم البصري",
      "متابعة تنفيذ التصميمات المعتمدة لضمان دقة التفاصيل والجودة",
      "تقديم الاستشارات الفنية للعملاء لاختيار أنسب الحلول للمساحات",
    ],
    img: `${CDN}/reham_rashad_b8dc28f9.png`,
    level: 3,
    department: "المبيعات",
    color: "oklch(0.65 0.08 75)",
  },
  {
    id: "t9",
    name: "م. أحمد رجب",
    title: "مهندس البيع والمتابعة",
    role: "مهندس مبيعات ومتابعة",
    duties: [
      "المتابعة المستمرة والدورية مع العميل لتنسيق مواعيد الاجتماعات",
      "إعداد وتقديم عروض الأسعار التفصيلية ومناقشتها بوضوح",
      "التنسيق المباشر مع مهندسي التصميم لضمان تلبية كافة المتطلبات",
      "التعاون الكامل مع فريق المبيعات لضمان سلاسة سير العمل",
    ],
    img: `${CDN}/ahmed_ragab_b155a64c.png`,
    level: 3,
    department: "المبيعات",
    color: "oklch(0.65 0.08 75)",
    phone: "201060639096",
    whatsapp: "201060639096",
  },
  {
    id: "t10",
    name: "م. ملك",
    title: "مهندسة خدمة ما بعد البيع",
    role: "خدمة ما بعد البيع",
    duties: [
      "متابعة رضا العميل وتلقي الملاحظات والتقييمات بعد التسليم",
      "تنسيق أعمال الصيانة الدورية ومعالجة أي ملاحظات فنية طارئة",
      "إدارة تفعيل الضمان ومتابعة جودة الخامات والأعمال المنفذة",
      "الحفاظ على تواصل دائم لضمان تجربة سكنية مريحة ومستقرة",
    ],
    img: `${CDN}/malak_31d404e4.png`,
    level: 3,
    department: "الخدمات",
    color: "oklch(0.65 0.08 75)",
  },
  {
    id: "t11",
    name: "أ. ميلاد",
    title: "مدير إدارة الموارد البشرية",
    role: "HR Manager",
    duties: [
      "متابعة أداء فريق العمل بدقة أثناء تنفيذ وتقديم خدمات المشروع",
      "استقبال الملاحظات والتقييمات لضمان أعلى مستويات الجودة",
      "التواصل المباشر والفعال لحل أي عقبات قد تواجه سير العمل",
    ],
    img: `${CDN}/milad_9ecd7639.png`,
    level: 3,
    department: "الإدارة",
    color: "oklch(0.65 0.08 75)",
    phone: "201222459944",
    whatsapp: "201222459944",
  },
  // Level 4 - Support Team
  {
    id: "t12",
    name: "م. مارينا",
    title: "Sales & Design Engineer",
    role: "مهندسة مبيعات وتصميم",
    duties: [
      "تقديم الدعم الكامل والمستمر لإدارة المبيعات والتسويق",
      "متابعة تصميمات المشروع لضمان دقتها ومطابقتها للمواصفات",
      "تقديم الدعم الفني المتخصص لإدارة المبيعات والتصميم",
    ],
    img: `${CDN}/marina_c954b99a.png`,
    level: 4,
    department: "المبيعات",
    color: "oklch(0.58 0.06 75)",
  },
  {
    id: "t13",
    name: "م. جولي",
    title: "Sales & Design Engineer",
    role: "مهندسة مبيعات وتصميم",
    duties: [
      "تقديم الدعم الكامل والمستمر لإدارة المبيعات والتسويق",
      "متابعة تصميمات المشروع لضمان دقتها ومطابقتها للمواصفات",
      "تقديم الدعم الفني المتخصص لإدارة المبيعات والتصميم",
    ],
    img: `${CDN}/julia_a2e04e9f.png`,
    level: 4,
    department: "المبيعات",
    color: "oklch(0.58 0.06 75)",
  },
  {
    id: "t14",
    name: "م. حماد",
    title: "إدارة المبيعات والمشتريات",
    role: "مبيعات ومشتريات",
    duties: [
      "تقديم الدعم الفني والإداري اللازم لمهندسي إدارة المبيعات",
      "متابعة المشتريات الخارجية بدقة والتنسيق المستمر مع العميل",
    ],
    img: `${CDN}/hammad_e207f6ea.png`,
    level: 4,
    department: "المبيعات",
    color: "oklch(0.58 0.06 75)",
  },
  {
    id: "t15",
    name: "م. أحمد طنطاوي",
    title: "إدارة المبيعات والمشتريات",
    role: "مبيعات ومشتريات",
    duties: [
      "تقديم الدعم الفني والإداري اللازم لمهندسي إدارة المبيعات",
      "متابعة المشتريات الخارجية بدقة والتنسيق المستمر مع العميل",
    ],
    img: `${CDN}/ahmed_tantawi_1254dc41.png`,
    level: 4,
    department: "المبيعات",
    color: "oklch(0.58 0.06 75)",
    phone: "201062240353",
    whatsapp: "201062240353",
  },
  {
    id: "t16",
    name: "أ. محمد عبد الشافي",
    title: "محاسب تكاليف المشروع",
    role: "المحاسبة المالية",
    duties: [
      "متابعة التدفق النقدي للمشروعات وحسابات التكلفة بدقة",
      "تقديم فواتير الصرف ومراجعتها بشكل دوري",
      "تقديم الدعم المالي والاستشارات للعميل لضمان كفاءة الصرف",
    ],
    img: `${CDN}/mohammed_abdelshafi_26d86281.png`,
    level: 4,
    department: "المالية",
    color: "oklch(0.58 0.06 75)",
  },
  {
    id: "t17",
    name: "أ. رمضان إبراهيم",
    title: "محاسب مالي",
    role: "المحاسبة المالية",
    duties: [
      "متابعة حسابات المقاولين والموردين بدقة عالية",
      "إدارة حسابات المشتريات وضمان سلامة الإجراءات المالية",
      "متابعة الجدول الزمني المالي (Financial Timeline) للمشروع",
    ],
    img: `${CDN}/ramadan_b189a714.png`,
    level: 4,
    department: "المالية",
    color: "oklch(0.58 0.06 75)",
  },
  {
    id: "t18",
    name: "م. صقر الجمل",
    title: "مسؤول خطوط إنتاج النجارة والأثاث",
    role: "الإنتاج والتصنيع",
    duties: [
      "الإشراف الكامل على خطوط إنتاج النجارة وتصنيع الأثاث في المصنع",
      "مباشرة الفنيين والعمال داخل المصنع لضمان جودة ودقة الإنتاج",
      "الرد على كافة الاستفسارات الفنية المتعلقة بالفرش، الديكور، والأخشاب",
    ],
    img: `${CDN}/saqr_475f4d47.png`,
    level: 4,
    department: "الإنتاج",
    color: "oklch(0.58 0.06 75)",
  },
];

const projectContents = [
  { title: "مقايسة التشطيب", icon: "🔨", desc: "11 بند تشطيب شامل", section: "finishing" as const, img: `${CDN}/1000793481_a03f7ba6.jpg` },
  { title: "مقايسة الأثاث", icon: "🛋️", desc: "16 قطعة أثاث فاخرة", section: "furniture" as const, img: `${CDN}/2_98efd75e.png` },
  { title: "Smart Home System", icon: "🏡", desc: "خيارين للنظام الذكي", section: "smart" as const, img: `${CDN}/pasted_file_HV1FPk_image_2c18654b.png` },
  { title: "مقايسة الستائر", icon: "🪟", desc: "4 ستائر بخيارين لكل", section: "curtains" as const, img: `${CDN}/ستارةالاطفال_c6be4038.png` },
];

// Finishing items data
const finishingItems = [
  { id: "f1", name: "أعمال الجبس بورد", desc: "تقسيمات وأسقف جبس بورد عالية الجودة مع عوازل صوتية وحرارية", price: 215000, image: `${CDN}/3_a96032ee.png` },
  { id: "f2", name: "أعمال الكهرباء", desc: "تمديدات كهربائية كاملة مع لوحات توزيع وإضاءة LED", price: 185000, image: `${CDN}/pasted_file_O763PZ_image_02340c8a.png` },
  { id: "f3", name: "أعمال السباكة", desc: "تمديدات مياه وصرف صحي مع خلاطات وأطقم صحية مستوردة", price: 120000, image: `${CDN}/2_98efd75e.png` },
  { id: "f4", name: "أعمال السيراميك والبورسلين", desc: "تركيب سيراميك وبورسلين عالي الجودة في جميع الأرضيات والحمامات", price: 165000, image: `${CDN}/4_b09dab89.png` },
  { id: "f5", name: "أعمال الجبس المجسم", desc: "ديكورات جبسية مجسمة وكورنيشات وأعمال تشكيل فنية", price: 87210, image: `${CDN}/pasted_file_jmfZrK_image_860141de.png` },
  { id: "f6", name: "أعمال الأرضيات HDF", desc: "أرضيات HDF ألماني عالي الجودة Class 32/AC4 مقاوم للخدش والرطوبة", price: 50928, image: `${CDN}/9_04993be5.png` },
  { id: "f7", name: "أعمال الأبواب الخشبية والمصفحة", desc: "أبواب HPL عالية الجودة وباب رئيسي مصفح تركي/إيطالي بنظام غلق متعدد النقاط", price: 117385, image: `${CDN}/pasted_file_HV1FPk_image_2c18654b.png` },
  { id: "f8", name: "أعمال النظافة والتغليف", desc: "نظافة دورية وتغليف وحماية طوال مدة المشروع", price: 13500, image: `${CDN}/pasted_file_UTop2X_image_e9c03242.png` },
  { id: "f9", name: "أعمال الدهانات", desc: "دهانات Jotun Fenomastic 7 مراحل شاملة السيلر والمعجون والتشطيب", price: 104625, image: `${CDN}/pasted_file_NvmWqk_image_07f56c3f.png` },
  { id: "f10", name: "أعمال كبائن الشاور", desc: "كابينتا حمام زجاج سيكوريت 10مم مع اكسسوارات ستانلس ستيل 304", price: 30173, image: `${CDN}/pasted_file_yy791x_image_6c65235e.png` },
  { id: "f11", name: "أعمال الرخام", desc: "رخام أسود جلاكسي Black Galaxy Marble مستورد عالي الجودة", price: 9234, image: `${CDN}/pasted_file_YipdxV_image_0f73c2b2.png` },
];

// Furniture items data
const furnitureItems = [
  {
    id: "fur1", room: "غرفة النوم الرئيسية",
    image: `${CDN}/pasted_file_UTop2X_image_e9c03242.png`,
    options: [
      { id: "fur1_opt1", label: "الخيار الأول - فاخر", price: 104000, desc: "سرير بميكانيزم 180 سم، تنجيد قماش فلفيت مقاوم للاتساخ، شاسية حديد معدني، 2 كومود خشب كونتر طبيعي 7ply، مكتبة 200 سم HPL" },
      { id: "fur1_opt2", label: "الخيار الثاني - عادي", price: 71000, desc: "سرير 180 سم بدون ميكانيزم بشاسيه خشب، 2 كومود خشب، مكتبة 200 سم عدلة" },
    ]
  },
  {
    id: "fur2", room: "غرفة الدريسنج",
    image: `${CDN}/pasted_file_i8B4RA_image_a2992f8c.png`,
    options: [
      { id: "fur2_opt1", label: "الخيار الأول - فاخر", price: 85000, desc: "دولاب دريسنج كامل HPL مع إضاءة LED داخلية وأدراج ناعمة" },
      { id: "fur2_opt2", label: "الخيار الثاني - عادي", price: 55000, desc: "دولاب دريسنج HPL بدون إضاءة داخلية" },
    ]
  },
  {
    id: "fur3", room: "غرفة الأطفال",
    image: `${CDN}/pasted_file_O763PZ_image_02340c8a.png`,
    options: [
      { id: "fur3_opt1", label: "الخيار الأول - فاخر", price: 65000, desc: "سرير أطفال مع درج سحب، مكتب دراسة، خزانة HPL مع إضاءة" },
      { id: "fur3_opt2", label: "الخيار الثاني - عادي", price: 42000, desc: "سرير أطفال، مكتب دراسة، خزانة عادية" },
    ]
  },
  {
    id: "fur4", room: "دريسنج الأطفال",
    image: `${CDN}/pasted_file_yy791x_image_6c65235e.png`,
    options: [
      { id: "fur4_opt1", label: "الخيار الأول - فاخر", price: 35000, desc: "دولاب أطفال HPL مع أدراج ناعمة وإضاءة LED" },
      { id: "fur4_opt2", label: "الخيار الثاني - عادي", price: 22000, desc: "دولاب أطفال HPL بدون إضاءة" },
    ]
  },
  {
    id: "fur5", room: "المدخل",
    image: `${CDN}/pasted_file_HV1FPk_image_2c18654b.png`,
    options: [
      { id: "fur5_opt1", label: "الخيار الأول - فاخر", price: 28000, desc: "وحدة مدخل مع مرآة ومقعد وتعليقة مفاتيح HPL" },
      { id: "fur5_opt2", label: "الخيار الثاني - عادي", price: 18000, desc: "وحدة مدخل بسيطة مع مرآة" },
    ]
  },
  {
    id: "fur6", room: "منطقة الطعام",
    image: `${CDN}/4_b09dab89.png`,
    options: [
      { id: "fur6_opt1", label: "الخيار الأول - فاخر", price: 55000, desc: "طاولة سفرة 8 أشخاص مع كراسي تنجيد فاخر" },
      { id: "fur6_opt2", label: "الخيار الثاني - عادي", price: 35000, desc: "طاولة سفرة 6 أشخاص مع كراسي خشب" },
    ]
  },
  {
    id: "fur7", room: "وحدة تلفزيون الريسيبشن",
    image: `${CDN}/pasted_file_jmfZrK_image_860141de.png`,
    options: [
      { id: "fur7_opt1", label: "الخيار الأول - فاخر", price: 45000, desc: "وحدة تلفزيون HPL مع إضاءة LED مخفية وأدراج ناعمة" },
      { id: "fur7_opt2", label: "الخيار الثاني - عادي", price: 28000, desc: "وحدة تلفزيون HPL بدون إضاءة" },
    ]
  },
  {
    id: "fur8", room: "وحدة المدخل",
    image: `${CDN}/pasted_file_HV1FPk_image_2c18654b.png`,
    options: [
      { id: "fur8_opt1", label: "الخيار الأول - فاخر", price: 32000, desc: "وحدة مدخل كاملة مع مرايا وإضاءة LED" },
      { id: "fur8_opt2", label: "الخيار الثاني - عادي", price: 20000, desc: "وحدة مدخل بسيطة" },
    ]
  },
  {
    id: "fur9", room: "أنتريه الليفينج - الكنبة",
    image: `${CDN}/2_98efd75e.png`,
    options: [
      { id: "fur9_opt1", label: "الخيار الأول - فاخر", price: 75000, desc: "طقم كنب L شيب تنجيد قماش مستورد مع بوف" },
      { id: "fur9_opt2", label: "الخيار الثاني - عادي", price: 48000, desc: "طقم كنب L شيب تنجيد قماش محلي" },
    ]
  },
  {
    id: "fur10", room: "طاولة القهوة والكورنر",
    image: `${CDN}/3_a96032ee.png`,
    options: [
      { id: "fur10_opt1", label: "الخيار الأول - فاخر", price: 22000, desc: "طاولة قهوة رخام مع طاولة كورنر مطابقة" },
      { id: "fur10_opt2", label: "الخيار الثاني - عادي", price: 14000, desc: "طاولة قهوة خشب مع طاولة كورنر" },
    ]
  },
  {
    id: "fur11", room: "مكتبة التلفزيون - الليفينج",
    image: `${CDN}/pasted_file_NvmWqk_image_07f56c3f.png`,
    options: [
      { id: "fur11_opt1", label: "الخيار الأول - فاخر", price: 52000, desc: "مكتبة تلفزيون كاملة HPL مع إضاءة LED وأرفف زجاجية" },
      { id: "fur11_opt2", label: "الخيار الثاني - عادي", price: 33000, desc: "مكتبة تلفزيون HPL بدون إضاءة" },
    ]
  },
  {
    id: "fur12", room: "ديكورات غرفة الماستر",
    image: `${CDN}/pasted_file_UTop2X_image_e9c03242.png`,
    options: [
      { id: "fur12_opt1", label: "الخيار الأول - فاخر", price: 38000, desc: "تجاليد حائط + إضاءة LED مخفية + لوحات ديكورية" },
      { id: "fur12_opt2", label: "الخيار الثاني - عادي", price: 24000, desc: "تجاليد حائط + إضاءة LED مخفية" },
    ]
  },
  {
    id: "fur13", room: "ديكورات غرفة الأطفال",
    image: `${CDN}/pasted_file_O763PZ_image_02340c8a.png`,
    options: [
      { id: "fur13_opt1", label: "الخيار الأول - فاخر", price: 28000, desc: "تجاليد حائط ملونة + إضاءة LED + ديكورات مرسومة" },
      { id: "fur13_opt2", label: "الخيار الثاني - عادي", price: 18000, desc: "تجاليد حائط + إضاءة LED" },
    ]
  },
  {
    id: "fur14", room: "تجاليد الريسيبشن والكوريدور",
    image: `${CDN}/3_a96032ee.png`,
    options: [
      { id: "fur14_opt1", label: "الخيار الوحيد", price: 116350, desc: "Mix Decorative Panels 84,000 + LED 7,000 + خشب 15,750 + مرايا 9,600" },
    ]
  },
  {
    id: "fur15", room: "ديكورات غرفة المعيشة",
    image: `${CDN}/9_04993be5.png`,
    options: [
      { id: "fur15_opt1", label: "الخيار الوحيد", price: 45600, desc: "تجاليد الحائط MDF + Sheet HPL 41,600 + إضاءة LED 4,000" },
    ]
  },
  {
    id: "fur16", room: "ديكورات حوائط المكتبات",
    image: `${CDN}/pasted_file_jmfZrK_image_860141de.png`,
    options: [
      { id: "fur16_opt1", label: "مكتبة الريسيبشن", price: 18400, desc: "تجاليد تراتفنتين رخامي على بوكس خشبي بسمك 10 سم" },
      { id: "fur16_opt2", label: "مكتبة غرفة المعيشة", price: 23000, desc: "تجاليد تراتفنتين رخامي على بوكس خشبي بسمك 10 سم" },
    ]
  },
];

// Smart Home data
const smartHomeOptions = [
  {
    id: "smart1", label: "Option 1 - الأساسي", price: 71212,
    image: `${CDN}/pasted_file_HV1FPk_image_2c18654b.png`,
    items: [
      { name: "Smart Intercom شاشة رئيسية", qty: "1 وحدة" },
      { name: "قفل باب مصفح ذكي - بصمة إصبع", qty: "1 قفل" },
      { name: "مفاتيح ذكية 2 خط", qty: "1 لوحة" },
      { name: "مفاتيح ذكية 3 خط", qty: "5 لوحات" },
      { name: "ريموت تحكم للأجهزة", qty: "2 ريموت" },
      { name: "حساس حركة", qty: "3 حساسات" },
      { name: "تحكم ستائر كهربائية", qty: "2 وحدة" },
    ]
  },
  {
    id: "smart2", label: "Option 2 - المتقدم", price: 140991,
    image: `${CDN}/pasted_file_HV1FPk_image_2c18654b.png`,
    items: [
      { name: "Smart Intercom شاشة رئيسية", qty: "1 وحدة" },
      { name: "قفل باب مصفح ذكي - بصمة + وجه + فيديو", qty: "1 قفل" },
      { name: "لوحة تحكم إضاءة", qty: "1 لوحة" },
      { name: "مفاتيح ذكية 2 خط", qty: "1 لوحة" },
      { name: "مفاتيح ذكية 3 خط", qty: "6 لوحات" },
      { name: "ريموت تحكم للأجهزة", qty: "3 ريموت" },
      { name: "حساس غاز + فالف أمان", qty: "1 وحدة" },
      { name: "Alexa للتحكم الصوتي", qty: "1 وحدة" },
      { name: "تحكم ستائر كهربائية", qty: "6 وحدات" },
      { name: "ستارة ذكية بطول 5.2 متر", qty: "1 ستارة" },
    ]
  },
];

// Curtains data
const curtainItems = [
  {
    id: "cur1", room: "ستارة غرفة الأطفال",
    options: [
      {
        id: "cur1_opt1", label: "Option 1 - عادي", price: 9366.19,
        image: `${CDN}/ستارةالاطفال_c6be4038.png`,
        items: [
          { name: "تراك 210 ويف", price: 1354.32 }, { name: "تراك 210 عادي", price: 812.59 },
          { name: "خشب", price: 677.16 }, { name: "بلاك أوت ألماني", price: 2286.90 },
          { name: "كتان خفيف", price: 2821.50 }, { name: "تفصيل ويف", price: 790.02 },
          { name: "تفصيل عادي", price: 326.70 }, { name: "تركيب", price: 297.00 },
        ]
      },
      {
        id: "cur1_opt2", label: "Option 2 - ذكي (أزورا)", price: 38544.53,
        image: `${CDN}/ستارةالاطفال_c6be4038.png`,
        items: [
          { name: "موتور أزورا", price: 18130.50 }, { name: "تراك أزورا", price: 11337.30 },
          { name: "ريموت كنترول 2 قناة", price: 2122.88 }, { name: "خشب", price: 654.07 },
          { name: "بلاك أوت ألماني", price: 2208.94 }, { name: "كتان خفيف", price: 2725.31 },
          { name: "تفصيل ويف", price: 763.09 }, { name: "تفصيل عادي", price: 315.56 },
          { name: "تركيب", price: 286.88 },
        ]
      },
    ]
  },
  {
    id: "cur2", room: "ستارة غرفة الريسيبشن",
    options: [
      {
        id: "cur2_opt1", label: "Option 1 - عادي", price: 16223.33,
        image: `${CDN}/ستارةالريسبشن_00a3d736.png`,
        items: [
          { name: "تراك 210 ويف", price: 1853.28 }, { name: "تراك 210 عادي", price: 1111.97 },
          { name: "خشب", price: 926.64 }, { name: "كتان تقيل", price: 5945.94 },
          { name: "كتان خفيف", price: 3861.00 }, { name: "تفصيل ويف", price: 1081.08 },
          { name: "تفصيل كرسات", price: 849.42 }, { name: "تركيب", price: 594.00 },
        ]
      },
      {
        id: "cur2_opt2", label: "Option 2 - ذكي (أزورا)", price: 68827.05,
        image: `${CDN}/ستارةالريسبشن_00a3d736.png`,
        items: [
          { name: "موتور أزورا", price: 36261.00 }, { name: "تراك أزورا", price: 15514.20 },
          { name: "ريموت كنترول 2 قناة", price: 4245.75 }, { name: "خشب", price: 895.05 },
          { name: "كتان تقيل", price: 5743.24 }, { name: "كتان خفيف", price: 3729.38 },
          { name: "تفصيل ويف", price: 1044.22 }, { name: "تفصيل كرسات", price: 820.46 },
          { name: "تركيب", price: 573.75 },
        ]
      },
    ]
  },
  {
    id: "cur3", room: "ستارة غرفة الليفينج",
    options: [
      {
        id: "cur3_opt1", label: "Option 1 - عادي", price: 25579.42,
        image: `${CDN}/ستارةالليفنج_a982318a.png`,
        items: [
          { name: "تراك 210 ويف", price: 2869.02 }, { name: "تراك 210 عادي", price: 1721.41 },
          { name: "خشب", price: 1434.51 }, { name: "كتان تقيل", price: 9604.98 },
          { name: "كتان خفيف", price: 6237.00 }, { name: "تفصيل ويف", price: 1746.36 },
          { name: "تفصيل كرسات", price: 1372.14 }, { name: "تركيب", price: 594.00 },
        ]
      },
      {
        id: "cur3_opt2", label: "Option 2 - ذكي (أزورا)", price: 84797.39,
        image: `${CDN}/ستارةالليفنج_a982318a.png`,
        items: [
          { name: "موتور أزورا", price: 36261.00 }, { name: "تراك أزورا", price: 24017.17 },
          { name: "ريموت كنترول 2 قناة", price: 4245.75 }, { name: "خشب", price: 1385.61 },
          { name: "كتان تقيل", price: 9277.54 }, { name: "كتان خفيف", price: 6024.38 },
          { name: "تفصيل ويف", price: 1686.83 }, { name: "تفصيل كرسات", price: 1325.36 },
          { name: "تركيب", price: 573.75 },
        ]
      },
    ]
  },
  {
    id: "cur4", room: "ستارة غرفة الماستر",
    options: [
      {
        id: "cur4_opt1", label: "Option 1 - عادي", price: 4247.10,
        image: `${CDN}/الماستر_c2c20a6f.png`,
        items: [
          { name: "تراك 210 ويف", price: 534.60 }, { name: "تراك 210 عادي", price: 320.76 },
          { name: "خشب", price: 267.30 }, { name: "بلاك أوت ألماني", price: 1143.45 },
          { name: "كتان خفيف", price: 1188.00 }, { name: "تفصيل ويف", price: 332.64 },
          { name: "تفصيل عادي", price: 163.35 }, { name: "تركيب", price: 297.00 },
        ]
      },
      {
        id: "cur4_opt2", label: "Option 2 - ذكي (أزورا)", price: 28004.75,
        image: `${CDN}/الماستر_c2c20a6f.png`,
        items: [
          { name: "موتور أزورا", price: 18130.50 }, { name: "تراك أزورا", price: 4475.25 },
          { name: "ريموت كنترول 2 قناة", price: 2122.88 }, { name: "خشب", price: 258.19 },
          { name: "بلاك أوت ألماني", price: 1104.47 }, { name: "كتان خفيف", price: 1147.50 },
          { name: "تفصيل ويف", price: 321.30 }, { name: "تفصيل عادي", price: 157.78 },
          { name: "تركيب", price: 286.88 },
        ]
      },
    ]
  },
];

// ===================== HELPERS =====================
function formatPrice(n: number) {
  return n.toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ===================== STYLES =====================
const GOLD = "oklch(0.78 0.12 75)";
const DARK = "oklch(0.1 0.005 285)";
const CARD_BG = "oklch(0.14 0.006 285)";
const CARD_BG2 = "oklch(0.18 0.008 285)";
const GOLD_BORDER = "oklch(0.78 0.12 75 / 25%)";
const GOLD_BORDER_ACTIVE = "oklch(0.78 0.12 75)";
const TEXT_PRIMARY = "oklch(0.92 0.01 75)";
const TEXT_SECONDARY = "oklch(0.65 0.01 75)";
const TEXT_MUTED = "oklch(0.55 0.01 75)";

type Section = "home" | "finishing" | "furniture" | "smart" | "curtains" | "timeline" | "summary";

// ===================== TIMELINE DATA =====================
const timelinePhases = [
  { id: 1, name: "المعاينة وجمع البيانات", minDays: 2, maxDays: 2, icon: "📐", color: "oklch(0.75 0.12 200)", desc: "معاينة الشقة وتحديد المتطلبات" },
  { id: 2, name: "رسم البلانات التنفيذية", minDays: 7, maxDays: 10, icon: "📏", color: "oklch(0.75 0.12 200)", desc: "إعداد الرسومات التنفيذية والمخططات" },
  { id: 3, name: "التصميم الداخلي والموديلنج", minDays: 10, maxDays: 14, icon: "🎨", color: "oklch(0.75 0.12 200)", desc: "تصميم ثلاثي الأبعاد واختيار الخامات" },
  { id: 4, name: "الحصر والمقايسة والتكلفة", minDays: 4, maxDays: 6, icon: "📊", color: "oklch(0.75 0.12 200)", desc: "حصر الكميات وإعداد عروض الأسعار" },
  { id: 5, name: "ميتنج العرض والتعاقد", minDays: 1, maxDays: 1, icon: "🤝", color: "oklch(0.78 0.12 75)", desc: "اجتماع العرض وتوقيع العقد" },
  { id: 6, name: "التخطيط للتنفيذ واختيار الخامات", minDays: 5, maxDays: 7, icon: "🗓️", color: "oklch(0.75 0.12 130)", desc: "تحديد خطة التنفيذ واختيار الخامات" },
  { id: 7, name: "أعمال التوريد (حسب البنود)", minDays: 0, maxDays: 0, icon: "🚛", color: "oklch(0.75 0.12 130)", desc: "توريد مستمر طوال فترة المشروع", continuous: true },
  { id: 8, name: "تجهيز الموقع", minDays: 5, maxDays: 7, icon: "🏗️", color: "oklch(0.75 0.12 130)", desc: "تجهيز الموقع وتأمين المواد" },
  { id: 9, name: "تأسيس السباكة", minDays: 5, maxDays: 7, icon: "🔧", color: "oklch(0.75 0.12 130)", desc: "تمديدات مياه وصرف صحي" },
  { id: 10, name: "تأسيس الكهرباء", minDays: 6, maxDays: 8, icon: "⚡", color: "oklch(0.75 0.12 130)", desc: "تمديدات كهربائية ولوحات توزيع" },
  { id: 11, name: "تأسيس التكييف", minDays: 4, maxDays: 6, icon: "❄️", color: "oklch(0.75 0.12 130)", desc: "تمديدات تكييف مركزي" },
  { id: 12, name: "أعمال الجبس", minDays: 7, maxDays: 10, icon: "🏛️", color: "oklch(0.72 0.1 60)", desc: "أسقف جبس بورد وتقسيمات" },
  { id: 13, name: "أعمال المحارة", minDays: 10, maxDays: 14, icon: "🪨", color: "oklch(0.72 0.1 60)", desc: "تشطيب حوائط وأسقف" },
  { id: 14, name: "أعمال الأرضيات", minDays: 7, maxDays: 10, icon: "🟫", color: "oklch(0.72 0.1 60)", desc: "سيراميك وبورسلين وHDF" },
  { id: 15, name: "أعمال الدهانات", minDays: 10, maxDays: 14, icon: "🖌️", color: "oklch(0.72 0.1 60)", desc: "دهانات Jotun 7 مراحل" },
  { id: 16, name: "النجارة والفرش", minDays: 7, maxDays: 10, icon: "🪑", color: "oklch(0.78 0.12 75)", desc: "تركيب الأثاث والديكور" },
  { id: 17, name: "التسليم النهائي", minDays: 1, maxDays: 1, icon: "🎉", color: "oklch(0.78 0.12 75)", desc: "استلام الشقة بشكل نهائي" },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("home");
  const [selectedFinishing, setSelectedFinishing] = useState<Set<string>>(new Set());
  const [selectedFurniture, setSelectedFurniture] = useState<Record<string, string>>({});
  const [selectedSmart, setSelectedSmart] = useState<string | null>(null);
  const [selectedCurtains, setSelectedCurtains] = useState<Record<string, string>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [contractDate, setContractDate] = useState<string>("");

  // ===================== PROJECT AUTH =====================
  const [projectUser, setProjectUser] = useState<ProjectUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Check existing session on mount
  const meQuery = trpc.project.me.useQuery(undefined, { retry: false });
  useEffect(() => {
    if (meQuery.data) setProjectUser(meQuery.data);
  }, [meQuery.data]);

  // Phase statuses from DB
  const phaseStatusesQuery = trpc.phases.getAll.useQuery(undefined, { refetchInterval: 30000 });
  const phaseStatuses = phaseStatusesQuery.data ?? [];

  const setStatusMutation = trpc.phases.setStatus.useMutation({
    onSuccess: () => phaseStatusesQuery.refetch(),
  });

  // Complaints
  const allComplaintsQuery = trpc.complaints.getAll.useQuery(undefined, { refetchInterval: 30000 });
  const allComplaints = allComplaintsQuery.data ?? [];

  const createComplaintMutation = trpc.complaints.create.useMutation({
    onSuccess: () => allComplaintsQuery.refetch(),
  });

  const logoutMutation = trpc.project.logout.useMutation({
    onSuccess: () => { setProjectUser(null); },
  });

  // Complaint modal state
  const [complaintModal, setComplaintModal] = useState<{ phaseIndex: number; phaseName: string } | null>(null);
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintImg, setComplaintImg] = useState<{ base64: string; mime: string } | null>(null);
  const [complaintLoading, setComplaintLoading] = useState(false);

  // Replies modal state
  const [repliesModal, setRepliesModal] = useState<{ id: number; title: string; phaseIndex: number } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyImg, setReplyImg] = useState<{ base64: string; mime: string } | null>(null);

  const repliesQuery = trpc.complaints.getReplies.useQuery(
    { complaintId: repliesModal?.id ?? 0 },
    { enabled: !!repliesModal, refetchInterval: 10000 }
  );
  const addReplyMutation = trpc.complaints.addReply.useMutation({
    onSuccess: () => { repliesQuery.refetch(); setReplyText(""); setReplyImg(null); },
  });
  const closeMutation = trpc.complaints.close.useMutation({
    onSuccess: () => { allComplaintsQuery.refetch(); repliesQuery.refetch(); },
  });

  const fileToBase64 = (file: File): Promise<{ base64: string; mime: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: (reader.result as string).split(",")[1], mime: file.type });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Calculate totals
  const finishingTotal = finishingItems.filter(i => selectedFinishing.has(i.id)).reduce((s, i) => s + i.price, 0);
  const furnitureTotal = Object.entries(selectedFurniture).reduce((s, [rId, oId]) => {
    const r = furnitureItems.find(r => r.id === rId);
    const o = r?.options.find(o => o.id === oId);
    return s + (o?.price || 0);
  }, 0);
  const smartTotal = smartHomeOptions.find(o => o.id === selectedSmart)?.price || 0;
  const curtainsTotal = Object.entries(selectedCurtains).reduce((s, [rId, oId]) => {
    const r = curtainItems.find(r => r.id === rId);
    const o = r?.options.find(o => o.id === oId);
    return s + (o?.price || 0);
  }, 0);
  const grandTotal = finishingTotal + furnitureTotal + smartTotal + curtainsTotal;

  // Compute timeline phases with dates based on contractDate
  const computedTimeline = useMemo(() => {
    if (!contractDate) return [];
    const start = new Date(contractDate);
    let cursor = new Date(start);
    return timelinePhases.map(phase => {
      const phaseStart = new Date(cursor);
      const avgDays = phase.continuous ? 0 : Math.ceil((phase.minDays + phase.maxDays) / 2);
      const phaseEnd = new Date(cursor);
      if (!phase.continuous) phaseEnd.setDate(phaseEnd.getDate() + avgDays - 1);
      if (!phase.continuous) cursor.setDate(cursor.getDate() + avgDays);
      return { ...phase, startDate: new Date(phaseStart), endDate: phase.continuous ? null : new Date(phaseEnd) };
    });
  }, [contractDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentPhaseIndex = useMemo(() => {
    if (!contractDate || computedTimeline.length === 0) return -1;
    for (let i = computedTimeline.length - 1; i >= 0; i--) {
      const p = computedTimeline[i];
      if (p.continuous) continue;
      if (p.endDate && today >= p.startDate && today <= p.endDate) return i;
    }
    // find first future phase
    for (let i = 0; i < computedTimeline.length; i++) {
      const p = computedTimeline[i];
      if (p.continuous) continue;
      if (p.startDate > today) return i - 1;
    }
    return computedTimeline.length - 1;
  }, [computedTimeline, contractDate]);

  const navItems: { id: Section; label: string; icon: string; count?: number }[] = [
    { id: "home", label: "الرئيسية", icon: "🏠" },
    { id: "finishing", label: "التشطيب", icon: "🔨", count: selectedFinishing.size },
    { id: "furniture", label: "الأثاث", icon: "🛋️", count: Object.keys(selectedFurniture).length },
    { id: "smart", label: "Smart Home", icon: "🏡", count: selectedSmart ? 1 : 0 },
    { id: "curtains", label: "الستائر", icon: "🪟", count: Object.keys(selectedCurtains).length },
    { id: "timeline", label: "الجدول الزمني", icon: "📅" },
    { id: "summary", label: "الملخص", icon: "📊" },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: "100vh", background: DARK, direction: "rtl", fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
      {/* Top Navigation */}
      <nav style={{ background: "oklch(0.12 0.006 285)", borderBottom: `1px solid ${GOLD_BORDER}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <img src={`${CDN}/ProfessorLogo(1)_351dfbb8.png`} alt="Professor Logo" style={{ height: "36px", objectFit: "contain" }} />
            </div>
            {/* Login Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {projectUser ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: GOLD, fontSize: "0.78rem", fontWeight: 600 }}>
                    {projectUser.role === "admin" ? "👑" : projectUser.role === "engineer" ? "🔧" : projectUser.role === "aftersales" ? "🎯" : "👤"} {projectUser.displayName}
                  </span>
                  <button onClick={() => logoutMutation.mutate()} style={{ background: "transparent", border: `1px solid ${GOLD_BORDER}`, color: TEXT_MUTED, borderRadius: "0.4rem", padding: "0.25rem 0.6rem", fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>خروج</button>
                </div>
              ) : (
                <button onClick={() => setShowLogin(true)} style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}60`, color: GOLD, borderRadius: "0.5rem", padding: "0.35rem 0.8rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>🔐 دخول المهندس</button>
              )}
            </div>
            {/* Nav Items */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  style={{
                    background: activeSection === item.id ? GOLD : "transparent",
                    color: activeSection === item.id ? DARK : GOLD,
                    border: `1px solid ${activeSection === item.id ? GOLD : GOLD_BORDER}`,
                    borderRadius: "0.5rem", padding: "0.35rem 0.7rem",
                    fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Cairo', sans-serif",
                    position: "relative",
                  }}>
                  {item.icon} {item.label}
                  {item.count !== undefined && item.count > 0 && (
                    <span style={{
                      position: "absolute", top: "-6px", left: "-6px",
                      background: GOLD, color: DARK,
                      borderRadius: "50%", width: "18px", height: "18px",
                      fontSize: "0.65rem", fontWeight: 900,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{item.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Grand Total Bar */}
      {grandTotal > 0 && (
        <div style={{ background: `linear-gradient(135deg, ${GOLD}, oklch(0.6 0.1 75))`, padding: "0.5rem 1rem" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: DARK, fontWeight: 700, fontSize: "0.85rem" }}>الإجمالي المختار حتى الآن:</span>
            <span style={{ color: DARK, fontWeight: 900, fontSize: "1.05rem" }}>{formatPrice(grandTotal)} جنيه</span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem 1rem" }}>

        {/* ===== HOME SECTION ===== */}
        {activeSection === "home" && (
          <div>
            {/* Hero Banner */}
            <div style={{
              background: `linear-gradient(135deg, oklch(0.14 0.006 285) 0%, oklch(0.18 0.01 75) 100%)`,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "1rem", padding: "2.5rem 1.5rem", marginBottom: "2rem",
              textAlign: "center",
              backgroundImage: `url(${CDN}/2_98efd75e.png)`,
              backgroundSize: "cover", backgroundPosition: "center",
              position: "relative", overflow: "hidden", minHeight: "200px",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "oklch(0.1 0.005 285 / 85%)" }} />
              <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                {/* Logo Left */}
                <img src={`${CDN}/ProfessorLogo(1)_351dfbb8.png`} alt="Professor" style={{ height: "160px", objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 0 12px rgba(212,175,55,0.4))" }} />
                {/* Center Text */}
                <div style={{ flex: 1, textAlign: "center" }}>
                  <h1 style={{ color: GOLD, fontSize: "2.8rem", fontWeight: 900, marginBottom: "0.5rem", letterSpacing: "0.02em", textShadow: `0 0 20px ${GOLD}60` }}>مشروع شقة مدينتي</h1>
                  <p style={{ color: TEXT_SECONDARY, fontSize: "1.05rem", marginBottom: "0.25rem" }}>العميل: مستر علي راشد | مدينتي | 140 متر</p>
                  <p style={{ color: TEXT_MUTED, fontSize: "0.85rem" }}>مارس 2026 | عرض تقديمي شامل للتشطيب والأثاث والأنظمة الذكية والستائر</p>
                </div>
                {/* Logo Right */}
                <img src={`${CDN}/ProfessorLogo(1)_351dfbb8.png`} alt="Professor" style={{ height: "160px", objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 0 12px rgba(212,175,55,0.4))" }} />
              </div>
            </div>

            {/* About Company */}
            <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
              <h2 style={{ color: GOLD, fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem", borderBottom: `1px solid ${GOLD_BORDER}`, paddingBottom: "0.5rem" }}>
                🏢 نبذة عن شركة Professor
              </h2>
              <p style={{ color: TEXT_PRIMARY, lineHeight: 1.9, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                شركة <strong style={{ color: GOLD }}>PROFESSOR</strong> - Perfection in Every Detail، شركة رائدة متخصصة في أعمال التصميم الداخلي والتنفيذ المتكامل للمشاريع السكنية الفاخرة. نقدم خدمات شاملة تشمل التشطيب الكامل، الأثاث المصنوع بالمقاس، الأنظمة الذكية، والستائر. نلتزم بأعلى معايير الجودة والدقة في التنفيذ مع ضمان رضا العميل الكامل وتسليم المشروع في الوقت المحدد.
              </p>
              {/* Excellence Points */}
              <h3 style={{ color: GOLD, fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>✨ لماذا نحن الخيار الأمثل؟</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                {[
                  { icon: "🏭", title: "مصنع خاص وإدارة متكاملة", desc: "تمتلك الشركة مصنعها الخاص ومخازنها، مما يضمن التنفيذ المباشر بأيدي فنيينا والسيطرة الكاملة على الجودة، والالتزام التام بمواعيد التسليم." },
                  { icon: "📞", title: "أنظمة متابعة ودعم 24/7", desc: "نمتلك أحدث أنظمة المتابعة (CRM) وهوت لاين على مدار 24 ساعة لخدمة ما بعد البيع، مع فرق متكاملة للمبيعات والمكتب الفني والإنتاج والدعم المالي والإداري." },
                  { icon: "🏆", title: "الخبرة والتاريخ", desc: "سنوات من الخبرة الراسخة في مجال التصميم الداخلي والتنفيذ المتكامل للمشاريع السكنية الفاخرة." },
                  { icon: "👨‍💼", title: "الفريق المتخصص", desc: "فريق متكامل من المهندسين والفنيين ذوي الخبرة العالية يعملون بتناغم لضمان دقة التنفيذ وتحقيق أعلى مستويات الجودة." },
                  { icon: "💎", title: "الجودة والمعايير", desc: "نلتزم بأعلى معايير الجودة العالمية واستخدام أفضل الخامات والمواد المستوردة لضمان الفخامة والمتانة." },
                ].map((point, i) => (
                  <div key={i} style={{ background: CARD_BG2, border: `1px solid ${GOLD_BORDER}`, borderRadius: "0.75rem", padding: "0.85rem 1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{point.icon}</span>
                    <div>
                      <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{point.title}</div>
                      <div style={{ color: TEXT_SECONDARY, fontSize: "0.8rem", lineHeight: 1.6 }}>{point.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team - Hierarchical Interactive */}
            <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
              <h2 style={{ color: GOLD, fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem", borderBottom: `1px solid ${GOLD_BORDER}`, paddingBottom: "0.5rem" }}>
                👥 فريق العمل المكلف بالمشروع
              </h2>
              <p style={{ color: TEXT_SECONDARY, fontSize: "0.82rem", marginBottom: "1.25rem" }}>اضغط على أي عضو لعرض دوره ومهامه بالتفصيل</p>

              {/* Level 1 - Chairman */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                {teamData.filter(m => m.level === 1).map(member => {
                  const isSelected = selectedTeamMember === member.id;
                  return (
                    <div key={member.id}
                      onClick={() => setSelectedTeamMember(isSelected ? null : member.id)}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? `${GOLD}18` : CARD_BG2,
                        border: `2px solid ${isSelected ? GOLD : GOLD_BORDER}`,
                        borderRadius: "1rem",
                        padding: "1rem 1.5rem",
                        textAlign: "center",
                        minWidth: isSelected ? "340px" : "200px",
                        maxWidth: isSelected ? "420px" : "240px",
                        position: "relative",
                        transition: "all 0.25s ease",
                      }}>
                      <div style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: GOLD, color: DARK, fontSize: "0.65rem", fontWeight: 900, padding: "2px 10px", borderRadius: "999px" }}>قيادة</div>
                      <div style={{ display: "flex", flexDirection: isSelected ? "row" : "column", alignItems: isSelected ? "flex-start" : "center", gap: "1rem" }}>
                        <div style={{ flexShrink: 0, textAlign: "center" }}>
                          {member.img && <img src={member.img} alt={member.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0.5rem auto 0.5rem", display: "block", border: `3px solid ${GOLD}` }} />}
                          <div style={{ color: GOLD, fontWeight: 800, fontSize: "0.95rem" }}>{member.name}</div>
                          <div style={{ color: TEXT_PRIMARY, fontSize: "0.78rem", marginTop: "0.2rem" }}>{member.title}</div>
                          <div style={{ color: TEXT_MUTED, fontSize: "0.72rem", marginTop: "0.15rem" }}>{member.role}</div>
                          {(member.whatsapp || member.phone) && (
                            <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.4rem" }}>
                              {member.whatsapp && <WhatsAppButton whatsapp={member.whatsapp} name={member.name} size="sm" />}
                              {member.phone && <PhoneLink phone={member.phone} size="sm" />}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div style={{ textAlign: "right", flex: 1 }}>
                            <div style={{ color: GOLD, fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.4rem" }}>📌 المهام والمسؤوليات:</div>
                            {member.duties.map((d, i) => (
                              <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start", marginBottom: "0.3rem" }}>
                                <span style={{ color: GOLD, flexShrink: 0, marginTop: "0.1rem", fontSize: "0.65rem" }}>◆</span>
                                <span style={{ color: TEXT_PRIMARY, fontSize: "0.75rem", lineHeight: 1.6 }}>{d}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Connector line */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "0" }}>
                <div style={{ width: "2px", height: "24px", background: GOLD_BORDER }} />
              </div>

              {/* Level 1.5 - Project Management */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ textAlign: "center", color: "oklch(0.75 0.11 75)", fontSize: "0.75rem", marginBottom: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>——— إدارة المشروع ———</div>
                <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                  {teamData.filter(m => m.level === 1.5).map(member => {
                    const isSelected = selectedTeamMember === member.id;
                    return (
                      <div key={member.id}
                        onClick={() => setSelectedTeamMember(isSelected ? null : member.id)}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? `${GOLD}18` : CARD_BG2,
                          border: `2px solid ${isSelected ? GOLD : "oklch(0.75 0.11 75)"}`,
                          borderRadius: "0.9rem",
                          padding: "0.9rem 1.1rem",
                          textAlign: "center",
                          position: "relative",
                          minWidth: isSelected ? "320px" : "190px",
                          maxWidth: isSelected ? "400px" : "230px",
                          transition: "all 0.25s ease",
                        }}>
                        <div style={{ position: "absolute", top: "-9px", left: "50%", transform: "translateX(-50%)", background: "oklch(0.75 0.11 75)", color: DARK, fontSize: "0.62rem", fontWeight: 900, padding: "2px 9px", borderRadius: "999px", whiteSpace: "nowrap" }}>إدارة المشروع</div>
                        <div style={{ display: "flex", flexDirection: isSelected ? "row" : "column", alignItems: isSelected ? "flex-start" : "center", gap: "0.9rem" }}>
                          <div style={{ flexShrink: 0, textAlign: "center" }}>
                            {member.img && <img src={member.img} alt={member.name} style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", margin: "0.45rem auto 0.45rem", display: "block", border: `2px solid oklch(0.75 0.11 75)` }} />}
                            <div style={{ color: GOLD, fontWeight: 800, fontSize: "0.88rem" }}>{member.name}</div>
                            <div style={{ color: TEXT_PRIMARY, fontSize: "0.74rem", marginTop: "0.15rem" }}>{member.title}</div>
                            {(member.whatsapp || member.phone) && (
                              <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.35rem" }}>
                                {member.whatsapp && <WhatsAppButton whatsapp={member.whatsapp} name={member.name} size="xs" />}
                                {member.phone && <PhoneLink phone={member.phone} size="xs" />}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div style={{ flex: 1, textAlign: "right" }}>
                              <div style={{ color: GOLD, fontSize: "0.73rem", fontWeight: 700, marginBottom: "0.38rem" }}>📌 المهام:</div>
                              {member.duties.map((d, i) => (
                                <div key={i} style={{ display: "flex", gap: "0.35rem", alignItems: "flex-start", marginBottom: "0.26rem" }}>
                                  <span style={{ color: GOLD, flexShrink: 0, marginTop: "0.1rem", fontSize: "0.62rem" }}>◆</span>
                                  <span style={{ color: TEXT_PRIMARY, fontSize: "0.72rem", lineHeight: 1.6, textAlign: "right" }}>{d}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connector */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "0" }}>
                <div style={{ width: "2px", height: "20px", background: GOLD_BORDER }} />
              </div>

              {/* Level 2 - Direct Reports */}
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", paddingTop: "0" }}>
                <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-start", gap: "0", flexWrap: "wrap" }}>
                  {teamData.filter(m => m.level === 2).map((member) => {
                    const isSelected = selectedTeamMember === member.id;
                    return (
                      <div key={member.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: isSelected ? "2 1 280px" : "1 1 160px", maxWidth: isSelected ? "360px" : "220px", transition: "all 0.25s ease" }}>
                        <div style={{ width: "2px", height: "20px", background: GOLD_BORDER }} />
                        <div
                          onClick={() => setSelectedTeamMember(isSelected ? null : member.id)}
                          style={{
                            cursor: "pointer",
                            background: isSelected ? `${GOLD}18` : CARD_BG2,
                            border: `2px solid ${isSelected ? GOLD : GOLD_BORDER}`,
                            borderRadius: "0.85rem",
                            padding: "0.85rem 1rem",
                            textAlign: "center",
                            width: "100%",
                            position: "relative",
                            transition: "all 0.25s ease",
                          }}>
                          <div style={{ position: "absolute", top: "-9px", left: "50%", transform: "translateX(-50%)", background: "oklch(0.72 0.1 75)", color: DARK, fontSize: "0.6rem", fontWeight: 900, padding: "2px 8px", borderRadius: "999px", whiteSpace: "nowrap" }}>{member.department}</div>
                          {member.img && <img src={member.img} alt={member.name} style={{ width: "65px", height: "65px", borderRadius: "50%", objectFit: "cover", margin: "0.4rem auto 0.4rem", display: "block", border: `2px solid oklch(0.72 0.1 75)` }} />}
                          <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.85rem" }}>{member.name}</div>
                          <div style={{ color: TEXT_PRIMARY, fontSize: "0.72rem", marginTop: "0.15rem" }}>{member.title}</div>
                          {(member.whatsapp || member.phone) && (
                            <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.3rem" }}>
                              {member.whatsapp && <WhatsAppButton whatsapp={member.whatsapp} name={member.name} size="xs" />}
                              {member.phone && <PhoneLink phone={member.phone} size="xs" />}
                            </div>
                          )}
                          {isSelected && (
                            <div style={{ marginTop: "0.75rem", textAlign: "right", borderTop: `1px solid ${GOLD_BORDER}`, paddingTop: "0.6rem" }}>
                              <div style={{ color: GOLD, fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.35rem" }}>📌 المهام:</div>
                              {member.duties.map((d, i) => (
                                <div key={i} style={{ display: "flex", gap: "0.35rem", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                                  <span style={{ color: GOLD, flexShrink: 0, marginTop: "0.1rem", fontSize: "0.6rem" }}>◆</span>
                                  <span style={{ color: TEXT_PRIMARY, fontSize: "0.7rem", lineHeight: 1.6, textAlign: "right" }}>{d}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connector */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "0" }}>
                <div style={{ width: "2px", height: "20px", background: GOLD_BORDER }} />
              </div>

              {/* Level 3 - Technical Team */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ textAlign: "center", color: TEXT_MUTED, fontSize: "0.75rem", marginBottom: "0.75rem", fontWeight: 600, letterSpacing: "0.05em" }}>——— الفريق التقني والتنفيذي ———</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
                  {teamData.filter(m => m.level === 3).map(member => {
                    const isSelected = selectedTeamMember === member.id;
                    return (
                      <div key={member.id}
                        onClick={() => setSelectedTeamMember(isSelected ? null : member.id)}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? `${GOLD}18` : CARD_BG2,
                          border: `2px solid ${isSelected ? GOLD : GOLD_BORDER}`,
                          borderRadius: "0.75rem",
                          padding: "0.85rem",
                          textAlign: "center",
                          position: "relative",
                          gridColumn: isSelected ? "span 2" : "span 1",
                          transition: "all 0.25s ease",
                        }}>
                        <div style={{ position: "absolute", top: "-9px", left: "50%", transform: "translateX(-50%)", background: "oklch(0.65 0.08 75)", color: DARK, fontSize: "0.6rem", fontWeight: 900, padding: "2px 8px", borderRadius: "999px", whiteSpace: "nowrap" }}>{member.department}</div>
                        <div style={{ display: "flex", flexDirection: isSelected ? "row" : "column", alignItems: isSelected ? "flex-start" : "center", gap: "0.85rem" }}>
                          <div style={{ flexShrink: 0, textAlign: "center", minWidth: "80px" }}>
                            {member.img && <img src={member.img} alt={member.name} style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", margin: "0.4rem auto 0.4rem", display: "block", border: `2px solid oklch(0.65 0.08 75)` }} />}
                            <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.82rem" }}>{member.name}</div>
                            <div style={{ color: TEXT_SECONDARY, fontSize: "0.7rem", marginTop: "0.1rem" }}>{member.title}</div>
                            {(member.whatsapp || member.phone) && (
                              <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.3rem" }}>
                                {member.whatsapp && <WhatsAppButton whatsapp={member.whatsapp} name={member.name} size="xs" />}
                                {member.phone && <PhoneLink phone={member.phone} size="xs" />}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div style={{ flex: 1, textAlign: "right" }}>
                              <div style={{ color: GOLD, fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.35rem" }}>📌 المهام:</div>
                              {member.duties.map((d, i) => (
                                <div key={i} style={{ display: "flex", gap: "0.35rem", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                                  <span style={{ color: GOLD, flexShrink: 0, marginTop: "0.1rem", fontSize: "0.6rem" }}>◆</span>
                                  <span style={{ color: TEXT_PRIMARY, fontSize: "0.7rem", lineHeight: 1.6, textAlign: "right" }}>{d}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Level 4 - Support Team */}
              <div style={{ marginBottom: "0.5rem" }}>
                <div style={{ textAlign: "center", color: TEXT_MUTED, fontSize: "0.75rem", marginBottom: "0.75rem", fontWeight: 600, letterSpacing: "0.05em" }}>——— فريق الدعم والتخصصات ———</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.65rem" }}>
                  {teamData.filter(m => m.level === 4).map(member => {
                    const isSelected = selectedTeamMember === member.id;
                    return (
                      <div key={member.id}
                        onClick={() => setSelectedTeamMember(isSelected ? null : member.id)}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? `${GOLD}18` : CARD_BG2,
                          border: `2px solid ${isSelected ? GOLD : GOLD_BORDER}`,
                          borderRadius: "0.65rem",
                          padding: "0.75rem 0.65rem",
                          textAlign: "center",
                          position: "relative",
                          gridColumn: isSelected ? "span 2" : "span 1",
                          transition: "all 0.25s ease",
                        }}>
                        <div style={{ position: "absolute", top: "-9px", left: "50%", transform: "translateX(-50%)", background: "oklch(0.58 0.06 75)", color: DARK, fontSize: "0.58rem", fontWeight: 900, padding: "2px 7px", borderRadius: "999px", whiteSpace: "nowrap" }}>{member.department}</div>
                        <div style={{ display: "flex", flexDirection: isSelected ? "row" : "column", alignItems: isSelected ? "flex-start" : "center", gap: "0.75rem" }}>
                          <div style={{ flexShrink: 0, textAlign: "center", minWidth: "70px" }}>
                            {member.img && <img src={member.img} alt={member.name} style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", margin: "0.4rem auto 0.35rem", display: "block", border: `2px solid oklch(0.58 0.06 75)` }} />}
                            <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.78rem" }}>{member.name}</div>
                            <div style={{ color: TEXT_SECONDARY, fontSize: "0.67rem", marginTop: "0.1rem" }}>{member.title}</div>
                            {(member.whatsapp || member.phone) && (
                              <div style={{ display: "flex", gap: "0.22rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.28rem" }}>
                                {member.whatsapp && <WhatsAppButton whatsapp={member.whatsapp} name={member.name} size="xs" />}
                                {member.phone && <PhoneLink phone={member.phone} size="xs" />}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div style={{ flex: 1, textAlign: "right" }}>
                              <div style={{ color: GOLD, fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.3rem" }}>📌 المهام:</div>
                              {member.duties.map((d, i) => (
                                <div key={i} style={{ display: "flex", gap: "0.3rem", alignItems: "flex-start", marginBottom: "0.22rem" }}>
                                  <span style={{ color: GOLD, flexShrink: 0, marginTop: "0.1rem", fontSize: "0.58rem" }}>◆</span>
                                  <span style={{ color: TEXT_PRIMARY, fontSize: "0.68rem", lineHeight: 1.6, textAlign: "right" }}>{d}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Project Contents */}
            <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "1.5rem" }}>
              <h2 style={{ color: GOLD, fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem", borderBottom: `1px solid ${GOLD_BORDER}`, paddingBottom: "0.5rem" }}>
                📋 محتويات العرض
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
                {projectContents.map((c, i) => (
                  <div key={i}
                    style={{ borderRadius: "0.75rem", overflow: "hidden", cursor: "pointer", border: `1px solid ${GOLD_BORDER}`, transition: "all 0.2s" }}
                    onClick={() => setActiveSection(c.section)}>
                    <div style={{ height: "140px", backgroundImage: `url(${c.img})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, background: "oklch(0.1 0.005 285 / 60%)" }} />
                      <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem" }}>
                        <span style={{ fontSize: "2rem" }}>{c.icon}</span>
                      </div>
                    </div>
                    <div style={{ background: CARD_BG2, padding: "0.75rem" }}>
                      <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.95rem" }}>{c.title}</div>
                      <div style={{ color: TEXT_SECONDARY, fontSize: "0.8rem", marginTop: "0.2rem" }}>{c.desc}</div>
                      <div style={{ color: GOLD, fontSize: "0.75rem", marginTop: "0.5rem", opacity: 0.8 }}>اضغط للاستعراض ←</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== FINISHING SECTION ===== */}
        {activeSection === "finishing" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ color: GOLD, fontSize: "1.6rem", fontWeight: 900 }}>🔨 مقايسة التشطيب</h2>
              <p style={{ color: TEXT_SECONDARY, fontSize: "0.9rem" }}>اختر البنود التي تريد تضمينها في مقايستك (يمكن اختيار أكثر من بند)</p>
              {finishingTotal > 0 && (
                <div style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}60`, borderRadius: "0.5rem", padding: "0.5rem 1rem", marginTop: "0.75rem", display: "inline-block" }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>إجمالي التشطيب المختار: {formatPrice(finishingTotal)} جنيه</span>
                </div>
              )}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                <button
                  style={{ background: "transparent", border: `1px solid ${GOLD}`, color: GOLD, borderRadius: "0.35rem", padding: "0.3rem 0.8rem", fontSize: "0.8rem", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
                  onClick={() => setSelectedFinishing(new Set(finishingItems.map(i => i.id)))}>
                  ✓ اختيار الكل
                </button>
                <button
                  style={{ background: "transparent", border: `1px solid oklch(0.5 0.01 75)`, color: "oklch(0.5 0.01 75)", borderRadius: "0.35rem", padding: "0.3rem 0.8rem", fontSize: "0.8rem", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
                  onClick={() => setSelectedFinishing(new Set())}>
                  ✕ إلغاء الكل
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {finishingItems.map(item => {
                const isSelected = selectedFinishing.has(item.id);
                return (
                  <div key={item.id}
                    style={{
                      background: isSelected ? `${GOLD}15` : CARD_BG,
                      border: `${isSelected ? 2 : 1}px solid ${isSelected ? GOLD_BORDER_ACTIVE : GOLD_BORDER}`,
                      borderRadius: "0.75rem", overflow: "hidden", cursor: "pointer", transition: "all 0.2s",
                    }}
                    onClick={() => {
                      const s = new Set(selectedFinishing);
                      if (s.has(item.id)) s.delete(item.id); else s.add(item.id);
                      setSelectedFinishing(s);
                    }}>
                    <div style={{ position: "relative" }}>
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                      {isSelected && (
                        <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", background: GOLD, borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: DARK, fontWeight: 900, fontSize: "0.9rem" }}>✓</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "0.9rem" }}>
                      <h3 style={{ color: isSelected ? GOLD : TEXT_PRIMARY, fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.4rem" }}>{item.name}</h3>
                      <p style={{ color: TEXT_MUTED, fontSize: "0.78rem", lineHeight: 1.5, marginBottom: "0.6rem" }}>{item.desc}</p>
                      <div style={{ color: GOLD, fontWeight: 900, fontSize: "1rem" }}>{formatPrice(item.price)} <span style={{ fontSize: "0.75rem", fontWeight: 400 }}>جنيه</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== FURNITURE SECTION ===== */}
        {activeSection === "furniture" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ color: GOLD, fontSize: "1.6rem", fontWeight: 900 }}>🛋️ مقايسة الأثاث</h2>
              <p style={{ color: TEXT_SECONDARY, fontSize: "0.9rem" }}>اختر الخيار المناسب لكل غرفة</p>
              {furnitureTotal > 0 && (
                <div style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}60`, borderRadius: "0.5rem", padding: "0.5rem 1rem", marginTop: "0.75rem", display: "inline-block" }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>إجمالي الأثاث المختار: {formatPrice(furnitureTotal)} جنيه</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {furnitureItems.map(room => (
                <div key={room.id} style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", borderBottom: `1px solid ${GOLD_BORDER}` }}>
                    <img src={room.image} alt={room.room} style={{ width: "72px", height: "54px", objectFit: "cover", borderRadius: "0.4rem" }} />
                    <div>
                      <h3 style={{ color: GOLD, fontWeight: 700, fontSize: "0.95rem" }}>{room.room}</h3>
                      {selectedFurniture[room.id] && (
                        <span style={{ color: TEXT_SECONDARY, fontSize: "0.78rem" }}>
                          ✓ {room.options.find(o => o.id === selectedFurniture[room.id])?.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem", padding: "0.9rem" }}>
                    {room.options.map(opt => {
                      const isSelected = selectedFurniture[room.id] === opt.id;
                      return (
                        <div key={opt.id}
                          style={{
                            background: isSelected ? `${GOLD}12` : CARD_BG2,
                            border: `${isSelected ? 2 : 1}px solid ${isSelected ? GOLD_BORDER_ACTIVE : GOLD_BORDER}`,
                            borderRadius: "0.75rem", padding: "0.9rem", cursor: "pointer", transition: "all 0.2s",
                          }}
                          onClick={() => setSelectedFurniture(prev => ({ ...prev, [room.id]: opt.id }))}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                            <span style={{ color: isSelected ? GOLD : TEXT_PRIMARY, fontWeight: 700, fontSize: "0.85rem" }}>{opt.label}</span>
                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${GOLD}`, background: isSelected ? GOLD : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {isSelected && <span style={{ color: DARK, fontSize: "0.65rem", fontWeight: 900 }}>✓</span>}
                            </div>
                          </div>
                          <p style={{ color: TEXT_MUTED, fontSize: "0.78rem", lineHeight: 1.5, marginBottom: "0.6rem" }}>{opt.desc}</p>
                          <div style={{ color: GOLD, fontWeight: 900, fontSize: "1rem" }}>{formatPrice(opt.price)} <span style={{ fontSize: "0.72rem", fontWeight: 400 }}>جنيه</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SMART HOME SECTION ===== */}
        {activeSection === "smart" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ color: GOLD, fontSize: "1.6rem", fontWeight: 900 }}>🏡 Smart Home System</h2>
              <p style={{ color: TEXT_SECONDARY, fontSize: "0.9rem" }}>اختر الباقة المناسبة لنظام المنزل الذكي</p>
              {smartTotal > 0 && (
                <div style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}60`, borderRadius: "0.5rem", padding: "0.5rem 1rem", marginTop: "0.75rem", display: "inline-block" }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>الباقة المختارة: {formatPrice(smartTotal)} جنيه</span>
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
              {smartHomeOptions.map(opt => {
                const isSelected = selectedSmart === opt.id;
                return (
                  <div key={opt.id}
                    style={{
                      background: isSelected ? `${GOLD}10` : CARD_BG,
                      border: `${isSelected ? 2 : 1}px solid ${isSelected ? GOLD_BORDER_ACTIVE : GOLD_BORDER}`,
                      borderRadius: "1rem", overflow: "hidden", cursor: "pointer", transition: "all 0.2s",
                    }}
                    onClick={() => setSelectedSmart(isSelected ? null : opt.id)}>
                    <div style={{ position: "relative" }}>
                      <img src={opt.image} alt={opt.label} style={{ width: "100%", height: "180px", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "oklch(0.1 0.005 285 / 50%)" }} />
                      <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: `2px solid ${GOLD}`, background: isSelected ? GOLD : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {isSelected && <span style={{ color: DARK, fontWeight: 900 }}>✓</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "1.25rem" }}>
                      <h3 style={{ color: GOLD, fontWeight: 900, fontSize: "1.05rem", marginBottom: "1rem" }}>{opt.label}</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem" }}>
                        {opt.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0.6rem", background: CARD_BG2, borderRadius: "0.35rem" }}>
                            <span style={{ color: TEXT_PRIMARY, fontSize: "0.82rem" }}>{item.name}</span>
                            <span style={{ color: GOLD, fontSize: "0.78rem", fontWeight: 600 }}>{item.qty}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ color: GOLD, fontWeight: 900, fontSize: "1.2rem", textAlign: "center", padding: "0.7rem", background: `${GOLD}15`, borderRadius: "0.5rem" }}>
                        {formatPrice(opt.price)} جنيه
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== CURTAINS SECTION ===== */}
        {activeSection === "curtains" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ color: GOLD, fontSize: "1.6rem", fontWeight: 900 }}>🪟 مقايسة الستائر</h2>
              <p style={{ color: TEXT_SECONDARY, fontSize: "0.9rem" }}>اختر الخيار المناسب لكل ستارة</p>
              {curtainsTotal > 0 && (
                <div style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}60`, borderRadius: "0.5rem", padding: "0.5rem 1rem", marginTop: "0.75rem", display: "inline-block" }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>إجمالي الستائر المختارة: {formatPrice(curtainsTotal)} جنيه</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {curtainItems.map(room => (
                <div key={room.id} style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", overflow: "hidden" }}>
                  <div style={{ padding: "0.9rem 1rem", borderBottom: `1px solid ${GOLD_BORDER}` }}>
                    <h3 style={{ color: GOLD, fontWeight: 700, fontSize: "1rem" }}>{room.room}</h3>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", padding: "1rem" }}>
                    {room.options.map(opt => {
                      const isSelected = selectedCurtains[room.id] === opt.id;
                      const isExpanded = expandedItem === opt.id;
                      return (
                        <div key={opt.id}
                          style={{
                            background: isSelected ? `${GOLD}10` : CARD_BG2,
                            border: `${isSelected ? 2 : 1}px solid ${isSelected ? GOLD_BORDER_ACTIVE : GOLD_BORDER}`,
                            borderRadius: "0.75rem", overflow: "hidden", transition: "all 0.2s",
                          }}>
                          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setSelectedCurtains(prev => ({ ...prev, [room.id]: opt.id }))}>
                            <img src={opt.image} alt={opt.label} style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                            {isSelected && (
                              <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", background: GOLD, borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ color: DARK, fontWeight: 900, fontSize: "0.85rem" }}>✓</span>
                              </div>
                            )}
                          </div>
                          <div style={{ padding: "0.9rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", cursor: "pointer" }}
                              onClick={() => setSelectedCurtains(prev => ({ ...prev, [room.id]: opt.id }))}>
                              <span style={{ color: isSelected ? GOLD : TEXT_PRIMARY, fontWeight: 700, fontSize: "0.88rem" }}>{opt.label}</span>
                              <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${GOLD}`, background: isSelected ? GOLD : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {isSelected && <span style={{ color: DARK, fontSize: "0.6rem", fontWeight: 900 }}>✓</span>}
                              </div>
                            </div>
                            <div style={{ color: GOLD, fontWeight: 900, fontSize: "1rem", marginBottom: "0.5rem" }}>
                              {formatPrice(opt.price)} جنيه
                            </div>
                            <button
                              style={{ background: "transparent", border: `1px solid ${GOLD_BORDER}`, color: GOLD, borderRadius: "0.35rem", padding: "0.25rem 0.65rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
                              onClick={() => setExpandedItem(isExpanded ? null : opt.id)}>
                              {isExpanded ? "إخفاء التفاصيل ▲" : "عرض التفاصيل ▼"}
                            </button>
                            {isExpanded && (
                              <div style={{ marginTop: "0.6rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                {opt.items.map((item, i) => (
                                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0.5rem", background: CARD_BG, borderRadius: "0.3rem" }}>
                                    <span style={{ color: TEXT_SECONDARY, fontSize: "0.78rem" }}>{item.name}</span>
                                    <span style={{ color: GOLD, fontSize: "0.78rem", fontWeight: 600 }}>{formatPrice(item.price)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SUMMARY SECTION ===== */}
        {/* ===== TIMELINE SECTION ===== */}
        {activeSection === "timeline" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ color: GOLD, fontSize: "1.6rem", fontWeight: 900 }}>📅 الجدول الزمني للمشروع</h2>
              <p style={{ color: TEXT_SECONDARY, fontSize: "0.9rem" }}>17 مرحلة - Project Timeline Overview - 5 Months</p>
            </div>

            {/* Contract Date Input */}
            <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <label style={{ color: GOLD, fontWeight: 700, fontSize: "0.9rem", display: "block", marginBottom: "0.5rem" }}>📋 تاريخ التعاقد</label>
                  <input
                    type="date"
                    value={contractDate}
                    onChange={e => setContractDate(e.target.value)}
                    style={{
                      background: CARD_BG2, border: `1px solid ${GOLD_BORDER}`, borderRadius: "0.5rem",
                      color: TEXT_PRIMARY, padding: "0.5rem 0.75rem", fontSize: "0.9rem",
                      fontFamily: "'Cairo', sans-serif", width: "100%", cursor: "pointer",
                    }}
                  />
                </div>
                {contractDate && computedTimeline.length > 0 && (() => {
                  const lastPhase = computedTimeline[computedTimeline.length - 1];
                  const endDate = lastPhase.endDate;
                  const currentP = currentPhaseIndex >= 0 ? computedTimeline[currentPhaseIndex] : null;
                  return (
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: "0.6rem", padding: "0.6rem 1rem", textAlign: "center" }}>
                        <div style={{ color: TEXT_MUTED, fontSize: "0.72rem" }}>تاريخ التعاقد</div>
                        <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.85rem" }}>{new Date(contractDate).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}</div>
                      </div>
                      {endDate && (
                        <div style={{ background: "oklch(0.72 0.1 130 / 15%)", border: "1px solid oklch(0.72 0.1 130 / 40%)", borderRadius: "0.6rem", padding: "0.6rem 1rem", textAlign: "center" }}>
                          <div style={{ color: TEXT_MUTED, fontSize: "0.72rem" }}>التسليم المتوقع</div>
                          <div style={{ color: "oklch(0.72 0.1 130)", fontWeight: 700, fontSize: "0.85rem" }}>{endDate.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}</div>
                        </div>
                      )}
                      {currentP && (
                        <div style={{ background: "oklch(0.65 0.15 25 / 20%)", border: "2px solid oklch(0.65 0.15 25 / 60%)", borderRadius: "0.6rem", padding: "0.6rem 1rem", textAlign: "center" }}>
                          <div style={{ color: TEXT_MUTED, fontSize: "0.72rem" }}>أنتم الآن في</div>
                          <div style={{ color: "oklch(0.78 0.15 50)", fontWeight: 900, fontSize: "0.9rem" }}>المرحلة {currentP.id}: {currentP.name}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {!contractDate && (
                <p style={{ color: TEXT_MUTED, fontSize: "0.82rem", marginTop: "0.75rem" }}>💡 أدخل تاريخ التعاقد لحساب مواعيد كل مرحلة وتحديد المرحلة الحالية تلقائياً</p>
              )}
            </div>

            {/* Timeline Phases */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {timelinePhases.map((phase, idx) => {
                const computed = computedTimeline[idx];
                const isCurrentPhase = currentPhaseIndex === idx;
                const isPast = contractDate && computed && !phase.continuous && computed.endDate && computed.endDate < today;
                const isFuture = contractDate && computed && !phase.continuous && computed.startDate > today;

                // DB status
                const dbStatus = phaseStatuses.find(s => s.phaseIndex === phase.id);
                const isDbCompleted = dbStatus?.isCompleted ?? false;

                const statusColor = isDbCompleted ? "oklch(0.72 0.1 130)" : isCurrentPhase ? "oklch(0.78 0.15 50)" : isFuture ? TEXT_MUTED : GOLD;
                const statusBg = isDbCompleted ? "oklch(0.72 0.1 130 / 12%)" : isCurrentPhase ? "oklch(0.78 0.15 50 / 20%)" : CARD_BG;
                const statusBorder = isDbCompleted ? "oklch(0.72 0.1 130 / 40%)" : isCurrentPhase ? "oklch(0.78 0.15 50 / 80%)" : GOLD_BORDER;

                // Complaints for this phase
                const phaseComplaints = allComplaints.filter(c => c.phaseIndex === phase.id);
                const openComplaints = phaseComplaints.filter(c => c.status !== "closed");

                return (
                  <div key={phase.id} style={{
                    background: statusBg,
                    border: `${isCurrentPhase ? 2 : 1}px solid ${statusBorder}`,
                    borderRadius: "0.75rem",
                    padding: "0.9rem 1.1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    position: "relative",
                    transition: "all 0.2s",
                    flexWrap: "wrap",
                  }}>
                    {/* Phase Number */}
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                      background: isDbCompleted ? "oklch(0.72 0.1 130)" : isCurrentPhase ? "oklch(0.78 0.15 50)" : CARD_BG2,
                      border: `2px solid ${statusBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", fontWeight: 900, color: isDbCompleted || isCurrentPhase ? DARK : statusColor,
                    }}>
                      {isDbCompleted ? "✓" : phase.id}
                    </div>

                    {/* Icon */}
                    <div style={{ fontSize: "1.3rem", flexShrink: 0 }}>{phase.icon}</div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: "120px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ color: isCurrentPhase ? "oklch(0.78 0.15 50)" : isDbCompleted ? "oklch(0.72 0.1 130)" : TEXT_PRIMARY, fontWeight: 700, fontSize: "0.9rem" }}>
                          {phase.name}
                        </span>
                        {isCurrentPhase && !isDbCompleted && (
                          <span style={{ background: "oklch(0.78 0.15 50)", color: DARK, fontSize: "0.65rem", fontWeight: 900, padding: "2px 8px", borderRadius: "999px" }}>أنتم هنا الآن 📍</span>
                        )}
                        {isDbCompleted && (
                          <span style={{ background: "oklch(0.72 0.1 130 / 30%)", color: "oklch(0.72 0.1 130)", fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" }}>✅ تم الإنجاز</span>
                        )}
                        {dbStatus && !isDbCompleted && (
                          <span style={{ background: "oklch(0.65 0.15 30 / 20%)", color: "oklch(0.65 0.15 30)", fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" }}>⏳ قيد التنفيذ</span>
                        )}
                        {phase.continuous && (
                          <span style={{ background: `${GOLD}20`, color: GOLD, fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" }}>🔄 مستمر</span>
                        )}
                        {openComplaints.length > 0 && (
                          <span style={{ background: "oklch(0.55 0.2 30 / 20%)", color: "oklch(0.65 0.2 30)", fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" }}>⚠️ {openComplaints.length} شكوى مفتوحة</span>
                        )}
                      </div>
                      <div style={{ color: TEXT_MUTED, fontSize: "0.78rem", marginTop: "0.2rem" }}>{phase.desc}</div>
                      {dbStatus?.completedBy && (
                        <div style={{ color: TEXT_MUTED, fontSize: "0.7rem", marginTop: "0.15rem" }}>✍️ {isDbCompleted ? "أنجزه" : "تحديث بواسطة"}: {dbStatus.completedBy}</div>
                      )}
                    </div>

                    {/* Duration & Dates */}
                    <div style={{ textAlign: "left", flexShrink: 0 }}>
                      {!phase.continuous && (
                        <div style={{ color: TEXT_SECONDARY, fontSize: "0.75rem", fontWeight: 600 }}>
                          {phase.minDays === phase.maxDays ? `${phase.minDays} يوم` : `${phase.minDays} - ${phase.maxDays} يوم`}
                        </div>
                      )}
                      {computed && !phase.continuous && (
                        <div style={{ color: TEXT_MUTED, fontSize: "0.7rem", marginTop: "0.2rem" }}>
                          {computed.startDate.toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                          {computed.endDate && computed.endDate.getTime() !== computed.startDate.getTime() && (
                            <> → {computed.endDate.toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}</>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flexShrink: 0 }}>
                      {/* Status Toggle - Engineer/Admin only */}
                      {projectUser && (projectUser.role === "engineer" || projectUser.role === "admin") && (
                        <button
                          onClick={() => setStatusMutation.mutate({
                            phaseIndex: phase.id,
                            isCompleted: !isDbCompleted,
                            username: projectUser.username,
                            role: projectUser.role,
                          })}
                          style={{
                            background: isDbCompleted ? "oklch(0.72 0.1 130 / 20%)" : `${GOLD}20`,
                            border: `1px solid ${isDbCompleted ? "oklch(0.72 0.1 130)" : GOLD}`,
                            color: isDbCompleted ? "oklch(0.72 0.1 130)" : GOLD,
                            borderRadius: "0.4rem", padding: "0.25rem 0.6rem",
                            fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                            fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap",
                          }}
                        >
                          {isDbCompleted ? "↩️ إلغاء الإنجاز" : "✅ تم الإنجاز"}
                        </button>
                      )}

                      {/* Complaint Button - Client/Anyone */}
                      <button
                        onClick={() => {
                          if (!projectUser) { setShowLogin(true); return; }
                          setComplaintModal({ phaseIndex: phase.id, phaseName: phase.name });
                          setComplaintTitle(""); setComplaintDesc(""); setComplaintImg(null);
                        }}
                        style={{
                          background: "oklch(0.55 0.2 30 / 10%)",
                          border: "1px solid oklch(0.55 0.2 30 / 40%)",
                          color: "oklch(0.65 0.2 30)",
                          borderRadius: "0.4rem", padding: "0.25rem 0.6rem",
                          fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                          fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap",
                        }}
                      >
                        📝 شكوى / مراجعة
                      </button>

                      {/* View Complaints */}
                      {phaseComplaints.length > 0 && (
                        <button
                          onClick={() => {
                            if (!projectUser) { setShowLogin(true); return; }
                            // Show first complaint's replies
                            setRepliesModal({ id: phaseComplaints[0].id, title: phaseComplaints[0].title, phaseIndex: phase.id });
                          }}
                          style={{
                            background: "oklch(0.5 0.15 270 / 10%)",
                            border: "1px solid oklch(0.5 0.15 270 / 40%)",
                            color: "oklch(0.65 0.15 270)",
                            borderRadius: "0.4rem", padding: "0.25rem 0.6rem",
                            fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                            fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap",
                          }}
                        >
                          💬 عرض الشكاوى ({phaseComplaints.length})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Duration Summary */}
            {contractDate && computedTimeline.length > 0 && (
              <div style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: "0.75rem", padding: "1rem", marginTop: "1.25rem", textAlign: "center" }}>
                <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.9rem" }}>
                  ⏱️ إجمالي مدة المشروع التقديرية: ~5 أشهر (150 يوم) | التسليم المتوقع:{" "}
                  {computedTimeline[computedTimeline.length - 1].endDate?.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "summary" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ color: GOLD, fontSize: "1.6rem", fontWeight: 900 }}>📊 ملخص الاختيارات</h2>
                <p style={{ color: TEXT_SECONDARY, fontSize: "0.9rem" }}>مراجعة جميع الاختيارات والإجمالي النهائي</p>
              </div>
              {grandTotal > 0 && (
                <button onClick={handlePrint}
                  style={{ background: GOLD, color: DARK, border: "none", borderRadius: "0.5rem", padding: "0.6rem 1.2rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  🖨️ طباعة الملخص
                </button>
              )}
            </div>

            {/* Client Info */}
            <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                {[
                  { label: "العميل", value: "مستر علي راشد" },
                  { label: "الموقع", value: "مدينتي" },
                  { label: "المساحة", value: "140 متر" },
                  { label: "التاريخ", value: "مارس 2026" },
                ].map((info, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ color: TEXT_SECONDARY, fontSize: "0.78rem" }}>{info.label}</div>
                    <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.95rem" }}>{info.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Finishing Summary */}
            {selectedFinishing.size > 0 && (
              <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1rem" }}>
                <h3 style={{ color: GOLD, fontWeight: 700, marginBottom: "0.75rem", fontSize: "1rem" }}>🔨 التشطيب</h3>
                {finishingItems.filter(i => selectedFinishing.has(i.id)).map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: `1px solid ${GOLD_BORDER}` }}>
                    <span style={{ color: TEXT_PRIMARY, fontSize: "0.88rem" }}>{item.name}</span>
                    <span style={{ color: GOLD, fontWeight: 600 }}>{formatPrice(item.price)} جنيه</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: `2px solid ${GOLD_BORDER}` }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>إجمالي التشطيب</span>
                  <span style={{ color: GOLD, fontWeight: 900, fontSize: "1.05rem" }}>{formatPrice(finishingTotal)} جنيه</span>
                </div>
              </div>
            )}

            {/* Furniture Summary */}
            {Object.keys(selectedFurniture).length > 0 && (
              <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1rem" }}>
                <h3 style={{ color: GOLD, fontWeight: 700, marginBottom: "0.75rem", fontSize: "1rem" }}>🛋️ الأثاث</h3>
                {Object.entries(selectedFurniture).map(([rId, oId]) => {
                  const r = furnitureItems.find(r => r.id === rId);
                  const o = r?.options.find(o => o.id === oId);
                  if (!r || !o) return null;
                  return (
                    <div key={rId} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: `1px solid ${GOLD_BORDER}` }}>
                      <span style={{ color: TEXT_PRIMARY, fontSize: "0.88rem" }}>{r.room} - {o.label}</span>
                      <span style={{ color: GOLD, fontWeight: 600 }}>{formatPrice(o.price)} جنيه</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: `2px solid ${GOLD_BORDER}` }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>إجمالي الأثاث</span>
                  <span style={{ color: GOLD, fontWeight: 900, fontSize: "1.05rem" }}>{formatPrice(furnitureTotal)} جنيه</span>
                </div>
              </div>
            )}

            {/* Smart Home Summary */}
            {selectedSmart && (() => {
              const opt = smartHomeOptions.find(o => o.id === selectedSmart);
              return opt ? (
                <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1rem" }}>
                  <h3 style={{ color: GOLD, fontWeight: 700, marginBottom: "0.75rem", fontSize: "1rem" }}>🏡 Smart Home System</h3>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: TEXT_PRIMARY, fontSize: "0.88rem" }}>{opt.label}</span>
                    <span style={{ color: GOLD, fontWeight: 900, fontSize: "1.05rem" }}>{formatPrice(opt.price)} جنيه</span>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Curtains Summary */}
            {Object.keys(selectedCurtains).length > 0 && (
              <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1rem" }}>
                <h3 style={{ color: GOLD, fontWeight: 700, marginBottom: "0.75rem", fontSize: "1rem" }}>🪟 الستائر</h3>
                {Object.entries(selectedCurtains).map(([rId, oId]) => {
                  const r = curtainItems.find(r => r.id === rId);
                  const o = r?.options.find(o => o.id === oId);
                  if (!r || !o) return null;
                  return (
                    <div key={rId} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: `1px solid ${GOLD_BORDER}` }}>
                      <span style={{ color: TEXT_PRIMARY, fontSize: "0.88rem" }}>{r.room} - {o.label}</span>
                      <span style={{ color: GOLD, fontWeight: 600 }}>{formatPrice(o.price)} جنيه</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: `2px solid ${GOLD_BORDER}` }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>إجمالي الستائر</span>
                  <span style={{ color: GOLD, fontWeight: 900, fontSize: "1.05rem" }}>{formatPrice(curtainsTotal)} جنيه</span>
                </div>
              </div>
            )}

            {/* Payment Schedule */}
            {grandTotal > 0 && contractDate && computedTimeline.length > 0 && (() => {
              // Payment milestones based on phase end dates
              const phase11 = computedTimeline[10]; // index 10 = phase 11
              const phase15 = computedTimeline[14]; // index 14 = phase 15
              const phase16 = computedTimeline[15]; // index 15 = phase 16
              const contractDateObj = new Date(contractDate);

              const payments = [
                {
                  label: "دفعة التعاقد",
                  pct: 50,
                  amount: Math.round(grandTotal * 0.5),
                  date: contractDateObj,
                  icon: "🤝",
                  desc: "عند توقيع العقد",
                  color: "#d4af37",
                },
                {
                  label: "الدفعة الأولى",
                  pct: 20,
                  amount: Math.round(grandTotal * 0.2),
                  date: phase11?.endDate ?? null,
                  icon: "🔧",
                  desc: "بعد إنهاء أعمال التأسيس (المرحلة 11)",
                  color: "#60a5fa",
                },
                {
                  label: "الدفعة الثانية",
                  pct: 20,
                  amount: Math.round(grandTotal * 0.2),
                  date: phase15?.endDate ?? null,
                  icon: "🖌️",
                  desc: "بعد إنهاء أعمال الدهانات (المرحلة 15)",
                  color: "#a78bfa",
                },
                {
                  label: "دفعة التسليم",
                  pct: 10,
                  amount: Math.round(grandTotal * 0.1),
                  date: phase16?.endDate ?? null,
                  icon: "🎉",
                  desc: "بعد البروفة والتسليم النهائي (المرحلة 16)",
                  color: "#34d399",
                },
              ];

              return (
                <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1rem" }}>
                  <h3 style={{ color: GOLD, fontWeight: 700, marginBottom: "1rem", fontSize: "1rem" }}>💳 جدول الدفعات</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
                    {payments.map((p, i) => (
                      <div key={i} style={{
                        background: `${p.color}12`,
                        border: `1px solid ${p.color}40`,
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        position: "relative",
                        overflow: "hidden",
                      }}>
                        {/* Percentage badge */}
                        <div style={{
                          position: "absolute", top: "0.75rem", left: "0.75rem",
                          background: p.color, color: "#000", borderRadius: "999px",
                          padding: "2px 10px", fontSize: "0.72rem", fontWeight: 900,
                        }}>{p.pct}%</div>
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{p.icon}</div>
                        <div style={{ color: p.color, fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{p.label}</div>
                        <div style={{ color: TEXT_PRIMARY, fontWeight: 900, fontSize: "1.3rem", marginBottom: "0.25rem" }}>
                          {formatPrice(p.amount)} <span style={{ fontSize: "0.75rem", color: TEXT_SECONDARY }}>جنيه</span>
                        </div>
                        <div style={{ color: TEXT_MUTED, fontSize: "0.72rem", marginBottom: "0.4rem" }}>{p.desc}</div>
                        {p.date && (
                          <div style={{ background: `${p.color}20`, borderRadius: "0.4rem", padding: "4px 8px", display: "inline-block" }}>
                            <span style={{ color: p.color, fontSize: "0.75rem", fontWeight: 700 }}>
                              📅 {p.date.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: `${GOLD}10`, borderRadius: "0.5rem", textAlign: "center" }}>
                    <span style={{ color: TEXT_SECONDARY, fontSize: "0.8rem" }}>⚠️ المواعيد تقديرية بناءً على تاريخ التعاقد المُدخل وقد تتغير حسب سير الأعمال</span>
                  </div>
                </div>
              );
            })()}

            {/* Grand Total */}
            {grandTotal > 0 ? (
              <div style={{ background: `linear-gradient(135deg, ${GOLD}, oklch(0.6 0.1 75))`, borderRadius: "1rem", padding: "1.75rem", textAlign: "center" }}>
                <div style={{ color: DARK, fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>الإجمالي النهائي لجميع الاختيارات</div>
                <div style={{ color: DARK, fontSize: "2.8rem", fontWeight: 900, lineHeight: 1 }}>{formatPrice(grandTotal)}</div>
                <div style={{ color: DARK, fontSize: "1.1rem", fontWeight: 600, marginTop: "0.25rem" }}>جنيه مصري</div>
                <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                  {finishingTotal > 0 && <div style={{ background: "oklch(0.1 0.005 285 / 30%)", borderRadius: "0.5rem", padding: "0.4rem 0.8rem", fontSize: "0.82rem", color: DARK }}>تشطيب: {formatPrice(finishingTotal)}</div>}
                  {furnitureTotal > 0 && <div style={{ background: "oklch(0.1 0.005 285 / 30%)", borderRadius: "0.5rem", padding: "0.4rem 0.8rem", fontSize: "0.82rem", color: DARK }}>أثاث: {formatPrice(furnitureTotal)}</div>}
                  {smartTotal > 0 && <div style={{ background: "oklch(0.1 0.005 285 / 30%)", borderRadius: "0.5rem", padding: "0.4rem 0.8rem", fontSize: "0.82rem", color: DARK }}>Smart Home: {formatPrice(smartTotal)}</div>}
                  {curtainsTotal > 0 && <div style={{ background: "oklch(0.1 0.005 285 / 30%)", borderRadius: "0.5rem", padding: "0.4rem 0.8rem", fontSize: "0.82rem", color: DARK }}>ستائر: {formatPrice(curtainsTotal)}</div>}
                </div>
              </div>
            ) : (
              <div style={{ background: CARD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: "1rem", padding: "2rem", textAlign: "center" }}>
                <p style={{ color: TEXT_SECONDARY, fontSize: "1rem" }}>لم يتم اختيار أي بنود بعد. يرجى الانتقال إلى الأقسام المختلفة واختيار ما يناسبك.</p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1rem", flexWrap: "wrap" }}>
                  {(["finishing", "furniture", "smart", "curtains"] as const).map(s => (
                    <button key={s} onClick={() => setActiveSection(s)}
                      style={{ background: "transparent", border: `1px solid ${GOLD}`, color: GOLD, borderRadius: "0.5rem", padding: "0.4rem 0.9rem", fontSize: "0.85rem", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                      {s === "finishing" ? "🔨 التشطيب" : s === "furniture" ? "🛋️ الأثاث" : s === "smart" ? "🏡 Smart Home" : "🪟 الستائر"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* ===== LOGIN MODAL ===== */}
      {showLogin && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }} onClick={() => setShowLogin(false)}>
          <div style={{
            background: "oklch(0.14 0.006 285)", border: `1px solid ${GOLD}60`,
            borderRadius: "1rem", padding: "2rem", width: "100%", maxWidth: "380px",
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: GOLD, fontSize: "1.2rem", fontWeight: 900, marginBottom: "1.5rem", textAlign: "center" }}>🔐 تسجيل الدخول</h3>
            <ProjectLogin
              onLogin={(user) => {
                setProjectUser(user);
                setShowLogin(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ===== COMPLAINT MODAL ===== */}
      {complaintModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }} onClick={() => setComplaintModal(null)}>
          <div style={{
            background: "oklch(0.14 0.006 285)", border: `1px solid oklch(0.55 0.2 30 / 60%)`,
            borderRadius: "1rem", padding: "1.5rem", width: "100%", maxWidth: "480px",
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "oklch(0.65 0.2 30)", fontSize: "1.1rem", fontWeight: 900, marginBottom: "0.5rem" }}>📝 شكوى / طلب مراجعة</h3>
            <p style={{ color: TEXT_MUTED, fontSize: "0.8rem", marginBottom: "1rem" }}>المرحلة: {complaintModal.phaseName}</p>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ color: TEXT_SECONDARY, fontSize: "0.8rem", display: "block", marginBottom: "0.3rem" }}>عنوان الشكوى *</label>
              <input
                value={complaintTitle}
                onChange={e => setComplaintTitle(e.target.value)}
                placeholder="اكتب عنوان الشكوى..."
                style={{
                  width: "100%", background: CARD_BG2, border: `1px solid ${GOLD_BORDER}`,
                  borderRadius: "0.5rem", padding: "0.5rem 0.75rem", color: TEXT_PRIMARY,
                  fontSize: "0.85rem", fontFamily: "'Cairo', sans-serif", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ color: TEXT_SECONDARY, fontSize: "0.8rem", display: "block", marginBottom: "0.3rem" }}>تفاصيل الشكوى</label>
              <textarea
                value={complaintDesc}
                onChange={e => setComplaintDesc(e.target.value)}
                placeholder="اشرح المشكلة بالتفصيل..."
                rows={3}
                style={{
                  width: "100%", background: CARD_BG2, border: `1px solid ${GOLD_BORDER}`,
                  borderRadius: "0.5rem", padding: "0.5rem 0.75rem", color: TEXT_PRIMARY,
                  fontSize: "0.85rem", fontFamily: "'Cairo', sans-serif", resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ color: TEXT_SECONDARY, fontSize: "0.8rem", display: "block", marginBottom: "0.3rem" }}>📷 إرفاق صورة (اختياري)</label>
              <input
                type="file" accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const base64 = (ev.target?.result as string).split(",")[1];
                    setComplaintImg({ base64, mime: file.type });
                  };
                  reader.readAsDataURL(file);
                }}
                style={{ color: TEXT_SECONDARY, fontSize: "0.8rem" }}
              />
              {complaintImg && <p style={{ color: "oklch(0.72 0.1 130)", fontSize: "0.75rem", marginTop: "0.25rem" }}>✅ تم اختيار الصورة</p>}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                disabled={!complaintTitle.trim() || complaintLoading}
                onClick={async () => {
                  if (!projectUser || !complaintTitle.trim()) return;
                  setComplaintLoading(true);
                  try {
                    await createComplaintMutation.mutateAsync({
                      phaseIndex: complaintModal.phaseIndex,
                      title: complaintTitle.trim(),
                      description: complaintDesc.trim() || complaintTitle.trim(),
                      imageBase64: complaintImg?.base64,
                      imageMimeType: complaintImg?.mime,
                      submittedBy: projectUser.username,
                      submitterName: projectUser.displayName,
                    });
                    setComplaintModal(null);
                  } finally {
                    setComplaintLoading(false);
                  }
                }}
                style={{
                  flex: 1, background: complaintTitle.trim() ? "oklch(0.55 0.2 30)" : CARD_BG2,
                  border: "none", color: complaintTitle.trim() ? "white" : TEXT_MUTED,
                  borderRadius: "0.5rem", padding: "0.6rem", fontSize: "0.85rem",
                  fontWeight: 700, cursor: complaintTitle.trim() ? "pointer" : "not-allowed",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {complaintLoading ? "جاري الإرسال..." : "📤 إرسال الشكوى"}
              </button>
              <button
                onClick={() => setComplaintModal(null)}
                style={{
                  background: "transparent", border: `1px solid ${GOLD_BORDER}`, color: TEXT_MUTED,
                  borderRadius: "0.5rem", padding: "0.6rem 1rem", fontSize: "0.85rem",
                  cursor: "pointer", fontFamily: "'Cairo', sans-serif",
                }}
              >إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REPLIES MODAL ===== */}
      {repliesModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }} onClick={() => setRepliesModal(null)}>
          <div style={{
            background: "oklch(0.14 0.006 285)", border: `1px solid oklch(0.5 0.15 270 / 60%)`,
            borderRadius: "1rem", padding: "1.5rem", width: "100%", maxWidth: "520px",
            maxHeight: "80vh", overflow: "auto",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ color: "oklch(0.65 0.15 270)", fontSize: "1.1rem", fontWeight: 900 }}>💬 {repliesModal.title}</h3>
                <p style={{ color: TEXT_MUTED, fontSize: "0.75rem" }}>المرحلة {repliesModal.phaseIndex}</p>
              </div>
              {/* Close complaint button - aftersales/admin only */}
              {projectUser && (projectUser.role === "aftersales" || projectUser.role === "admin") && (
                <button
                  onClick={() => closeMutation.mutate({ complaintId: repliesModal.id, closedBy: projectUser.username, role: projectUser.role })}
                  style={{
                    background: "oklch(0.72 0.1 130 / 20%)", border: "1px solid oklch(0.72 0.1 130)",
                    color: "oklch(0.72 0.1 130)", borderRadius: "0.4rem", padding: "0.3rem 0.7rem",
                    fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  ✅ إغلاق الشكوى
                </button>
              )}
            </div>

            {/* Replies list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              {(repliesQuery.data ?? []).length === 0 ? (
                <p style={{ color: TEXT_MUTED, fontSize: "0.85rem", textAlign: "center" }}>لا توجد ردود بعد</p>
              ) : (
                (repliesQuery.data ?? []).map((reply: any) => (
                  <div key={reply.id} style={{
                    background: CARD_BG2, borderRadius: "0.5rem", padding: "0.75rem",
                    border: `1px solid ${GOLD_BORDER}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ color: GOLD, fontSize: "0.78rem", fontWeight: 700 }}>{reply.authorName}</span>
                      <span style={{ color: TEXT_MUTED, fontSize: "0.7rem" }}>{new Date(reply.createdAt).toLocaleDateString("ar-EG")}</span>
                    </div>
                    <p style={{ color: TEXT_PRIMARY, fontSize: "0.85rem", margin: 0 }}>{reply.content}</p>
                    {reply.imageUrl && (
                      <img src={reply.imageUrl} alt="مرفق" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain", marginTop: "0.5rem", borderRadius: "0.4rem" }} />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add reply - engineers/admin/aftersales */}
            {projectUser && (projectUser.role !== "client") && (
              <div>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                  rows={2}
                  style={{
                    width: "100%", background: CARD_BG2, border: `1px solid ${GOLD_BORDER}`,
                    borderRadius: "0.5rem", padding: "0.5rem 0.75rem", color: TEXT_PRIMARY,
                    fontSize: "0.85rem", fontFamily: "'Cairo', sans-serif", resize: "vertical", boxSizing: "border-box",
                    marginBottom: "0.5rem",
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="file" accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const base64 = (ev.target?.result as string).split(",")[1];
                        setReplyImg({ base64, mime: file.type });
                      };
                      reader.readAsDataURL(file);
                    }}
                    style={{ color: TEXT_MUTED, fontSize: "0.75rem", flex: 1 }}
                  />
                  <button
                    disabled={!replyText.trim()}
                    onClick={() => {
                      if (!replyText.trim() || !projectUser) return;
                      addReplyMutation.mutate({
                        complaintId: repliesModal.id,
                        message: replyText.trim(),
                        imageBase64: replyImg?.base64,
                        imageMimeType: replyImg?.mime,
                        repliedBy: projectUser.username,
                        replierName: projectUser.displayName,
                        replierRole: projectUser.role,
                      });
                      setReplyText(""); setReplyImg(null);
                    }}
                    style={{
                      background: replyText.trim() ? GOLD : CARD_BG2, border: "none",
                      color: replyText.trim() ? DARK : TEXT_MUTED,
                      borderRadius: "0.5rem", padding: "0.5rem 1rem",
                      fontSize: "0.82rem", fontWeight: 700, cursor: replyText.trim() ? "pointer" : "not-allowed",
                      fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap",
                    }}
                  >
                    إرسال الرد
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setRepliesModal(null)}
              style={{
                marginTop: "1rem", background: "transparent", border: `1px solid ${GOLD_BORDER}`,
                color: TEXT_MUTED, borderRadius: "0.5rem", padding: "0.4rem 1rem",
                fontSize: "0.82rem", cursor: "pointer", fontFamily: "'Cairo', sans-serif", width: "100%",
              }}
            >إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
