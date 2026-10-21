import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ShieldAlert } from "lucide-react";

export default function PricingSsoCallback() {
  const [, navigate] = useLocation();
  const started = useRef(false);
  const [error, setError] = useState("");
  const exchange = trpc.projectSso.exchange.useMutation();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("sso_token");
    const requestedNext = params.get("next");
    const next = requestedNext === "/brand/professor_kitchens/kitchens" || requestedNext === "/admin/kitchen-accessories"
      ? requestedNext
      : "/brand/professor_kitchens/kitchens";
    if (!token) {
      setError("رابط الدخول غير مكتمل. افتح منظومة التسعير من داخل Sales Team Platform.");
      return;
    }
    exchange.mutate({ token }, {
      onSuccess: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate(next, { replace: true });
      },
      onError: (e) => setError(e.message || "تعذر التحقق من جلسة الدخول الموحد"),
    });
  }, [exchange, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white" dir="rtl">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        {error ? <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-red-400" /> : <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-amber-400" />}
        <h1 className="text-xl font-bold">{error ? "تعذر تسجيل الدخول" : "جاري تسجيل الدخول بأمان"}</h1>
        <p className="mt-2 text-sm text-white/60">{error || "يتم التحقق من هويتك وصلاحياتك من منصة المبيعات..."}</p>
        {error && <button className="mt-5 rounded-lg bg-amber-600 px-4 py-2 font-semibold" onClick={() => window.history.back()}>الرجوع للصفحة السابقة</button>}
      </section>
    </main>
  );
}
