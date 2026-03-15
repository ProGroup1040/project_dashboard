import { useState } from "react";

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

type Section = "home" | "finishing" | "furniture" | "smart" | "curtains" | "summary";

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("home");
  const [selectedFinishing, setSelectedFinishing] = useState<Set<string>>(new Set());
  const [selectedFurniture, setSelectedFurniture] = useState<Record<string, string>>({});
  const [selectedSmart, setSelectedSmart] = useState<string | null>(null);
  const [selectedCurtains, setSelectedCurtains] = useState<Record<string, string>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);

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

  const navItems: { id: Section; label: string; icon: string; count?: number }[] = [
    { id: "home", label: "الرئيسية", icon: "🏠" },
    { id: "finishing", label: "التشطيب", icon: "🔨", count: selectedFinishing.size },
    { id: "furniture", label: "الأثاث", icon: "🛋️", count: Object.keys(selectedFurniture).length },
    { id: "smart", label: "Smart Home", icon: "🏡", count: selectedSmart ? 1 : 0 },
    { id: "curtains", label: "الستائر", icon: "🪟", count: Object.keys(selectedCurtains).length },
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
                {teamData.filter(m => m.level === 1).map(member => (
                  <div key={member.id}
                    onClick={() => setSelectedTeamMember(selectedTeamMember === member.id ? null : member.id)}
                    style={{
                      cursor: "pointer",
                      background: selectedTeamMember === member.id ? `${GOLD}18` : CARD_BG2,
                      border: `2px solid ${selectedTeamMember === member.id ? GOLD : GOLD_BORDER}`,
                      borderRadius: "1rem",
                      padding: "1rem 1.5rem",
                      textAlign: "center",
                      minWidth: "200px",
                      maxWidth: "240px",
                      position: "relative",
                    }}>
                    <div style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: GOLD, color: DARK, fontSize: "0.65rem", fontWeight: 900, padding: "2px 10px", borderRadius: "999px" }}>قيادة</div>
                    {member.img && <img src={member.img} alt={member.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0.5rem auto 0.5rem", display: "block", border: `3px solid ${GOLD}` }} />}
                    <div style={{ color: GOLD, fontWeight: 800, fontSize: "0.95rem" }}>{member.name}</div>
                    <div style={{ color: TEXT_PRIMARY, fontSize: "0.78rem", marginTop: "0.2rem" }}>{member.title}</div>
                    <div style={{ color: TEXT_MUTED, fontSize: "0.72rem", marginTop: "0.15rem" }}>{member.role}</div>
                  </div>
                ))}
              </div>

              {/* Connector line */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "0" }}>
                <div style={{ width: "2px", height: "24px", background: GOLD_BORDER }} />
              </div>

              {/* Level 2 - Direct Reports */}
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", paddingTop: "0" }}>
                {/* Horizontal line connecting level 2 */}
                <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-start", gap: "0" }}>
                  {teamData.filter(m => m.level === 2).map((member, idx, arr) => (
                    <div key={member.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: "220px" }}>
                      <div style={{ width: "2px", height: "20px", background: GOLD_BORDER }} />
                      <div
                        onClick={() => setSelectedTeamMember(selectedTeamMember === member.id ? null : member.id)}
                        style={{
                          cursor: "pointer",
                          background: selectedTeamMember === member.id ? `${GOLD}18` : CARD_BG2,
                          border: `2px solid ${selectedTeamMember === member.id ? GOLD : GOLD_BORDER}`,
                          borderRadius: "0.85rem",
                          padding: "0.85rem 1rem",
                          textAlign: "center",
                          width: "100%",
                          position: "relative",
                        }}>
                        <div style={{ position: "absolute", top: "-9px", left: "50%", transform: "translateX(-50%)", background: "oklch(0.72 0.1 75)", color: DARK, fontSize: "0.6rem", fontWeight: 900, padding: "2px 8px", borderRadius: "999px", whiteSpace: "nowrap" }}>{member.department}</div>
                        {member.img && <img src={member.img} alt={member.name} style={{ width: "65px", height: "65px", borderRadius: "50%", objectFit: "cover", margin: "0.4rem auto 0.4rem", display: "block", border: `2px solid oklch(0.72 0.1 75)` }} />}
                        <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.85rem" }}>{member.name}</div>
                        <div style={{ color: TEXT_PRIMARY, fontSize: "0.72rem", marginTop: "0.15rem" }}>{member.title}</div>
                      </div>
                    </div>
                  ))}
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
                  {teamData.filter(m => m.level === 3).map(member => (
                    <div key={member.id}
                      onClick={() => setSelectedTeamMember(selectedTeamMember === member.id ? null : member.id)}
                      style={{
                        cursor: "pointer",
                        background: selectedTeamMember === member.id ? `${GOLD}18` : CARD_BG2,
                        border: `2px solid ${selectedTeamMember === member.id ? GOLD : GOLD_BORDER}`,
                        borderRadius: "0.75rem",
                        padding: "0.85rem",
                        textAlign: "center",
                        position: "relative",
                      }}>
                      <div style={{ position: "absolute", top: "-9px", left: "50%", transform: "translateX(-50%)", background: "oklch(0.65 0.08 75)", color: DARK, fontSize: "0.6rem", fontWeight: 900, padding: "2px 8px", borderRadius: "999px", whiteSpace: "nowrap" }}>{member.department}</div>
                      {member.img && <img src={member.img} alt={member.name} style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", margin: "0.4rem auto 0.4rem", display: "block", border: `2px solid oklch(0.65 0.08 75)` }} />}
                      <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.82rem" }}>{member.name}</div>
                      <div style={{ color: TEXT_SECONDARY, fontSize: "0.7rem", marginTop: "0.1rem" }}>{member.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 4 - Support Team */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ textAlign: "center", color: TEXT_MUTED, fontSize: "0.75rem", marginBottom: "0.75rem", fontWeight: 600, letterSpacing: "0.05em" }}>——— فريق الدعم والتخصصات ———</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.65rem" }}>
                  {teamData.filter(m => m.level === 4).map(member => (
                    <div key={member.id}
                      onClick={() => setSelectedTeamMember(selectedTeamMember === member.id ? null : member.id)}
                      style={{
                        cursor: "pointer",
                        background: selectedTeamMember === member.id ? `${GOLD}18` : CARD_BG2,
                        border: `2px solid ${selectedTeamMember === member.id ? GOLD : GOLD_BORDER}`,
                        borderRadius: "0.65rem",
                        padding: "0.75rem 0.65rem",
                        textAlign: "center",
                        position: "relative",
                      }}>
                      <div style={{ position: "absolute", top: "-9px", left: "50%", transform: "translateX(-50%)", background: "oklch(0.58 0.06 75)", color: DARK, fontSize: "0.58rem", fontWeight: 900, padding: "2px 7px", borderRadius: "999px", whiteSpace: "nowrap" }}>{member.department}</div>
                      {member.img && <img src={member.img} alt={member.name} style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", margin: "0.4rem auto 0.35rem", display: "block", border: `2px solid oklch(0.58 0.06 75)` }} />}
                      <div style={{ color: GOLD, fontWeight: 700, fontSize: "0.78rem" }}>{member.name}</div>
                      <div style={{ color: TEXT_SECONDARY, fontSize: "0.67rem", marginTop: "0.1rem" }}>{member.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member Detail Panel */}
              {selectedTeamMember && (() => {
                const m = teamData.find(x => x.id === selectedTeamMember);
                if (!m) return null;
                return (
                  <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}50`, borderRadius: "0.85rem", padding: "1.25rem", marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                      {m.img && <img src={m.img} alt={m.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: `3px solid ${GOLD}`, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ color: GOLD, fontWeight: 800, fontSize: "1rem" }}>{m.name}</span>
                          <span style={{ background: GOLD, color: DARK, fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" }}>{m.department}</span>
                        </div>
                        <div style={{ color: TEXT_PRIMARY, fontSize: "0.85rem", marginBottom: "0.75rem" }}>{m.title}</div>
                        <div style={{ color: TEXT_SECONDARY, fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.5rem" }}>📌 المهام والمسؤوليات:</div>
                        <ul style={{ margin: 0, paddingRight: "1.2rem", listStyle: "none" }}>
                          {m.duties.map((d, i) => (
                            <li key={i} style={{ color: TEXT_PRIMARY, fontSize: "0.8rem", lineHeight: 1.7, marginBottom: "0.25rem", display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
                              <span style={{ color: GOLD, flexShrink: 0, marginTop: "0.1rem" }}>◆</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button onClick={() => setSelectedTeamMember(null)} style={{ background: "transparent", border: "none", color: TEXT_MUTED, cursor: "pointer", fontSize: "1.2rem", padding: "0.25rem", flexShrink: 0 }}>✕</button>
                    </div>
                  </div>
                );
              })()}
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
    </div>
  );
}
