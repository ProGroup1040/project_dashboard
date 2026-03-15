import { useState } from "react";
import { trpc } from "@/lib/trpc";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663366992461/mRvpKEsVM97L32dYU7ka6B";

type ProjectUser = {
  id: number;
  username: string;
  displayName: string;
  role: "admin" | "engineer" | "aftersales" | "client";
};

interface ProjectLoginProps {
  onLogin: (user: ProjectUser) => void;
}

export default function ProjectLogin({ onLogin }: ProjectLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.project.login.useMutation({
    onSuccess: (data) => {
      onLogin(data.user);
    },
    onError: (err) => {
      setError(err.message || "حدث خطأ في تسجيل الدخول");
      setLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setError("");
    setLoading(true);
    loginMutation.mutate({ username, password });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Cairo', sans-serif",
        direction: "rtl",
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(212,175,55,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212,175,55,0.03) 0%, transparent 40%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          background: "rgba(20,20,20,0.95)",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: "16px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 0 60px rgba(212,175,55,0.1)",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img
            src={`${CDN}/ProfessorLogo.png`}
            alt="Professor"
            style={{ height: "80px", objectFit: "contain", filter: "drop-shadow(0 0 20px rgba(212,175,55,0.4))" }}
          />
          <div style={{ color: "#d4af37", fontSize: "13px", marginTop: "8px", letterSpacing: "2px", textTransform: "uppercase" }}>
            نظام متابعة المشروع
          </div>
          <div style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>
            مشروع شقة مدينتي - مستر علي راشد
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "#d4af37", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(212,175,55,0.3)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "'Cairo', sans-serif",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#d4af37")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.3)")}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", color: "#d4af37", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(212,175,55,0.3)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "'Cairo', sans-serif",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#d4af37")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.3)")}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "rgba(220,38,38,0.1)",
                border: "1px solid rgba(220,38,38,0.3)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#f87171",
                fontSize: "13px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "rgba(212,175,55,0.3)" : "linear-gradient(135deg, #d4af37, #b8962e)",
              border: "none",
              borderRadius: "8px",
              color: loading ? "#888" : "#000",
              fontSize: "15px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Cairo', sans-serif",
              letterSpacing: "0.5px",
            }}
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        {/* Role hints */}
        <div style={{ marginTop: "24px", padding: "16px", background: "rgba(212,175,55,0.05)", borderRadius: "8px", border: "1px solid rgba(212,175,55,0.1)" }}>
          <div style={{ color: "#888", fontSize: "11px", textAlign: "center", marginBottom: "8px" }}>الأدوار المتاحة</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {[
              { role: "مدير النظام", icon: "👑", color: "#d4af37" },
              { role: "مهندس المشروع", icon: "🔧", color: "#60a5fa" },
              { role: "After Sales", icon: "🎯", color: "#a78bfa" },
              { role: "العميل", icon: "👤", color: "#34d399" },
            ].map((r) => (
              <div key={r.role} style={{ display: "flex", alignItems: "center", gap: "6px", color: r.color, fontSize: "11px" }}>
                <span>{r.icon}</span>
                <span>{r.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
