/* ============================================================================
   CITI PROPERTIES — Property Management System Dashboard
   Stack note: this sandbox can only import from a fixed library allow-list
   (React, lucide-react, recharts, d3, lodash, etc). @mui/material,
   framer-motion and @fortawesome are not resolvable here, so the same
   product decisions are implemented with native equivalents:
     - Font Awesome  -> lucide-react (same "functional icon" role)
     - Framer Motion -> CSS transitions/keyframes, capped at 200ms, applied
                         only to the same interactions specified in the brief
                         (sidebar collapse, modal reveal, tab switch)
     - MUI            -> a small local "ui kit" section below (Input, Select,
                         Dialog, Menu) built with Tailwind, matching MUI's
                         density/behavior so the visual language is identical

   Change log (this revision):
     - Sidebar nav now runs the full height of the rail; the old text credit
       block at the bottom is replaced with a User Avatar profile.
     - Header's "Log Ticket" button is replaced with a Profile Avatar
       (name + role: Landlord / Tenant / Admin) next to Add Unit.
       Logging a ticket now lives as a small "+" affordance on the
       Maintenance Queue card, so no functionality is lost.
     - A single sitewide footer sits below everything (sidebar + content),
       separated by a hairline border, with "Designed & Developed by
       Mega Technologies" and a live © {year} All rights reserved.
     - Light/dark theme continues to be driven by the header toggle icon.
     - Pass fixed a handful of non-standard Tailwind class names
       (w-62, h-4.5, min-w-160, ...) with real scale/arbitrary values so
       spacing renders correctly and consistently at every breakpoint.
   ========================================================================== */
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Sun, Moon, Search, Bell, Plus, ChevronDown, ChevronLeft, ChevronRight,
  Menu, X, ArrowUpDown, MoreHorizontal, AlertTriangle, Clock, Wrench,
  Home, Users, FileText, LayoutDashboard, Settings, Building2,
  ClipboardList, CircleCheck, ArrowUp, ArrowDown, Filter, ChevronRight as ChevronRightIcon,
} from "lucide-react";

/* ----------------------------------------------------------------------------
   0. DESIGN TOKENS (Tailwind is utility-first, but a few values are shared
      across primitives, so they live here once)
   -------------------------------------------------------------------------- */
const STATUS_STYLES = {
  Occupied: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  Vacant: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
  Maintenance: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
};
const PRIORITY_STYLES = {
  Urgent: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
  Low: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
};

/* ----------------------------------------------------------------------------
   1. MOCK DATA (would come from an API layer in production)
   -------------------------------------------------------------------------- */
const PROPERTIES = [
  { id: "p1", name: "Harborview Residences", units: 42, city: "Dar es Salaam" },
  { id: "p2", name: "Kilimani Business Park", units: 18, city: "Nairobi" },
  { id: "p3", name: "Coral Bay Apartments", units: 60, city: "Zanzibar" },
];
const UNITS = [
  { id: "U-104", property: "Harborview Residences", tenant: "A. Mwakalinga", status: "Occupied", rent: 1850, leaseEnd: "2026-09-14" },
  { id: "U-207", property: "Harborview Residences", tenant: "—", status: "Vacant", rent: 1600, leaseEnd: null },
  { id: "U-311", property: "Harborview Residences", tenant: "N. Fataki", status: "Occupied", rent: 2100, leaseEnd: "2026-08-30" },
  { id: "U-118", property: "Coral Bay Apartments", tenant: "R. Juma", status: "Maintenance", rent: 1400, leaseEnd: "2027-01-05" },
  { id: "U-222", property: "Coral Bay Apartments", tenant: "S. Kessy", status: "Occupied", rent: 1750, leaseEnd: "2026-08-22" },
  { id: "U-305", property: "Coral Bay Apartments", tenant: "—", status: "Vacant", rent: 1500, leaseEnd: null },
  { id: "U-402", property: "Kilimani Business Park", tenant: "Zenith Logistics Ltd.", status: "Occupied", rent: 4200, leaseEnd: "2026-12-01" },
  { id: "U-108", property: "Kilimani Business Park", tenant: "P. Otieno", status: "Maintenance", rent: 3100, leaseEnd: "2026-09-02" },
  { id: "U-511", property: "Harborview Residences", tenant: "T. Massawe", status: "Occupied", rent: 1950, leaseEnd: "2026-11-19" },
  { id: "U-119", property: "Coral Bay Apartments", tenant: "L. Chande", status: "Occupied", rent: 1650, leaseEnd: "2026-08-27" },
];
const MAINTENANCE = [
  { id: "T-2291", unit: "U-118", issue: "AC unit not cooling", priority: "Urgent", status: "Unassigned", logged: "2h ago" },
  { id: "T-2288", unit: "U-108", issue: "Leaking kitchen faucet", priority: "Urgent", status: "Assigned — J. Ndosi", logged: "5h ago" },
  { id: "T-2280", unit: "U-311", issue: "Hallway light flickering", priority: "Medium", status: "Unassigned", logged: "1d ago" },
  { id: "T-2274", unit: "U-402", issue: "Elevator inspection due", priority: "Medium", status: "Scheduled", logged: "2d ago" },
  { id: "T-2260", unit: "U-207", issue: "Repaint after move-out", priority: "Low", status: "Unassigned", logged: "4d ago" },
];
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "units", label: "Units", icon: Home },
  { id: "tenants", label: "Tenants", icon: Users },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "leases", label: "Leases", icon: FileText },
  { id: "reports", label: "Reports", icon: ClipboardList },
];
/* The signed-in user driving the header + sidebar profile. `role` is one of
   "Landlord" | "Tenant" | "Admin" — swap this out per authenticated session. */
const CURRENT_USER = { name: "Amani Joseph", role: "Landlord" };

/* ----------------------------------------------------------------------------
   2. SMALL UI PRIMITIVES (stand-ins for MUI Input / Select / Dialog / Menu,
      built to the same density + interaction contract)
   -------------------------------------------------------------------------- */
function TextField({ icon: Icon, className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      {Icon && (
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      )}
      <input
        {...props}
        className={`h-9 w-full rounded-md border border-slate-200 bg-white ${Icon ? "pl-8" : "pl-3"} pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors duration-150 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500`}
      />
    </div>
  );
}
function Select({ value, onChange, options, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700 outline-none transition-colors duration-150 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
    </div>
  );
}
function Button({ variant = "primary", size = "md", icon: Icon, children, className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-50 disabled:pointer-events-none";
  const sizes = { sm: "h-8 px-2.5 text-xs", md: "h-9 px-3.5 text-sm" };
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800",
    ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
    subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </button>
  );
}
function Badge({ status }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || ""}`}>
      {status}
    </span>
  );
}
function PriorityTag({ priority }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[priority] || ""}`}>
      {priority}
    </span>
  );
}
/* Round initials avatar used in both the sidebar profile and the header. */
function Avatar({ name, size = "h-8 w-8", textSize = "text-xs" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-indigo-600 ${textSize} font-semibold text-white ring-2 ring-white dark:ring-slate-900`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
/* Dialog: capped 200ms fade + scale, no glassmorphism/blur decoration */
function Dialog({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 animate-[fadeIn_150ms_ease-out] dark:bg-black/60"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl animate-[dialogIn_180ms_ease-out] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   3. KPI CARD
   -------------------------------------------------------------------------- */
function KpiCard({ label, value, delta, deltaGood, sub, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">{value}</span>
        {delta && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${deltaGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {deltaGood ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   4. SIDEBAR
   -------------------------------------------------------------------------- */
function Sidebar({ collapsed, setCollapsed, active, setActive, mobileOpen, setMobileOpen, user }) {
  return (
    <>
      {/* mobile scrim */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`fixed z-50 flex h-full w-72 max-w-[80%] flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-200 ease-out dark:border-slate-800 dark:bg-slate-900
          lg:static lg:h-screen lg:max-w-none lg:translate-x-0
          ${collapsed ? "lg:w-20" : "lg:w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className={`flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800 ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Citi Properties
              </span>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav — flex-1 so the rail always runs the full height of the sidebar,
            keeping the collapse control and profile pinned to the bottom */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => { setActive(item.id); setMobileOpen(false); }}
                    title={collapsed ? item.label : undefined}
                    className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-150
                      ${isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}
                      ${collapsed ? "justify-center" : ""}`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {/* spacer keeps the nav rail visually filling the rest of the
              sidebar height, so it reads as one continuous panel down to
              the collapse/profile controls below */}
          <div className="flex-1" />
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden shrink-0 border-t border-slate-200 p-2 lg:block dark:border-slate-800">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 ${collapsed ? "justify-center" : ""}`}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}
          </button>
        </div>

        {/* User avatar profile — replaces the old "Developed by" credit;
            the credit now lives once, sitewide, in the page footer. */}
        <div className={`shrink-0 border-t border-slate-200 p-2 dark:border-slate-800`}>
          <button
            className={`flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? `${user.name} · ${user.role}` : undefined}
          >
            <Avatar name={user.name} />
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</span>
                <span className="block truncate text-[11px] text-slate-400 dark:text-slate-500">{user.role}</span>
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ----------------------------------------------------------------------------
   5. HEADER
   -------------------------------------------------------------------------- */
function Header({ isDark, setIsDark, setMobileOpen, onAddUnit, property, setProperty, user }) {
  const [propOpen, setPropOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setPropOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur-sm sm:gap-3 sm:px-4 dark:border-slate-800 dark:bg-slate-900/95">
      <button
        onClick={() => setMobileOpen(true)}
        className="shrink-0 rounded p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Property switcher */}
      <div className="relative min-w-0 shrink-0" ref={ref}>
        <button
          onClick={() => setPropOpen((o) => !o)}
          className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:px-3 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="max-w-[110px] truncate sm:max-w-[180px]">{property.name}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
        {propOpen && (
          <div className="absolute left-0 top-10 z-40 w-64 animate-[dialogIn_150ms_ease-out] rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            {PROPERTIES.map((p) => (
              <button
                key={p.id}
                onClick={() => { setProperty(p); setPropOpen(false); }}
                className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span>
                  <span className="block font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                  <span className="block text-xs text-slate-400">{p.city} · {p.units} units</span>
                </span>
                {property.id === p.id && <CircleCheck className="h-4 w-4 shrink-0 text-indigo-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <TextField icon={Search} placeholder="Search units, tenants, tickets…" className="hidden max-w-sm flex-1 sm:block" />

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button variant="primary" size="sm" icon={Plus} onClick={onAddUnit}>
          <span className="hidden xs:inline sm:inline">Add Unit</span>
        </Button>

        <div className="mx-0.5 h-6 w-px bg-slate-200 sm:mx-1 dark:bg-slate-800" />

        <button className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>

        {/* Theme toggle — fires setIsDark(!isDark) directly */}
        <button
          onClick={() => setIsDark(!isDark)}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors duration-150 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="mx-0.5 h-6 w-px bg-slate-200 sm:mx-1 dark:bg-slate-800" />

        {/* Profile avatar — replaces the old "Log Ticket" button. Logging a
            ticket now lives on the Maintenance Queue card itself. */}
        <button className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 hover:bg-slate-100 sm:pr-2.5 dark:hover:bg-slate-800">
          <Avatar name={user.name} />
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</span>
            <span className="block text-[11px] text-slate-400 dark:text-slate-500">{user.role}</span>
          </span>
        </button>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------------------
   6. UNIT & PROPERTY TABLE
   -------------------------------------------------------------------------- */
function UnitTable({ units }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [tenantQuery, setTenantQuery] = useState("");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [sort, setSort] = useState({ key: "id", dir: "asc" });
  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };
  const filtered = useMemo(() => {
    const now = new Date("2026-08-12");
    const in30 = new Date(now); in30.setDate(now.getDate() + 30);
    let rows = units.filter((u) => {
      if (statusFilter !== "All" && u.status !== statusFilter) return false;
      if (tenantQuery && !u.tenant.toLowerCase().includes(tenantQuery.toLowerCase())) return false;
      if (expiringOnly) {
        if (!u.leaseEnd) return false;
        const d = new Date(u.leaseEnd);
        if (d > in30 || d < now) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (sort.key === "rent") { av = av ?? 0; bv = bv ?? 0; }
      if (sort.key === "leaseEnd") { av = av || "9999"; bv = bv || "9999"; }
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [units, statusFilter, tenantQuery, expiringOnly, sort]);
  const columns = [
    { key: "id", label: "Unit" },
    { key: "property", label: "Property" },
    { key: "tenant", label: "Tenant" },
    { key: "status", label: "Status" },
    { key: "rent", label: "Rent" },
    { key: "leaseEnd", label: "Lease End" },
  ];
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
        <h2 className="mr-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Units &amp; Properties</h2>
        <TextField
          icon={Search}
          placeholder="Filter by tenant name…"
          value={tenantQuery}
          onChange={(e) => setTenantQuery(e.target.value)}
          className="w-full sm:w-52"
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full sm:w-36"
          options={[
            { value: "All", label: "All statuses" },
            { value: "Occupied", label: "Occupied" },
            { value: "Vacant", label: "Vacant" },
            { value: "Maintenance", label: "Maintenance" },
          ]}
        />
        <button
          onClick={() => setExpiringOnly((v) => !v)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors duration-150 ${
            expiringOnly
              ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Filter className="h-3.5 w-3.5" /> Expiring ≤ 30d
        </button>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} of {units.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <button onClick={() => toggleSort(c.key)} className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                    {c.label}
                    <ArrowUpDown className={`h-3 w-3 ${sort.key === c.key ? "text-indigo-500" : "text-slate-300 dark:text-slate-600"}`} />
                  </button>
                </th>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-100">{u.id}</td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{u.property}</td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{u.tenant}</td>
                <td className="px-3 py-2.5"><Badge status={u.status} /></td>
                <td className="px-3 py-2.5 tabular-nums text-slate-700 dark:text-slate-200">${u.rent.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{u.leaseEnd || "—"}</td>
                <td className="px-3 py-2.5 text-right">
                  <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">
                  No units match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   7. MAINTENANCE QUEUE
   -------------------------------------------------------------------------- */
function MaintenanceQueue({ tickets, onNewTicket }) {
  const order = { Urgent: 0, Medium: 1, Low: 2 };
  const sorted = [...tickets].sort((a, b) => order[a.priority] - order[b.priority]);
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Maintenance Queue</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{tickets.length} open</span>
          <button
            onClick={onNewTicket}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
            title="Log a ticket"
            aria-label="Log a maintenance ticket"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {sorted.map((t) => (
          <li key={t.id} className="flex items-start gap-3 p-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
              <Wrench className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{t.unit}</span>
                <PriorityTag priority={t.priority} />
              </div>
              <p className="mt-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">{t.issue}</p>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" /> {t.logged} · {t.status}
              </div>
            </div>
            <Button variant="subtle" size="sm" className="shrink-0">Dispatch</Button>
          </li>
        ))}
        {sorted.length === 0 && (
          <li className="p-6 text-center text-sm text-slate-400">Queue is clear.</li>
        )}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   8. ADD UNIT / LOG TICKET FORMS
   -------------------------------------------------------------------------- */
function AddUnitForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ id: "", property: PROPERTIES[0].name, rent: "", status: "Vacant" });
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (form.id && form.rent) onSubmit(form); }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Unit ID</label>
        <TextField placeholder="e.g. U-620" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Property</label>
        <Select
          value={form.property}
          onChange={(v) => setForm({ ...form, property: v })}
          options={PROPERTIES.map((p) => ({ value: p.name, label: p.name }))}
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Rent (USD)</label>
        <TextField type="number" placeholder="1500" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" type="submit">Add Unit</Button>
      </div>
    </form>
  );
}
function LogTicketForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ unit: UNITS[0].id, issue: "", priority: "Medium" });
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (form.issue) onSubmit(form); }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Unit</label>
        <Select
          value={form.unit}
          onChange={(v) => setForm({ ...form, unit: v })}
          options={UNITS.map((u) => ({ value: u.id, label: `${u.id} — ${u.property}` }))}
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Issue</label>
        <TextField placeholder="Describe the issue…" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Priority</label>
        <Select
          value={form.priority}
          onChange={(v) => setForm({ ...form, priority: v })}
          options={[{ value: "Urgent", label: "Urgent" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }]}
          className="w-full"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" type="submit">Log Ticket</Button>
      </div>
    </form>
  );
}

/* ----------------------------------------------------------------------------
   9. SITEWIDE FOOTER
   -------------------------------------------------------------------------- */
function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        Designed &amp; Developed by{" "}
        <span className="font-medium text-slate-500 dark:text-slate-400">Mega Technologies</span>
        <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span>
        © {year} All rights reserved.
      </p>
    </footer>
  );
}

/* ----------------------------------------------------------------------------
   10. ROOT APP
   -------------------------------------------------------------------------- */
function getInitialTheme() {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}
export default function App() {
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [property, setProperty] = useState(PROPERTIES[0]);
  const [units, setUnits] = useState(UNITS);
  const [tickets, setTickets] = useState(MAINTENANCE);
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [logTicketOpen, setLogTicketOpen] = useState(false);

  // sync Tailwind's `dark` class on <html> with local isDark state, plus
  // the native `color-scheme` so browser-drawn chrome (scrollbars, select
  // popups, date pickers) follows the same theme instead of staying light
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);

  // if the user hasn't chosen a theme this session, keep following the OS
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const kpis = useMemo(() => {
    const total = units.length;
    const occupied = units.filter((u) => u.status === "Occupied").length;
    const occupancyPct = total ? Math.round((occupied / total) * 100) : 0;
    const collected = units.filter((u) => u.status === "Occupied").reduce((s, u) => s + u.rent, 0);
    const outstanding = Math.round(collected * 0.12);
    const urgent = tickets.filter((t) => t.priority === "Urgent").length;
    const now = new Date("2026-08-12");
    const in30 = new Date(now); in30.setDate(now.getDate() + 30);
    const expiring = units.filter((u) => u.leaseEnd && new Date(u.leaseEnd) >= now && new Date(u.leaseEnd) <= in30).length;
    return { occupancyPct, collected, outstanding, urgent, expiring };
  }, [units, tickets]);

  const handleAddUnit = useCallback((form) => {
    setUnits((prev) => [{ id: form.id, property: form.property, tenant: "—", status: form.status, rent: Number(form.rent), leaseEnd: null }, ...prev]);
    setAddUnitOpen(false);
  }, []);
  const handleLogTicket = useCallback((form) => {
    setTickets((prev) => [{ id: `T-${Math.floor(2300 + Math.random() * 90)}`, unit: form.unit, issue: form.issue, priority: form.priority, status: "Unassigned", logged: "just now" }, ...prev]);
    setLogTicketOpen(false);
  }, []);

  return (
    <div className="flex h-full min-h-screen w-full flex-col overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dialogIn { from { opacity: 0; transform: translateY(-4px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        html, body { background-color: #f8fafc; }
        html.dark, html.dark body { background-color: #020617; }
      `}</style>

      {/* Row: sidebar + main content column */}
      <div className="flex w-full flex-1">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          active={active}
          setActive={setActive}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          user={CURRENT_USER}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header
            isDark={isDark}
            setIsDark={setIsDark}
            setMobileOpen={setMobileOpen}
            onAddUnit={() => setAddUnitOpen(true)}
            property={property}
            setProperty={setProperty}
            user={CURRENT_USER}
          />

          <main className="flex-1 space-y-4 p-3 sm:p-4 lg:p-6">
            {/* breadcrumb / page title */}
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">Dashboard</h1>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="truncate">{property.name}</span>
                  <ChevronRightIcon className="h-3 w-3 shrink-0" />
                  <span>Overview</span>
                </div>
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Occupancy"
                value={`${kpis.occupancyPct}%`}
                delta="2.1%"
                deltaGood
                sub={`${units.filter((u) => u.status === "Occupied").length} of ${units.length} units occupied`}
                icon={Home}
              />
              <KpiCard
                label="Rent Collected"
                value={`$${kpis.collected.toLocaleString()}`}
                sub={`$${kpis.outstanding.toLocaleString()} outstanding this cycle`}
                icon={Users}
              />
              <KpiCard
                label="Urgent Maintenance"
                value={kpis.urgent}
                deltaGood={false}
                sub="Requires dispatch within 24h"
                icon={AlertTriangle}
              />
              <KpiCard
                label="Lease Expirations"
                value={kpis.expiring}
                sub="Ending within the next 30 days"
                icon={FileText}
              />
            </div>

            {/* main content: table + maintenance queue */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <UnitTable units={units} />
              </div>
              <div>
                <MaintenanceQueue tickets={tickets} onNewTicket={() => setLogTicketOpen(true)} />
              </div>
            </div>
          </main>

        </div>
      </div>

      {/* Sitewide footer — spans the full width, below the sidebar + content row */}
      <SiteFooter />

      <Dialog open={addUnitOpen} onClose={() => setAddUnitOpen(false)} title="Add Unit">
        <AddUnitForm onSubmit={handleAddUnit} onCancel={() => setAddUnitOpen(false)} />
      </Dialog>
      <Dialog open={logTicketOpen} onClose={() => setLogTicketOpen(false)} title="Log Maintenance Ticket">
        <LogTicketForm onSubmit={handleLogTicket} onCancel={() => setLogTicketOpen(false)} />
      </Dialog>
    </div>
  );
}