import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRight, ImagePlus, Pencil, Plus, Save, ShieldAlert, Trash2, X } from "lucide-react";

type Accessory = {
  id: number;
  brand: string;
  nameAr: string;
  price: number;
  sortOrder: number;
  videoUrl: string | null;
  imageUrl: string | null;
  salesScript: string | null;
  isActive: boolean;
};

const emptyForm = {
  brand: "JT",
  nameAr: "",
  price: "0",
  sortOrder: "0",
  videoUrl: "",
  salesScript: "",
};

async function readImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("الصورة يجب أن تكون JPG أو PNG أو WEBP");
  }
  if (file.size > 8 * 1024 * 1024) throw new Error("حجم الصورة يجب ألا يتجاوز 8 ميجابايت");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة الصورة"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      if (comma < 0) reject(new Error("صيغة الصورة غير صالحة"));
      else resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

export default function KitchenAccessoryAdmin() {
  const utils = trpc.useUtils();
  const { data: currentUser, isLoading: authLoading } = trpc.auth.me.useQuery();
  const { data: accessories = [], isLoading, error } = trpc.kitchenAccessoryAdmin.list.useQuery();
  const createMutation = trpc.kitchenAccessoryAdmin.create.useMutation();
  const updateMutation = trpc.kitchenAccessoryAdmin.update.useMutation();
  const deactivateMutation = trpc.kitchenAccessoryAdmin.deactivate.useMutation();
  const [editing, setEditing] = useState<Accessory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => [...accessories].sort((a, b) => a.sortOrder - b.sortOrder), [accessories]);

  const reset = () => {
    setEditing(null);
    setForm(emptyForm);
    setImage(null);
    setImagePreview("");
  };

  const startEdit = (item: Accessory) => {
    setEditing(item);
    setForm({
      brand: item.brand,
      nameAr: item.nameAr,
      price: String(item.price),
      sortOrder: String(item.sortOrder),
      videoUrl: item.videoUrl ?? "",
      salesScript: item.salesScript ?? "",
    });
    setImage(null);
    setImagePreview(item.imageUrl ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nameAr.trim()) return toast.error("اكتب اسم الإكسسوار");
    const price = Number(form.price);
    const sortOrder = Number(form.sortOrder);
    if (!Number.isInteger(price) || price < 0) return toast.error("السعر يجب أن يكون رقمًا صحيحًا غير سالب");
    if (!Number.isInteger(sortOrder) || sortOrder < 0) return toast.error("ترتيب العرض غير صحيح");
    setSaving(true);
    try {
      const media = image ? { imageBase64: await readImage(image), imageMimeType: image.type as "image/jpeg" | "image/png" | "image/webp" } : {};
      const common = {
        brand: form.brand.trim(),
        nameAr: form.nameAr.trim(),
        price,
        sortOrder,
        videoUrl: form.videoUrl.trim(),
        salesScript: form.salesScript.trim(),
        ...media,
      };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...common });
        toast.success("تم تحديث الإكسسوار");
      } else {
        await createMutation.mutateAsync(common);
        toast.success("تمت إضافة الإكسسوار");
      }
      await utils.kitchenAccessoryAdmin.list.invalidate();
      await utils.kitchen.getAccessories.invalidate();
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر حفظ الإكسسوار");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: Accessory) => {
    try {
      if (item.isActive) {
        await deactivateMutation.mutateAsync({ id: item.id });
      } else {
        await updateMutation.mutateAsync({ id: item.id, isActive: true });
      }
      await utils.kitchenAccessoryAdmin.list.invalidate();
      await utils.kitchen.getAccessories.invalidate();
      toast.success(item.isActive ? "تم إيقاف الإكسسوار مع الحفاظ على عروض الأسعار السابقة" : "تم تفعيل الإكسسوار");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر تغيير حالة الإكسسوار");
    }
  };

  if (authLoading) {
    return <main className="min-h-screen bg-background p-8" dir="rtl"><p className="text-sm text-muted-foreground">جاري التحقق من الصلاحيات...</p></main>;
  }
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <main className="min-h-screen bg-background p-8" dir="rtl">
        <section className="mx-auto max-w-xl rounded-2xl border p-6 text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <h1 className="text-xl font-bold">غير مصرح لك بإدارة الإكسسوارات</h1>
          <p className="mt-2 text-sm text-muted-foreground">تسجيل الدخول بحساب مستخدم عادي لا يمنح صلاحيات إدارة الكتالوج.</p>
          <Link href="/brand/professor_kitchens/kitchens" className="mt-4 inline-block text-sm underline">العودة لنظام التسعير</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Link href="/brand/professor_kitchens/kitchens" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-4 w-4" /> العودة لنظام التسعير
            </Link>
            <h1 className="text-2xl font-bold">إدارة إكسسوارات المطابخ</h1>
            <p className="text-sm text-muted-foreground">إدارة الصور والأسعار وسكريبت المبيعات. صلاحية الإدارة مطبقة على الـ API أيضًا.</p>
          </div>
          <Button onClick={reset}><Plus className="ml-2 h-4 w-4" /> إكسسوار جديد</Button>
        </header>

        {error && (
          <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-5 w-5" /> غير مصرح بالدخول أو تعذر تحميل الكتالوج</div>
            <p className="mt-1 text-sm text-muted-foreground">تأكد من تسجيل الدخول بحساب إدارة مخوّل. عمليات التعديل محمية من الخادم.</p>
          </section>
        )}

        <section className="rounded-2xl border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold">{editing ? "تعديل الإكسسوار" : "إضافة إكسسوار"}</h2>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم الإكسسوار</label>
              <Input value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} maxLength={255} required placeholder="مثال: سلة ركنة سحّابة" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">العلامة التجارية</label>
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}>
                <option value="JT">JT</option><option value="SX">SX</option><option value="Other">أخرى</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">السعر بالجنيه المصري</label>
              <Input type="number" min="0" step="1" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ترتيب العرض</label>
              <Input type="number" min="0" step="1" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">صورة المنتج (JPG / PNG / WEBP، حتى 8MB)</label>
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {
                const file = e.target.files?.[0] ?? null;
                setImage(file);
                if (file) setImagePreview(URL.createObjectURL(file));
              }} />
              {imagePreview && <img src={imagePreview} alt="معاينة الإكسسوار" className="h-36 w-36 rounded-xl border object-cover" />}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">رابط فيديو المنتج (اختياري)</label>
              <Input type="url" value={form.videoUrl} onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">سكريبت المبيعات</label>
              <Textarea value={form.salesScript} onChange={e => setForm(p => ({ ...p, salesScript: e.target.value }))} maxLength={20000} rows={6} placeholder="اكتب طريقة تقديم الإكسسوار للعميل، أهم مميزاته، والقيمة التي يضيفها للمطبخ..." />
              <p className="text-xs text-muted-foreground">سيظهر السكريبت في نافذة مستقلة لموظف المبيعات داخل تجربة التسعير.</p>
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : <><Save className="ml-2 h-4 w-4" /> {editing ? "حفظ التعديلات" : "إضافة الإكسسوار"}</>}</Button>
              {editing && <Button type="button" variant="outline" onClick={reset}><X className="ml-2 h-4 w-4" /> إلغاء التعديل</Button>}
            </div>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">الكتالوج ({sorted.length})</h2>
          {isLoading ? <p className="text-sm text-muted-foreground">جاري تحميل الكتالوج...</p> : sorted.map(item => (
            <article key={item.id} className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.nameAr} className="h-24 w-24 rounded-lg border object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-lg border text-muted-foreground"><ImagePlus className="h-7 w-7" /></div>}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.nameAr}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{item.brand}</span><span className={item.isActive ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700" : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"}>{item.isActive ? "نشط" : "متوقف"}</span></div>
                <p className="font-semibold tabular-nums">{item.price.toLocaleString("ar-EG")} ج.م</p>
                <p className="line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.salesScript || "لم تتم إضافة سكريبت مبيعات بعد"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(item)}><Pencil className="ml-1 h-4 w-4" /> تعديل</Button>
                <Button variant="outline" size="sm" onClick={() => void toggleActive(item)}><Trash2 className="ml-1 h-4 w-4" /> {item.isActive ? "تعطيل" : "تفعيل"}</Button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
