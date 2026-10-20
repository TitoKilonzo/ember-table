"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, Bell, Check, CircleHelp,
  Clock3, CookingPot, CreditCard, ExternalLink, Flame, LayoutDashboard,
  LifeBuoy, LogOut, Menu as MenuIcon, Plus, Search,
  Settings2, ShieldCheck, ShoppingBag, SlidersHorizontal, Utensils, Wallet,
} from "lucide-react";
import { menuItems } from "@/lib/menu";
import { formatKES } from "@/lib/format";
import type { StaffRole } from "@/lib/auth-server";

type OrderStatus = "Received" | "Preparing" | "Ready" | "Completed";
type DashboardOrder = { id: string; name: string; initials: string; time: string; mins: number; status: OrderStatus; type: "Pickup" | "Delivery"; items: string; total: number; payment: string };
type Health = { mode?: string; integrations?: { appwrite?: boolean; odooBridge?: boolean; mpesa?: boolean } };

const initialOrders: DashboardOrder[] = [
  { id: "DEMO-005", name: "Sample customer 5", initials: "S5", time: "Just now", mins: 0, status: "Received", type: "Pickup", items: "Ember smash burger × 2, Loaded fries × 1", total: 2380, payment: "Pay on collection or delivery" },
  { id: "DEMO-004", name: "Sample customer 4", initials: "S4", time: "4 min ago", mins: 4, status: "Preparing", type: "Delivery", items: "Crispy herb chicken × 1, Minted lemonade × 2", total: 1370, payment: "Pay on collection or delivery" },
  { id: "DEMO-003", name: "Sample customer 3", initials: "S3", time: "8 min ago", mins: 8, status: "Preparing", type: "Pickup", items: "Sticky chilli wings × 1, Loaded fries × 1", total: 1140, payment: "Pay on collection or delivery" },
  { id: "DEMO-002", name: "Sample customer 2", initials: "S2", time: "12 min ago", mins: 12, status: "Ready", type: "Pickup", items: "Margherita flatbread × 1", total: 1100, payment: "Pay on collection or delivery" },
  { id: "DEMO-001", name: "Sample customer 1", initials: "S1", time: "18 min ago", mins: 18, status: "Completed", type: "Delivery", items: "Market garden bowl × 1, Brownie × 1", total: 1170, payment: "Paid at counter" },
];

const sideNav = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Orders", icon: ShoppingBag },
  { name: "Kitchen", icon: CookingPot },
  { name: "Menu", icon: Utensils },
  { name: "Payments", icon: Wallet },
  { name: "Integrations", icon: Activity },
];
const statusStyles: Record<OrderStatus, string> = {
  Received: "bg-[#F9E4D8] text-[#A44824]",
  Preparing: "bg-[#F8EDCD] text-[#8E6718]",
  Ready: "bg-[#E7EBD8] text-[#53633A]",
  Completed: "bg-stone-100 text-stone-600",
};

function SideBrand() {
  return <Link href="/" className="flex items-center gap-2.5 px-5 py-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ember"><Image src="/brand-mark.svg" alt="" width={36} height={36} className="h-9 w-9"/></span><span><strong className="display-wordmark block text-xl leading-none">ember table</strong><span className="mt-1 block text-[8px] font-bold uppercase tracking-[.24em] text-stone-400">Restaurant workspace</span></span></Link>;
}

function MetricCard({ title, value, detail, icon: Icon, muted = false }: { title: string; value: string; detail: string; icon: typeof Wallet; muted?: boolean }) {
  return <div className="rounded-2xl border border-black/[.055] bg-paper p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-stone-500">{title}</p><p className="mt-3 text-[1.65rem] font-bold tracking-[-.05em] text-ink sm:text-3xl">{value}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3E6D7] text-ember"><Icon size={19}/></span></div><div className={`mt-3 text-[10px] font-semibold ${muted ? "text-stone-400" : "text-olive"}`}>{detail}</div></div>;
}

export default function AdminDashboard({ role, name }: { role: Exclude<StaffRole, "customer">; name: string }) {
  const [activeNav, setActiveNav] = useState("Overview");
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<Health>({ mode: "checking" });
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/health").then((response) => response.json()).then((data: Health) => setHealth(data)).catch(() => setHealth({ mode: "unavailable" }));
  }, []);

  const filteredOrders = useMemo(() => orders.filter((order) => [order.id, order.name, order.items, order.type, order.status].join(" ").toLowerCase().includes(query.toLowerCase())), [orders, query]);
  const advanceOrder = (orderId: string) => {
    setOrders((current) => current.map((order) => order.id !== orderId ? order : ({ ...order, status: order.status === "Received" ? "Preparing" : order.status === "Preparing" ? "Ready" : order.status === "Ready" ? "Completed" : "Completed" })));
    setToast("Sample order updated in this preview.");
    window.setTimeout(() => setToast(""), 2800);
  };
  const signOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign-out request failed.");
      window.location.assign("/login");
    } catch {
      setToast("We could not sign you out. Please try again.");
    }
  };

  const title = activeNav === "Overview" ? "Dashboard preview" : activeNav;

  return <main className="min-h-screen bg-[#F7F2E9] text-ink">
    <div className="flex min-h-screen">
      <aside className={`${mobileNav ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col border-r border-black/[.07] bg-paper transition-transform duration-200 lg:static lg:translate-x-0`}>
        <SideBrand/>
        <div className="px-4 pt-5"><p className="px-3 text-[9px] font-bold uppercase tracking-[.2em] text-stone-400">Workspace</p><nav className="mt-3 space-y-1" aria-label="Dashboard sections">{sideNav.map(({ name, icon: Icon }) => <button key={name} onClick={() => { setActiveNav(name); setMobileNav(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition ${activeNav === name ? "bg-[#F6E3D6] font-bold text-ember" : "font-medium text-stone-600 hover:bg-black/[.035] hover:text-ink"}`}><span className="flex items-center gap-3"><Icon size={17}/>{name}</span></button>)}</nav></div>
        <div className="mt-8 px-4"><p className="px-3 text-[9px] font-bold uppercase tracking-[.2em] text-stone-400">Manage</p><nav className="mt-3 space-y-1"><button onClick={() => setActiveNav("Settings")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${activeNav === "Settings" ? "bg-[#F6E3D6] text-ember" : "text-stone-600 hover:bg-black/[.035]"}`}><Settings2 size={17}/>Settings</button><Link href="/contact" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-stone-600 transition hover:bg-black/[.035]"><LifeBuoy size={17}/>Help centre</Link></nav></div>
        <div className="mt-auto p-4"><div className="rounded-2xl bg-[#F6E8D8] p-4"><div className="flex items-center gap-2 text-ember"><Flame size={16}/><span className="text-xs font-bold">Environment</span></div><p className="mt-2 text-[11px] leading-5 text-stone-600">{health.mode === "appwrite" ? "Appwrite is configured for order storage." : "This preview uses sample orders and does not require a database."}</p><div className="mt-3 flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${health.mode === "appwrite" ? "bg-olive" : "bg-[#D2993B]"}`}/><span className="text-[10px] font-bold text-stone-600">{health.mode === "appwrite" ? "Appwrite connected" : "Preview environment"}</span></div></div><Link href="/" className="mt-4 flex items-center justify-between rounded-xl px-3 py-3 text-xs font-bold text-stone-500 transition hover:bg-black/[.04]"><span className="flex items-center gap-2"><ExternalLink size={14}/>View storefront</span><ArrowDownRight size={14}/></Link><button onClick={signOut} className="flex w-full items-center gap-2 px-3 py-3 text-xs font-bold text-stone-500 transition hover:text-ember"><LogOut size={14}/>Sign out</button></div>
      </aside>
      {mobileNav && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/35 lg:hidden" onClick={() => setMobileNav(false)}/>}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-black/[.07] bg-[#F7F2E9]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-3"><button aria-label="Open navigation" onClick={() => setMobileNav(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 bg-paper lg:hidden"><MenuIcon size={17}/></button><div><div className="flex items-center gap-2 text-[10px] font-semibold text-stone-400"><span>Ember Table</span><span>/</span><span className="text-stone-600">{activeNav}</span></div><p className="mt-1 text-[13px] font-bold">{activeNav === "Overview" ? "Sample data" : `${activeNav} preview`}</p></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><span className="hidden items-center gap-2 rounded-full border border-black/[.08] bg-paper px-3 py-2 text-[10px] font-semibold text-stone-500 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-olive"/>Sample kitchen status</span><button aria-label="Notifications" onClick={() => setToast("There are no alerts in this preview.")} className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-black/[.04]"><Bell size={18}/></button><div className="flex items-center gap-2 border-l border-black/10 pl-3 sm:pl-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[11px] font-bold text-vanilla">{name.slice(0, 2).toUpperCase()}</span><span className="hidden text-right sm:block"><span className="block max-w-[160px] truncate text-xs font-bold">{name}</span><span className="block text-[10px] capitalize text-stone-500">{role === "manager" ? "Assistant Manager" : "Administrator"}</span></span></div></div>
        </header>

        <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Staff workspace preview</p><h1 className="serif-title mt-2 text-4xl sm:text-5xl">{title}</h1><p className="mt-2 text-sm text-stone-500">Figures and orders on this page are examples, not live restaurant data.</p></div><div className="flex flex-wrap items-center gap-2"><button onClick={() => setToast("Reports are not available in this preview.")} className="button-secondary !rounded-xl !px-4 !py-2.5 text-xs"><SlidersHorizontal size={14}/> View report</button><button onClick={() => { setActiveNav("Orders"); setQuery(""); }} className="button-primary !rounded-xl !px-4 !py-2.5 text-xs"><ShoppingBag size={15}/> View orders</button></div></div>

          {activeNav === "Overview" && <>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Revenue" value="Not connected" detail="Connect reporting to view sales." icon={Wallet} muted/><MetricCard title="Orders" value="Not connected" detail="Live order data is not available." icon={ShoppingBag} muted/><MetricCard title="Average order" value="Not connected" detail="Connect reporting to view totals." icon={ShoppingBag} muted/><MetricCard title="Prep time" value="Not connected" detail="Live kitchen data is not available." icon={Clock3} muted/></div>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border border-black/[.055] bg-paper p-6">
                <h2 className="text-sm font-bold">Sales reports</h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">Sales totals and order trends will appear here when reporting is connected.</p>
              </section>
              <section className="rounded-2xl border border-black/[.055] bg-paper p-6">
                <h2 className="text-sm font-bold">Kitchen queue</h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">Live kitchen updates are not connected. The sample orders below can be used to preview the workflow.</p>
                <button onClick={() => setActiveNav("Kitchen")} className="mt-5 flex items-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-xs font-bold transition hover:border-ember/30 hover:text-ember">View sample orders <ArrowDownRight size={14}/></button>
              </section>
            </div>
          </>}

          {(activeNav === "Overview" || activeNav === "Orders" || activeNav === "Kitchen") && <section className="mt-5 overflow-hidden rounded-2xl border border-black/[.055] bg-paper">
            <div className="flex flex-col justify-between gap-4 border-b border-black/[.07] p-5 sm:flex-row sm:items-center sm:px-6"><div><h2 className="text-sm font-bold">{activeNav === "Kitchen" ? "Kitchen order queue" : "Recent orders"}</h2><p className="mt-1 text-xs text-stone-500">{activeNav === "Kitchen" ? "Move each sample order through the kitchen." : "These example orders are for preview only."}</p></div><div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2"><Search size={14} className="text-stone-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders" className="w-32 bg-transparent text-xs outline-none sm:w-44"/></label><button onClick={() => { setOrders(initialOrders); setToast("Example orders restored."); }} className="rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold text-stone-600">Reset examples</button></div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="border-b border-black/[.06] bg-[#FAF5EC] text-[9px] font-bold uppercase tracking-[.12em] text-stone-400"><th className="px-6 py-3">Example order</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-6 py-3 text-right">Action</th></tr></thead><tbody>{filteredOrders.filter((order) => activeNav !== "Kitchen" || order.status !== "Completed").map((order) => <tr key={order.id} className="border-b border-black/[.045] last:border-0 hover:bg-[#FCF8F1]"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#F2E4D5] text-[10px] font-bold text-ember">{order.initials}</span><span><span className="block text-xs font-bold">{order.id}</span><span className="mt-1 block text-[10px] text-stone-500">{order.name}, {order.time}</span></span></div></td><td className="max-w-[250px] px-4 py-4"><p className="line-clamp-2 text-[11px] leading-5 text-stone-600">{order.items}</p></td><td className="px-4 py-4"><span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600">{order.type}</span></td><td className="px-4 py-4 text-xs font-bold">{formatKES(order.total)}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1.5 text-[10px] font-bold ${statusStyles[order.status]}`}>{order.status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => advanceOrder(order.id)} disabled={order.status === "Completed"} className="rounded-lg border border-black/10 px-3 py-2 text-[10px] font-bold transition hover:border-ember/30 hover:text-ember disabled:opacity-35">{order.status === "Received" ? "Start prep" : order.status === "Preparing" ? "Mark ready" : order.status === "Ready" ? "Complete" : "Done"}</button></td></tr>)}</tbody></table>{filteredOrders.length === 0 && <div className="p-10 text-center text-sm text-stone-500">No matching orders.</div>}</div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[.06] px-6 py-4"><p className="text-[10px] text-stone-400">Showing {filteredOrders.length} example orders. Changes are not saved.</p><span className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400"><Activity size={12}/> Preview data</span></div>
          </section>}

          {activeNav === "Menu" && <section className="mt-6 rounded-2xl border border-black/[.055] bg-paper"><div className="flex items-center justify-between gap-3 border-b border-black/[.06] p-5"><div><h2 className="text-sm font-bold">Menu preview</h2><p className="mt-1 text-xs text-stone-500">Items and prices are examples, not a live menu.</p></div><button onClick={() => setToast("Menu editing is not available in this preview.")} className="button-primary !rounded-xl !px-3 !py-2 text-xs"><Plus size={14}/> Add item</button></div><div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{menuItems.map((item) => <div key={item.id} className="flex gap-3 rounded-xl border border-black/[.06] p-3"><Image src={item.image} alt="" width={82} height={76} sizes="82px" className="h-[76px] w-[82px] rounded-lg object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.name}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-stone-500">{item.description}</p><div className="mt-2 flex items-center justify-between"><span className="text-xs font-bold text-ember">{formatKES(item.price)}</span><span className="rounded-full bg-[#E7EBD8] px-2 py-1 text-[9px] font-bold text-olive">Example</span></div></div></div>)}</div></section>}

          {activeNav === "Payments" && <section className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-black/[.055] bg-paper p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F6E3D6] text-ember"><CreditCard size={23}/></span><h2 className="mt-5 text-lg font-bold">Payment options</h2><p className="mt-2 max-w-md text-sm leading-6 text-stone-500">This preview accepts payment on pickup or delivery. Online payments are not enabled.</p><span className="mt-5 inline-flex rounded-full bg-[#F8EDCD] px-3 py-2 text-[10px] font-bold text-[#8E6718]">M-Pesa unavailable</span></div><div className="rounded-2xl border border-black/[.055] bg-paper p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E7EBD8] text-olive"><ShieldCheck size={23}/></span><h2 className="mt-5 text-lg font-bold">Before taking payments</h2><ul className="mt-4 space-y-3 text-xs leading-5 text-stone-600"><li className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-olive"/> Verify each payment with the provider.</li><li className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-olive"/> Keep a record of each transaction.</li><li className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-olive"/> Keep API credentials on the server.</li></ul></div></section>}

          {activeNav === "Integrations" && <section className="mt-6 rounded-2xl border border-black/[.055] bg-paper p-5 sm:p-7"><div><h2 className="text-lg font-bold">Connected systems</h2><p className="mt-1 text-sm text-stone-500">Connection status from the application health endpoint.</p></div><div className="mt-6 grid gap-3 md:grid-cols-3">{[{name:"Appwrite",description:"Order storage and application database",active:!!health.integrations?.appwrite,icon:Activity},{name:"Odoo POS bridge",description:"Order handoff through a custom bridge",active:!!health.integrations?.odooBridge,icon:Utensils},{name:"M-Pesa Daraja",description:"Payment initiation and callback verification",active:false,icon:CreditCard}].map((integration) => <div key={integration.name} className="rounded-2xl border border-black/[.07] p-4"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3E6D7] text-ember"><integration.icon size={18}/></span><span className={`rounded-full px-2.5 py-1.5 text-[9px] font-bold ${integration.active ? "bg-[#E7EBD8] text-olive" : "bg-[#F8EDCD] text-[#8E6718]"}`}>{integration.active ? "Configured" : "Not connected"}</span></div><h3 className="mt-4 text-sm font-bold">{integration.name}</h3><p className="mt-1 min-h-[38px] text-xs leading-5 text-stone-500">{integration.description}</p><button onClick={() => setToast(`${integration.name}: see README.md for configuration and integration requirements.`)} className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-ember">Setup guide <ArrowDownRight size={13}/></button></div>)}</div><div className="mt-5 rounded-xl border border-ember/15 bg-[#FBF0E6] p-4"><div className="flex gap-3"><CircleHelp size={17} className="mt-0.5 shrink-0 text-ember"/><div><p className="text-xs font-bold">Odoo order routing</p><p className="mt-1 text-xs leading-5 text-stone-600">The bridge must send each order to the correct POS configuration, session and kitchen workflow. This preview does not connect directly to Odoo.</p></div></div></div></section>}

          {activeNav === "Settings" && <section className="mt-6 rounded-2xl border border-black/[.055] bg-paper p-6"><h2 className="text-lg font-bold">Restaurant settings</h2><p className="mt-2 max-w-lg text-sm leading-6 text-stone-500">The settings form is not available yet. Add the confirmed restaurant name, address, opening hours and delivery details before launch.</p><button onClick={() => setToast("Settings cannot be changed from this preview.")} className="button-primary mt-5 !rounded-xl">Settings unavailable</button></section>}

          <footer className="flex flex-col justify-between gap-2 py-7 text-[10px] text-stone-400 sm:flex-row sm:items-center"><span>© {new Date().getFullYear()} Ember Table. Staff preview.</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-ember"/> {health.mode === "appwrite" ? "Appwrite connected" : "Sample data"}</span></footer>
        </div>
      </div>
    </div>
    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-[80] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-white shadow-2xl"><Check size={15} className="shrink-0 text-[#E8A17F]"/>{toast}<button aria-label="Dismiss notification" onClick={() => setToast("")} className="ml-2 text-white/60 hover:text-white">×</button></div>}
  </main>;
}
