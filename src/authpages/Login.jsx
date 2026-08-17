
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Sun, Moon, Building2, Eye, EyeOff, Loader2, CircleCheck, Circle, ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const ThemeContext = createContext(null);
function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
function getInitialTheme() {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}
function buildTheme(isDark) {
  return {
    isDark,
    page: isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900",
    panelBg: isDark ? "bg-slate-900" : "bg-white",
    panelBorder: isDark ? "border-slate-800" : "border-slate-200",
    subtleBg: isDark ? "bg-slate-900" : "bg-slate-100/70",
    textPrimary: isDark ? "text-slate-50" : "text-slate-900",
    textSecondary: isDark ? "text-slate-200" : "text-slate-700",
    textBody: isDark ? "text-slate-400" : "text-slate-600",
    textMuted: isDark ? "text-slate-500" : "text-slate-500",
    hoverBg: isDark ? "hover:bg-slate-800" : "hover:bg-slate-100",
    divider: isDark ? "border-slate-800" : "border-slate-200",
    inputBg: isDark
      ? "bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
      : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400",
    inputError: isDark ? "border-rose-500/60" : "border-rose-400",
    statusStyles: {
      Occupied: isDark
        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
        : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
      Vacant: isDark
        ? "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
        : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
      Maintenance: isDark
        ? "bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20"
        : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
    },
  };
}
function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(getInitialTheme);
  useEffect(() => {
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);
  const toggleTheme = useCallback(() => setIsDark((d) => !d), []);
  const theme = useMemo(() => buildTheme(isDark), [isDark]);
  const value = useMemo(() => ({ isDark, toggleTheme, theme }), [isDark, toggleTheme, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  return reduce;
}


function Field({ label, htmlFor, error, hint, children }) {
  const { theme } = useTheme();
  return (
    <div>
      <label htmlFor={htmlFor} className={`mb-1.5 block text-xs font-medium uppercase tracking-wide ${theme.textMuted}`}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-rose-500">{error}</p>
      ) : hint ? (
        <p className={`mt-1.5 text-xs ${theme.textMuted}`}>{hint}</p>
      ) : null}
    </div>
  );
}
function TextField({ id, error, className = "", ...props }) {
  const { theme } = useTheme();
  return (
    <input
      id={id}
      {...props}
      className={`h-10 w-full rounded-md border ${error ? theme.inputError : theme.inputBg} px-3 text-sm outline-none transition-colors duration-150 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 ${className}`}
    />
  );
}
function Select({ id, value, onChange, options, error, className = "" }) {
  const { theme } = useTheme();
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full appearance-none rounded-md border ${error ? theme.inputError : theme.inputBg} pl-3 pr-8 text-sm outline-none transition-colors duration-150 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20`}
      >
        <option value="" disabled>Select a role</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className={`pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${theme.textMuted}`} />
    </div>
  );
}
function Button({ variant = "primary", loading = false, children, className = "", ...props }) {
  const { theme } = useTheme();
  const base = "inline-flex h-11 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60 disabled:pointer-events-none";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm",
    secondary: `border ${theme.panelBorder} ${theme.textSecondary} ${theme.hoverBg}`,
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
function ThemeToggle() {
  const { isDark, toggleTheme, theme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      aria-pressed={isDark}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border transition-colors duration-150 ${theme.panelBorder} ${theme.textSecondary} ${theme.hoverBg}`}
    >
      <Sun className={`absolute h-4 w-4 transition-all duration-200 ${isDark ? "-translate-y-6 opacity-0" : "translate-y-0 opacity-100"}`} />
      <Moon className={`absolute h-4 w-4 transition-all duration-200 ${isDark ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} />
    </button>
  );
}
function Logo({ light = false }) {
  const { theme } = useTheme();
  return (
    <a href="#" className="inline-flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
        <Building2 className="h-4.5 w-4.5" />
      </span>
      <span className={`text-[15px] font-semibold tracking-tight ${light ? "text-white" : theme.textPrimary}`}>Citi Properties</span>
    </a>
  );
}


function MutedDashboardMock() {
  const { theme } = useTheme();
  const rows = [
    { id: "U-104", status: "Occupied" },
    { id: "U-207", status: "Vacant" },
    { id: "U-118", status: "Maintenance" },
  ];
  return (
    <div className={`w-full max-w-sm overflow-hidden rounded-xl border ${theme.panelBorder} ${theme.panelBg} shadow-xl shadow-black/20`}>
      <div className={`flex items-center gap-1.5 border-b px-3 py-2.5 ${theme.divider}`}>
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>
      <div className="space-y-2 p-3.5">
        {rows.map((r) => (
          <div key={r.id} className={`flex items-center justify-between rounded-md border px-2.5 py-2 ${theme.panelBorder}`}>
            <span className={`text-xs font-medium ${theme.textPrimary}`}>{r.id}</span>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${theme.statusStyles[r.status]}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function BrandPanel() {
  const reduceMotion = useReduceMotion();
  return (
    <div className="relative hidden h-full overflow-hidden bg-slate-950 md:flex md:flex-1 md:items-center md:justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900" />
      <svg
        className={`absolute bottom-0 left-0 h-[45%] w-[160%] text-slate-800/60 ${reduceMotion ? "" : "animate-[panSkyline_46s_linear_infinite]"}`}
        viewBox="0 0 1600 320"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <g fill="currentColor">
          <rect x="0" y="140" width="70" height="180" /><rect x="90" y="90" width="55" height="230" />
          <rect x="160" y="170" width="90" height="150" /><rect x="270" y="60" width="60" height="260" />
          <rect x="345" y="120" width="75" height="200" /><rect x="435" y="180" width="50" height="140" />
          <rect x="500" y="40" width="65" height="280" /><rect x="580" y="130" width="80" height="190" />
          <rect x="675" y="95" width="55" height="225" /><rect x="745" y="165" width="90" height="155" />
          <rect x="850" y="70" width="60" height="250" /><rect x="925" y="140" width="75" height="180" />
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />

      <div className="relative z-10 flex max-w-md flex-col items-start gap-8 px-12">
        <div><Logo light /></div>
        <div>
          <h2 className="text-2xl font-semibold leading-snug text-white">
            One dashboard for every unit, tenant, and ticket you manage.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Citi Properties helps landlords and property teams track occupancy, rent, and maintenance across every property they run — all from one place.
          </p>
        </div>
        <MutedDashboardMock />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   3. REGISTRATION FORM
   -------------------------------------------------------------------------- */




function LoginForm() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  
 

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  const toastId = toast.loading('Signing in...');
  const values = { username, password };

  setSubmitting(true);
  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/api/login/",
      values,
      { headers: { "Content-Type": "application/json" } }
    );

    // Save tokens for authenticated requests across the app
    if (response.data.access && response.data.refresh ) {
     localStorage.setItem('access', response.data.access);
     localStorage.setItem('refresh', response.data.refresh);
    }

    setSubmitted(true);
    toast.success("Logged in successfully!", { id: toastId });
setTimeout(() => {
  navigate("/dashboard");
}, 500);
  } catch (err) {
    console.log("An error occurred!", err.response?.data || err.message);
    
    // Extract Django error message if available, fallback to generic
    const serverMessage = err.response?.data?.detail || "Invalid credentials. Please try again.";
    setError(serverMessage);
    toast.error(serverMessage, { id: toastId });

  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="flex min-h-full w-full flex-col justify-center px-5 py-10 sm:px-10 lg:px-16 xl:px-20">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="mb-8 flex items-center justify-between">
          <span className="md:hidden"><Logo /></span>
          <ThemeToggle />
        </div>

        <h1 className={`text-2xl font-semibold tracking-tight ${theme.textPrimary}`}>Create your account</h1>
        <p className={`mt-1.5 text-sm ${theme.textBody}`}>Set up access for your property, team, or unit in a few minutes.</p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>

          <Field label="Username" htmlFor="username">
            <TextField
              id="username"
              autoComplete="username"
              placeholder="amani.joseph"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>

          

          <Field label="Password" htmlFor="password">
            <div className="relative">
              <TextField
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.textSecondary}`}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
          </Field>

          

          <Button type="submit" variant="primary" loading={submitting} className="w-full">
            {submitting ? "Logging In…" : "Login Here"}
          </Button>
        </form>

        <p className={`mt-6 text-center text-sm ${theme.textBody}`}>
          Dont have an account?{" "}
          <a onClick={() => navigate("/signup")} href="#" className="font-medium text-indigo-500 hover:underline">Sign Up</a>
        </p>

        <p className={`mt-10 text-center text-xs ${theme.textMuted}`}>
          Designed &amp; Developed by <span className={theme.textBody}>Mega Technologies</span>
          <span className="mx-1.5">·</span>© {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   4. PAGE
   -------------------------------------------------------------------------- */
function LoginPage() {
  const { theme } = useTheme();
  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme.page}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes panSkyline { from { transform: translateX(0); } to { transform: translateX(-32%); } }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
        }
      `}</style>
      <BrandPanel />
      <div className="h-screen flex-1 overflow-y-auto">
        <LoginForm />
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <ThemeProvider>
      <LoginPage />
    </ThemeProvider>
  );
}