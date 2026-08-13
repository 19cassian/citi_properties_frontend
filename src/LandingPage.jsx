/* ============================================================================
   CITI PROPERTIES — Marketing Landing Page
   Visual system matches the product dashboard (indigo/slate, Plus Jakarta
   Sans, rounded-md UI) rather than generic AI-template defaults. Theming
   uses the same ThemeContext pattern as the dashboard — explicit JS state,
   not Tailwind's dark: media-query variant.

   Revision notes:
   - Hero now has a full-bleed animated background (looping SVG skyline +
     gradient sweep) standing in for real video/photo footage, since no
     licensed video/photo asset of the actual product exists to embed. The
     component accepts a `videoSrc` prop — drop in a real .mp4 and it plays
     that instead, no other changes needed. Kept dark/cinematic regardless
     of site theme, the way footage would be, so it reads as one fixed
     visual band rather than something that flickers with the toggle.
   - Product showcase: the Maintenance and Access panels no longer use
     generic shimmer bars — they render the same real ticket rows / role
     cards you'd see in the actual dashboard.
   - Pricing cards now show real numbers instead of "Custom"/"Talk to us".
   - Testimonials: 5 quotes in a page-turn carousel (CSS 3D rotateY around
     the left edge) that mimics a book page flipping, auto-advancing with
     manual prev/next and dot controls, degrading to an instant swap under
     prefers-reduced-motion.
   ========================================================================== */
import React, {
  createContext, useContext, useState, useEffect, useRef, useMemo, useCallback,
} from "react";
import {
  Sun, Moon, Menu, X, ArrowRight, ArrowLeft, Building2, Home, Users, Wrench,
  FileText, ShieldCheck, Layers, CircleCheck, ChevronDown, Star, Clock,
  AlertTriangle, Twitter, Linkedin, Facebook, Play,
  Route
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
/* ----------------------------------------------------------------------------
   0. THEME CONTEXT — same pattern as the dashboard: explicit class tokens
      driven by React state, never Tailwind's dark: variant.
   -------------------------------------------------------------------------- */
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
    headerBg: isDark ? "bg-slate-950/90" : "bg-slate-50/90",
    panelBg: isDark ? "bg-slate-900" : "bg-white",
    panelBorder: isDark ? "border-slate-800" : "border-slate-200",
    raisedBg: isDark ? "bg-slate-900/60" : "bg-white",
    subtleBg: isDark ? "bg-slate-900" : "bg-slate-100/70",
    textPrimary: isDark ? "text-slate-50" : "text-slate-900",
    textSecondary: isDark ? "text-slate-200" : "text-slate-700",
    textBody: isDark ? "text-slate-400" : "text-slate-600",
    textMuted: isDark ? "text-slate-500" : "text-slate-500",
    hoverBg: isDark ? "hover:bg-slate-800" : "hover:bg-slate-100",
    divider: isDark ? "border-slate-800" : "border-slate-200",
    chipBg: isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600",
    cardShadow: isDark ? "shadow-none" : "shadow-sm",
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
    priorityStyles: {
      Urgent: isDark
        ? "bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20"
        : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
      Medium: isDark
        ? "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
        : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
      Low: isDark
        ? "bg-slate-800 text-slate-300 ring-1 ring-inset ring-slate-700"
        : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10",
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

/* ----------------------------------------------------------------------------
   1. SCROLL-REVEAL HOOK — one-shot fade/slide-up, respects reduced motion.
   -------------------------------------------------------------------------- */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return reduce;
}
function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, shown];
}
function Reveal({ as: Tag = "div", className = "", delay = 0, children }) {
  const [ref, shown] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`transition-all duration-500 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}

/* ----------------------------------------------------------------------------
   2. CONTENT
   -------------------------------------------------------------------------- */
const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];
const FEATURES = [
  { icon: Home, title: "Unit & lease tracking", body: "See every unit across every property — status, tenant, rent, and lease end date — in one table you can filter and sort." },
  { icon: Layers, title: "Multi-property switching", body: "Move between properties in one click without losing your place, whether you manage two buildings or twenty." },
  { icon: Wrench, title: "Maintenance queue", body: "Tickets come in ranked by priority, so an AC outage never gets buried under a repaint request." },
  { icon: Users, title: "Rent collection visibility", body: "Track what's collected and what's outstanding this cycle, by property or across your whole portfolio." },
  { icon: ShieldCheck, title: "Role-based access", body: "Landlords, admins, and tenants each see exactly what's relevant to them — nothing more." },
  { icon: FileText, title: "Lease expiration alerts", body: "Know which leases end in the next 30 days before your tenant has to remind you." },
];
const STEPS = [
  { n: "01", title: "Add your properties", body: "Bring in your buildings and units — bulk import or add them one at a time." },
  { n: "02", title: "Invite your team", body: "Bring on admins, maintenance staff, and tenants with the right access level for each." },
  { n: "03", title: "Manage from one dashboard", body: "Occupancy, rent, and maintenance — one screen, updated as things happen." },
];
const FAQS = [
  { q: "Is our data secure?", a: "Yes. Access is role-based, data is encrypted in transit and at rest, and every account is scoped to your organization only." },
  { q: "How long does onboarding take?", a: "Most teams are fully set up within a day — import your units, invite your team, and you're managing live." },
  { q: "Can we manage more than one property?", a: "Yes. The property switcher in the header lets you move between as many properties as you manage, with portfolio-wide reporting." },
  { q: "Can tenants use it too?", a: "Tenants get their own scoped view — lease details, payment status, and a way to log maintenance requests directly." },
];
const TESTIMONIALS = [
  { quote: "We went from three spreadsheets to one dashboard. I know what's vacant and what's broken before my first coffee.", name: "N. Fataki", role: "Property Manager, Harborview Residences", initials: "NF" },
  { quote: "The maintenance queue alone paid for itself. Urgent tickets stopped getting lost behind routine ones.", name: "A. Mwakalinga", role: "Landlord, Coral Bay Apartments", initials: "AM" },
  { quote: "Switching between our three buildings used to mean three logins. Now it's one dropdown.", name: "S. Kessy", role: "Operations Lead, Kilimani Business Park", initials: "SK" },
  { quote: "Our tenants log their own requests now instead of calling the office. That alone freed up hours a week.", name: "R. Juma", role: "Admin, Coral Bay Apartments", initials: "RJ" },
  { quote: "Lease expirations used to sneak up on us. Now we see everything ending in the next 30 days at a glance.", name: "T. Massawe", role: "Portfolio Manager, Harborview Residences", initials: "TM" },
];

/* ----------------------------------------------------------------------------
   3. SHARED PRIMITIVES
   -------------------------------------------------------------------------- */
function Button({ as: Tag = "button", variant = "primary", size = "md", icon: Icon, children, className = "", ...props }) {
  const { theme } = useTheme();
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40";
  const sizes = { sm: "h-9 px-3.5 text-sm", md: "h-11 px-5 text-sm" };
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm",
    secondary: `border ${theme.panelBorder} ${theme.textSecondary} ${theme.hoverBg}`,
  };
  return (
    <Tag className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
    </Tag>
  );
}
function SectionLabel({ children, light = false }) {
  const { theme } = useTheme();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${light ? "bg-white/10 text-white" : theme.chipBg}`}>
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------------------
   4. HERO BACKGROUND — video if provided, else a looping animated skyline
      built in pure SVG/CSS (no stock footage available to embed here).
      Kept as a fixed dark/cinematic band regardless of site theme, the way
      a real video plate would be.
   -------------------------------------------------------------------------- */
function HeroBackground({ videoSrc, posterSrc }) {
  const reduceMotion = useReduceMotion();
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      {videoSrc ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <>
          {/* gradient plate */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900" />
          {/* slow-panning skyline silhouette, standing in for footage */}
          <svg
            className={`absolute bottom-0 left-0 h-[55%] w-[160%] text-slate-800/70 ${reduceMotion ? "" : "animate-[panSkyline_38s_linear_infinite]"}`}
            viewBox="0 0 1600 320"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <g fill="currentColor">
              <rect x="0" y="140" width="70" height="180" />
              <rect x="90" y="90" width="55" height="230" />
              <rect x="160" y="170" width="90" height="150" />
              <rect x="270" y="60" width="60" height="260" />
              <rect x="345" y="120" width="75" height="200" />
              <rect x="435" y="180" width="50" height="140" />
              <rect x="500" y="40" width="65" height="280" />
              <rect x="580" y="130" width="80" height="190" />
              <rect x="675" y="95" width="55" height="225" />
              <rect x="745" y="165" width="90" height="155" />
              <rect x="850" y="70" width="60" height="250" />
              <rect x="925" y="140" width="75" height="180" />
              <rect x="1015" y="185" width="50" height="135" />
              <rect x="1080" y="50" width="65" height="270" />
              <rect x="1160" y="125" width="80" height="195" />
              <rect x="1255" y="100" width="55" height="220" />
              <rect x="1325" y="170" width="90" height="150" />
              <rect x="1430" y="65" width="60" height="255" />
              <rect x="1505" y="135" width="75" height="185" />
            </g>
          </svg>
          {/* subtle light sweep for a bit of movement/life, like a video would have */}
          {!reduceMotion && (
            <div className="absolute inset-0 animate-[sweep_9s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent" />
          )}
          {/* fine dot-grid texture for depth */}
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />
        </>
      )}
      {/* readability scrim so text stays legible over either the video or the illustration */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
    </div>
  );
}

/* ----------------------------------------------------------------------------
   5. DASHBOARD MOCK CARD (used in the hero) — a real, simplified snapshot
      of the product UI, not a stock photo.
   -------------------------------------------------------------------------- */
function DashboardMock() {
  const { theme } = useTheme();
  const rows = [
    { id: "U-104", tenant: "A. Mwakalinga", status: "Occupied", rent: "$1,850" },
    { id: "U-207", tenant: "—", status: "Vacant", rent: "$1,600" },
    { id: "U-118", tenant: "R. Juma", status: "Maintenance", rent: "$1,400" },
  ];
  return (
    <div className={`overflow-hidden rounded-xl border ${theme.panelBorder} ${theme.panelBg} shadow-2xl shadow-black/30`}>
      <div className={`flex items-center gap-1.5 border-b px-3 py-2.5 ${theme.divider}`}>
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className={`ml-3 truncate text-xs ${theme.textMuted}`}>app.citiproperties.com/dashboard</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 p-3 sm:gap-3 sm:p-4">
        <div className="col-span-3 grid grid-cols-3 gap-2.5 sm:gap-3">
          {[
            { label: "Occupancy", value: "83%" },
            { label: "Urgent tickets", value: "2" },
            { label: "Expiring leases", value: "3" },
          ].map((k) => (
            <div key={k.label} className={`rounded-lg border p-2.5 sm:p-3 ${theme.panelBorder} ${theme.subtleBg}`}>
              <p className={`text-[10px] font-medium uppercase tracking-wide sm:text-xs ${theme.textMuted}`}>{k.label}</p>
              <p className={`mt-1 text-base font-semibold sm:text-lg ${theme.textPrimary}`}>{k.value}</p>
            </div>
          ))}
        </div>
        <div className={`col-span-3 rounded-lg border ${theme.panelBorder}`}>
          <table className="w-full text-left text-[11px] sm:text-xs">
            <thead>
              <tr className={`border-b ${theme.divider}`}>
                {["Unit", "Tenant", "Status", "Rent"].map((h) => (
                  <th key={h} className={`px-2.5 py-2 font-medium uppercase tracking-wide sm:px-3 ${theme.textMuted}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-b last:border-0 ${theme.divider}`}>
                  <td className={`px-2.5 py-2 font-medium sm:px-3 ${theme.textPrimary}`}>{r.id}</td>
                  <td className={`px-2.5 py-2 sm:px-3 ${theme.textBody}`}>{r.tenant}</td>
                  <td className="px-2.5 py-2 sm:px-3">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${theme.statusStyles[r.status]}`}>{r.status}</span>
                  </td>
                  <td className={`px-2.5 py-2 sm:px-3 ${theme.textSecondary}`}>{r.rent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   6. HEADER
   -------------------------------------------------------------------------- */
function ThemeToggle({ size = "h-9 w-9" }) {
  const { isDark, toggleTheme, theme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      aria-pressed={isDark}
      className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-md border transition-colors duration-150 ${theme.panelBorder} ${theme.textSecondary} ${theme.hoverBg}`}
    >
      <Sun className={`absolute h-4 w-4 transition-all duration-200 ${isDark ? "-translate-y-6 opacity-0" : "translate-y-0 opacity-100"}`} />
      <Moon className={`absolute h-4 w-4 transition-all duration-200 ${isDark ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} />
    </button>
  );
}
function Header({ onRequestDemo }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-sm ${theme.headerBg} ${theme.divider}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Building2 className="h-4.5 w-4.5" />
          </span>
          <span className={`text-[15px] font-semibold tracking-tight ${theme.textPrimary}`}>Citi Properties</span>
        </a>

        <nav className="ml-8 hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className={`text-sm font-medium transition-colors duration-150 ${theme.textBody} hover:${theme.textPrimary}`}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Button variant="secondary" size="sm">Log In</Button>
          <Button variant="primary" size="sm" icon={ArrowRight} onClick={onRequestDemo}>Request a Demo</Button>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" className={`flex h-9 w-9 items-center justify-center rounded-md border ${theme.panelBorder} ${theme.textSecondary}`}>
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      <div className={`overflow-hidden border-t transition-[max-height] duration-200 ease-out lg:hidden ${theme.divider}`} style={{ maxHeight: open ? "320px" : "0px" }}>
        <div className={`flex flex-col gap-1 px-4 py-3 sm:px-6 ${theme.panelBg}`}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={`rounded-md px-2 py-2.5 text-sm font-medium ${theme.textSecondary} ${theme.hoverBg}`}>
              {l.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2 px-2">
          
                <Button variant="secondary" size="sm" className="flex-1">Log In</Button>
            <Button variant="primary" size="sm" className="flex-1" onClick={onRequestDemo}>Request a Demo</Button>
            
          </div>
        </div>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------------------
   7. HERO
   -------------------------------------------------------------------------- */
function Hero({ onRequestDemo }) {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <HeroBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <SectionLabel light>Property management, simplified</SectionLabel>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              One dashboard for every unit, tenant, and ticket you manage.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Citi Properties gives landlords and property teams a single place to track occupancy, collect rent, and dispatch maintenance — across as many properties as you run, from Dar es Salaam to Zanzibar.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button variant="primary" icon={ArrowRight} onClick={onRequestDemo}>Request a Demo</Button>
              <Button
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                variant="secondary"
              >
                Log In
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-emerald-400" /> No setup fees</span>
              <span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-emerald-400" /> Live in a day</span>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <DashboardMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   8. TRUST STRIP
   -------------------------------------------------------------------------- */
function TrustStrip() {
  const { theme } = useTheme();
  const stats = [
    { value: "120+", label: "properties managed" },
    { value: "3", label: "cities served" },
    { value: "1,400+", label: "units tracked" },
    { value: "24h", label: "avg. ticket response" },
  ];
  return (
    <section className={`border-y ${theme.divider} ${theme.subtleBg}`}>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 60} className="text-center md:text-left">
            <p className={`text-2xl font-bold sm:text-3xl ${theme.textPrimary}`}>{s.value}</p>
            <p className={`mt-1 text-xs sm:text-sm ${theme.textMuted}`}>{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   9. FEATURES
   -------------------------------------------------------------------------- */
function Features() {
  const { theme } = useTheme();
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <Reveal className="max-w-2xl">
        <SectionLabel>Features</SectionLabel>
        <h2 className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${theme.textPrimary}`}>Everything a property team checks daily, in one screen.</h2>
        <p className={`mt-3 text-base ${theme.textBody}`}>Built around the questions you actually ask each morning — what's vacant, what's late, and what's broken.</p>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 60}>
            <div className={`h-full rounded-lg border p-5 transition-colors duration-150 ${theme.panelBorder} ${theme.panelBg} hover:border-indigo-400/50`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600/10 text-indigo-500">
                <f.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className={`mt-4 text-sm font-semibold ${theme.textPrimary}`}>{f.title}</h3>
              <p className={`mt-1.5 text-sm leading-relaxed ${theme.textBody}`}>{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   10. HOW IT WORKS
   -------------------------------------------------------------------------- */
function HowItWorks() {
  const { theme } = useTheme();
  return (
    <section id="how-it-works" className={`scroll-mt-20 border-y ${theme.divider} ${theme.subtleBg}`}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="max-w-2xl">
          <SectionLabel>How it works</SectionLabel>
          <h2 className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${theme.textPrimary}`}>Set up once. Manage every day after.</h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <span className="text-sm font-semibold text-indigo-500">{s.n}</span>
              <h3 className={`mt-2 text-lg font-semibold ${theme.textPrimary}`}>{s.title}</h3>
              <p className={`mt-1.5 text-sm leading-relaxed ${theme.textBody}`}>{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   11. PRODUCT SHOWCASE — real content per panel, not shimmer placeholders.
   -------------------------------------------------------------------------- */
function UnitsPreview({ theme }) {
  const rows = [
    { id: "U-104", tenant: "A. Mwakalinga", status: "Occupied" },
    { id: "U-207", tenant: "—", status: "Vacant" },
    { id: "U-118", tenant: "R. Juma", status: "Maintenance" },
  ];
  return (
    <div className="space-y-2.5 p-4">
      {rows.map((r) => (
        <div key={r.id} className={`flex items-center justify-between rounded-md border p-2.5 ${theme.panelBorder}`}>
          <div className="flex items-center gap-2.5">
            <span className={`flex h-7 w-7 items-center justify-center rounded ${theme.subtleBg}`}>
              <Home className="h-3.5 w-3.5 text-slate-400" />
            </span>
            <div>
              <p className={`text-xs font-medium ${theme.textPrimary}`}>{r.id}</p>
              <p className={`text-[11px] ${theme.textMuted}`}>{r.tenant}</p>
            </div>
          </div>
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${theme.statusStyles[r.status]}`}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}
function MaintenancePreview({ theme }) {
  const tickets = [
    { id: "T-2291", unit: "U-118", issue: "AC unit not cooling", priority: "Urgent", logged: "2h ago" },
    { id: "T-2288", unit: "U-108", issue: "Leaking kitchen faucet", priority: "Urgent", logged: "5h ago" },
    { id: "T-2280", unit: "U-311", issue: "Hallway light flickering", priority: "Medium", logged: "1d ago" },
  ];
  return (
    <div className="space-y-2.5 p-4">
      {tickets.map((t) => (
        <div key={t.id} className={`flex items-start gap-2.5 rounded-md border p-2.5 ${theme.panelBorder}`}>
          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded ${theme.subtleBg}`}>
            <Wrench className="h-3.5 w-3.5 text-slate-400" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${theme.chipBg}`}>{t.unit}</span>
              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${theme.priorityStyles[t.priority]}`}>{t.priority}</span>
            </div>
            <p className={`mt-1 truncate text-xs font-medium ${theme.textPrimary}`}>{t.issue}</p>
            <p className={`mt-0.5 flex items-center gap-1 text-[11px] ${theme.textMuted}`}><Clock className="h-3 w-3" /> {t.logged}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
function AccessPreview({ theme }) {
  const roles = [
    { role: "Landlord", initials: "AJ", sees: "Full portfolio, rent, and reporting" },
    { role: "Admin", initials: "SK", sees: "Assigned properties and maintenance" },
    { role: "Tenant", initials: "RJ", sees: "Their own unit and lease only" },
  ];
  return (
    <div className="space-y-2.5 p-4">
      {roles.map((r) => (
        <div key={r.role} className={`flex items-center gap-2.5 rounded-md border p-2.5 ${theme.panelBorder}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">{r.initials}</span>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold ${theme.textPrimary}`}>{r.role}</p>
            <p className={`truncate text-[11px] ${theme.textMuted}`}>{r.sees}</p>
          </div>
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
        </div>
      ))}
    </div>
  );
}
function Showcase() {
  const { theme } = useTheme();
  const items = [
    { icon: Wrench, tag: "Maintenance", title: "A queue ranked by what actually matters", body: "Urgent tickets surface first, so a leaking faucet doesn't wait behind a repaint request.", Preview: MaintenancePreview },
    { icon: Home, tag: "Units", title: "Filter and sort every unit in seconds", body: "Search by tenant, filter by status, or pull up everything expiring in the next 30 days.", Preview: UnitsPreview },
    { icon: ShieldCheck, tag: "Access", title: "The right view for the right role", body: "Landlords see the portfolio. Tenants see their unit. Admins see what they're assigned to manage.", Preview: AccessPreview },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="max-w-2xl">
        <SectionLabel>Inside the product</SectionLabel>
        <h2 className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${theme.textPrimary}`}>A closer look at the dashboard.</h2>
      </Reveal>
      <div className="mt-10 space-y-14">
        {items.map((it, i) => (
          <Reveal key={it.title}>
            <div className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}>
              <div className="lg:[direction:ltr]">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600/10 text-indigo-500">
                  <it.icon className="h-4.5 w-4.5" />
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-indigo-500">{it.tag}</p>
                <h3 className={`mt-1.5 text-xl font-semibold ${theme.textPrimary}`}>{it.title}</h3>
                <p className={`mt-2 max-w-md text-sm leading-relaxed ${theme.textBody}`}>{it.body}</p>
              </div>
              <div className={`overflow-hidden rounded-xl border lg:[direction:ltr] ${theme.panelBorder} ${theme.panelBg} ${theme.cardShadow}`}>
                <div className={`flex items-center gap-1.5 border-b px-3 py-2.5 ${theme.divider}`}>
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className={`ml-2 truncate text-[11px] ${theme.textMuted}`}>{it.tag.toLowerCase()}.citiproperties.com</span>
                </div>
                <it.Preview theme={theme} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   12. TESTIMONIALS — page-turn carousel, 5 quotes, mimics a book flipping.
   -------------------------------------------------------------------------- */
function TestimonialPage({ t, theme }) {
  return (
    <div className={`flex h-full flex-col justify-center rounded-r-xl rounded-l-sm border border-l-4 p-7 sm:p-10 ${theme.panelBorder} border-l-indigo-500 ${theme.panelBg} ${theme.cardShadow}`}>
      <div className="flex gap-1 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
      </div>
      <p className={`mt-4 text-lg font-medium leading-relaxed sm:text-xl ${theme.textPrimary}`}>"{t.quote}"</p>
      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">{t.initials}</span>
        <div>
          <p className={`text-sm font-medium ${theme.textPrimary}`}>{t.name}</p>
          <p className={`text-xs ${theme.textMuted}`}>{t.role}</p>
        </div>
      </div>
    </div>
  );
}
function BookTestimonials() {
  const { theme } = useTheme();
  const reduceMotion = useReduceMotion();
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(null);
  const [turning, setTurning] = useState(false);
  const [paused, setPaused] = useState(false);
  const total = TESTIMONIALS.length;

  const goTo = useCallback((next) => {
    setIndex((current) => {
      if (next === current) return current;
      if (reduceMotion) return next;
      setPrev(current);
      setTurning(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setTurning(true)));
      return next;
    });
  }, [reduceMotion]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % total;
        if (!reduceMotion) {
          setPrev(current);
          setTurning(false);
          requestAnimationFrame(() => requestAnimationFrame(() => setTurning(true)));
        }
        return next;
      });
    }, 7000);
    return () => clearInterval(timer);
  }, [paused, reduceMotion, total]);

  return (
    <section className={`border-y ${theme.divider} ${theme.subtleBg}`}>
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <Reveal className="text-center">
          <SectionLabel>What property teams say</SectionLabel>
          <h2 className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${theme.textPrimary}`}>Trusted by the people running the buildings.</h2>
        </Reveal>

        <div
          className="relative mt-10 h-[300px] sm:h-[240px]"
          style={{ perspective: "1800px" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {prev !== null && (
            <div
              key={`prev-${prev}`}
              onTransitionEnd={() => setPrev(null)}
              className="absolute inset-0"
              style={{
                transformOrigin: "left center",
                transform: turning ? "rotateY(-150deg)" : "rotateY(0deg)",
                opacity: turning ? 0 : 1,
                transition: "transform 620ms cubic-bezier(.4,0,.2,1), opacity 560ms ease-in",
                backfaceVisibility: "hidden",
                zIndex: 20,
                boxShadow: turning ? "none" : "-6px 0 16px -8px rgba(0,0,0,0.25)",
              }}
            >
              <TestimonialPage t={TESTIMONIALS[prev]} theme={theme} />
            </div>
          )}
          <div className="absolute inset-0" style={{ zIndex: 10 }}>
            <TestimonialPage t={TESTIMONIALS[index]} theme={theme} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => goTo((index - 1 + total) % total)}
            aria-label="Previous testimonial"
            className={`flex h-8 w-8 items-center justify-center rounded-md border ${theme.panelBorder} ${theme.textSecondary} ${theme.hoverBg}`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.name}
                onClick={() => goTo(i)}
                aria-label={`Show testimonial from ${t.name}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${i === index ? "w-5 bg-indigo-500" : `w-1.5 ${theme.isDark ? "bg-slate-700" : "bg-slate-300"}`}`}
              />
            ))}
          </div>
          <button
            onClick={() => goTo((index + 1) % total)}
            aria-label="Next testimonial"
            className={`flex h-8 w-8 items-center justify-center rounded-md border ${theme.panelBorder} ${theme.textSecondary} ${theme.hoverBg}`}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   13. PRICING — real prices, not "Custom"/"Talk to us" placeholders.
   -------------------------------------------------------------------------- */
function Pricing({ onRequestDemo }) {
  const { theme } = useTheme();
  const plans = [
    { name: "Starter", price: "$0", period: "/mo", desc: "For a single property, getting organized.", features: ["Up to 10 units", "1 admin seat", "Maintenance queue"] },
    { name: "Growth", price: "$49", period: "/mo per property", desc: "For teams managing several properties.", features: ["Unlimited units", "Role-based access", "Priority support"], highlighted: true },
    { name: "Portfolio", price: "$149", period: "/mo per property", desc: "For larger operators with dedicated teams.", features: ["Multi-property reporting", "Custom onboarding", "Dedicated account lead"] },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <Reveal className="max-w-2xl">
        <SectionLabel>Pricing</SectionLabel>
        <h2 className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${theme.textPrimary}`}>Plans that scale with your portfolio.</h2>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((p, i) => (
          <Reveal key={p.name} delay={i * 60}>
            <div className={`flex h-full flex-col rounded-lg border p-6 ${p.highlighted ? "border-indigo-500 ring-1 ring-indigo-500/30" : theme.panelBorder} ${theme.panelBg}`}>
              <h3 className={`text-sm font-semibold ${theme.textPrimary}`}>{p.name}</h3>
              <p className="mt-2 flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${theme.textPrimary}`}>{p.price}</span>
                <span className={`text-xs ${theme.textMuted}`}>{p.period}</span>
              </p>
              <p className={`mt-1 text-sm ${theme.textMuted}`}>{p.desc}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${theme.textBody}`}>
                    <CircleCheck className="h-4 w-4 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={p.highlighted ? "primary" : "secondary"}
                className="mt-6 w-full"
                onClick={onRequestDemo}
              >
                Request a Demo
              </Button>
            </div>
          </Reveal>
        ))}
      </div>
      <p className={`mt-6 text-center text-xs ${theme.textMuted}`}>
        Managing more than 40 units? <button onClick={onRequestDemo} className="font-medium text-indigo-500 hover:underline">Talk to us about enterprise pricing.</button>
      </p>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   14. FAQ
   -------------------------------------------------------------------------- */
function FaqItem({ q, a }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b ${theme.divider}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className={`text-sm font-medium sm:text-base ${theme.textPrimary}`}>{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${theme.textMuted} ${open ? "rotate-180" : ""}`} />
      </button>
      <div className="overflow-hidden transition-[max-height] duration-200 ease-out" style={{ maxHeight: open ? "160px" : "0px" }}>
        <p className={`pb-4 text-sm leading-relaxed ${theme.textBody}`}>{a}</p>
      </div>
    </div>
  );
}
function Faq() {
  const { theme } = useTheme();
  return (
    <section id="faq" className="scroll-mt-20 border-t border-transparent">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <Reveal className="text-center">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className={`mt-4 text-3xl font-bold tracking-tight ${theme.textPrimary}`}>Questions, answered.</h2>
        </Reveal>
        <div className="mt-8">
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   15. FINAL CTA BAND
   -------------------------------------------------------------------------- */
function FinalCta({ onRequestDemo }) {
    const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <Reveal>
        <div className="rounded-2xl bg-indigo-600 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to manage from one dashboard?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-indigo-100 sm:text-base">
            See Citi Properties with your own portfolio in a 20-minute walkthrough.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              variant="secondary"
              icon={ArrowRight}
              className="border-transparent bg-white text-indigo-600 hover:bg-indigo-50"
              onClick={onRequestDemo}
            >
              Request a Demo
            </Button>
            <Button onClick={() => navigate("/dashboard")} variant="secondary" className="border-white/30 bg-transparent text-white hover:bg-white/10 ">
              Log In
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   16. FOOTER
   -------------------------------------------------------------------------- */
function Footer() {
  const { theme } = useTheme();
  const year = new Date().getFullYear();
  const columns = [
    { title: "Product", links: ["Features", "Pricing", "Log In", "Request a Demo"] },
    { title: "Company", links: ["About", "Careers", "Contact"] },
    { title: "Resources", links: ["Help Center", "Guides", "API Docs"] },
    { title: "Legal", links: ["Privacy Policy", "Terms of Service"] },
  ];
  return (
    <footer className={`border-t ${theme.divider} ${theme.subtleBg}`}>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <a href="#top" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
                <Building2 className="h-4.5 w-4.5" />
              </span>
              <span className={`text-[15px] font-semibold tracking-tight ${theme.textPrimary}`}>Citi Properties</span>
            </a>
            <p className={`mt-3 max-w-xs text-sm leading-relaxed ${theme.textMuted}`}>
              One dashboard for property teams managing units, tenants, and maintenance across East Africa.
            </p>
            <div className="mt-4 flex gap-3">
              {[Twitter, Linkedin, Facebook].map((Icon, i) => (
                <a key={i} href="#" aria-label="Social link" className={`flex h-8 w-8 items-center justify-center rounded-md border ${theme.panelBorder} ${theme.textMuted} ${theme.hoverBg}`}>
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${theme.textMuted}`}>{c.title}</p>
              <ul className="mt-3 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className={`text-sm ${theme.textBody} hover:${theme.textPrimary}`}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={`mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row ${theme.divider}`}>
          <p className={`text-xs ${theme.textMuted}`}>
            Designed &amp; Developed by <span className={theme.textBody}>Mega Technologies</span>
            <span className="mx-1.5">·</span>© {year} All rights reserved.
          </p>
          <div className={`flex items-center gap-4 text-xs ${theme.textMuted}`}>
            <a href="#" className={`hover:${theme.textPrimary}`}>Privacy</a>
            <a href="#" className={`hover:${theme.textPrimary}`}>Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------------------------
   17. PAGE
   -------------------------------------------------------------------------- */
function Landingpage() {
  const { theme } = useTheme();
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className={`min-h-screen w-full ${theme.page}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dialogIn { from { opacity: 0; transform: translateY(-4px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes panSkyline { from { transform: translateX(0); } to { transform: translateX(-32%); } }
        @keyframes sweep { 0%, 100% { transform: translateX(-20%); } 50% { transform: translateX(20%); } }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
        }
      `}</style>

      <Header onRequestDemo={() => setDemoOpen(true)} />
      <Hero onRequestDemo={() => setDemoOpen(true)} />
      <TrustStrip />
      <Features />
      <HowItWorks />
      <Showcase />
      <BookTestimonials />
      <Pricing onRequestDemo={() => setDemoOpen(true)} />
      <Faq />
      <FinalCta onRequestDemo={() => setDemoOpen(true)} />
      <Footer />

      {demoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 animate-[fadeIn_150ms_ease-out] ${theme.isDark ? "bg-black/60" : "bg-slate-900/40"}`} onClick={() => setDemoOpen(false)} />
          <div className={`relative w-full max-w-sm rounded-lg border p-5 shadow-xl animate-[dialogIn_180ms_ease-out] ${theme.panelBg} ${theme.panelBorder}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${theme.textPrimary}`}>Request a Demo</h3>
              <button onClick={() => setDemoOpen(false)} className={`rounded p-1 ${theme.textMuted} ${theme.hoverBg}`}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className={`mt-1.5 text-sm ${theme.textBody}`}>Tell us a little about your portfolio and we'll follow up within a day.</p>
            <form className="mt-4 space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input placeholder="Work email" className={`h-10 w-full rounded-md border px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 ${theme.panelBorder} ${theme.panelBg} ${theme.textPrimary}`} />
              <input placeholder="Number of units" className={`h-10 w-full rounded-md border px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 ${theme.panelBorder} ${theme.panelBg} ${theme.textPrimary}`} />
              <Button variant="primary" className="w-full" type="submit">Send request</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <ThemeProvider>
      <Landingpage />
    </ThemeProvider>
  );
}