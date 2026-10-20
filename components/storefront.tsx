"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownRight, ArrowRight, Check, ChevronDown, Clock3, Flame, Leaf, MapPin,
  Menu as MenuIcon, Minus, Phone, Plus, Search, ShoppingBag, Utensils, X,
} from "lucide-react";
import { categories, menuItems, type MenuCategory, type MenuItem } from "@/lib/menu";
import { formatKES } from "@/lib/format";

type CartLine = { id: string; quantity: number };
type OrderResponse = { ok?: boolean; order?: { orderNumber: string; total: number; status: string; fulfilmentType: string }; message?: string; error?: string; note?: string; warning?: string; odoo?: { synced: boolean; message: string } };

const PHOTO = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=90";

function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`group inline-flex items-center gap-2.5 ${light ? "text-white" : "text-ink"}`} aria-label="Ember Table home">
    <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-ember text-vanilla shadow-sm transition group-hover:rotate-[-5deg]">
      <Image src="/brand-mark.svg" width={40} height={40} alt="" priority />
    </span>
    <span className="leading-none">
      <span className="display-wordmark block text-[23px] font-bold tracking-tight">ember table</span>
      <span className={`mt-1 block text-[8px] font-bold uppercase tracking-[.25em] ${light ? "text-white/55" : "text-stone-500"}`}>Westlands · Open 24/7</span>
    </span>
  </Link>;
}

function ProductCard({ item, addToCart, quantity }: { item: MenuItem; addToCart: (id: string) => void; quantity: number }) {
  return <article className="menu-card group flex h-full flex-col overflow-hidden rounded-[1.45rem] border border-[#3f2b1e]/[.08] bg-paper transition duration-300 hover:-translate-y-1 hover:shadow-soft">
    <div className="menu-card-photo relative h-[194px] sm:h-[210px]">
      <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw" className="object-cover" />
      {item.badge && <span className="absolute left-3 top-3 rounded-full bg-vanilla/95 px-3 py-1.5 text-[10px] font-bold tracking-wide text-ink shadow-sm">{item.badge}</span>}
      <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-bold text-ink"><Clock3 size={12} /> {item.prepMinutes} min</span>
      {quantity > 0 && <span className="absolute right-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-ember px-2 text-xs font-bold text-white shadow">{quantity} in bag</span>}
    </div>
    <div className="flex flex-1 flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug tracking-tight">{item.name}</h3>
        <span className="whitespace-nowrap text-sm font-bold text-ember">{formatKES(item.price)}</span>
      </div>
      <p className="mt-2 min-h-[42px] text-xs leading-[1.7] text-stone-500">{item.description}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-[10px] font-semibold text-stone-500"><Flame size={13} className="text-ember" /> Prepared to order</span>
        <button onClick={() => addToCart(item.id)} disabled={quantity >= 20 || !item.isAvailable} aria-label={quantity >= 20 ? `Maximum quantity reached for ${item.name}` : `Add ${item.name} to bag`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F3E6D6] text-ember transition hover:bg-ember hover:text-white focus:outline-none focus:ring-4 focus:ring-ember/20 disabled:cursor-not-allowed disabled:opacity-40">
          <Plus size={19} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  </article>;
}

export default function Storefront() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("Popular");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<OrderResponse["order"] | null>(null);
  const [orderMessage, setOrderMessage] = useState("");
  const [fulfilment, setFulfilment] = useState<"pickup" | "delivery">("pickup");
  const [paymentMethod, setPaymentMethod] = useState<"pay_on_fulfilment" | "mpesa">("pay_on_fulfilment");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "", instructions: "" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const checkoutRequestRef = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("ember-table-cart-v1");
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const safeCart = parsed
            .filter((line): line is CartLine => Boolean(line) && typeof line === "object" && typeof line.id === "string" && Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 20 && menuItems.some((item) => item.id === line.id))
            .filter((line, index, rows) => rows.findIndex((row) => row.id === line.id) === index);
          setCart(safeCart);
        }
      }
    } catch { /* Ignore malformed or unavailable local storage. */ }
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem("ember-table-cart-v1", JSON.stringify(cart)); } catch { /* Private browsing may disable storage. */ }
  }, [cart]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((current) => {
      const found = current.find((line) => line.id === id);
      if (!found && delta > 0) return [...current, { id, quantity: 1 }];
      return current.map((line) => line.id === id ? { ...line, quantity: Math.min(20, line.quantity + delta) } : line).filter((line) => line.quantity > 0);
    });
  }, []);
  const addToCart = useCallback((id: string) => updateQuantity(id, 1), [updateQuantity]);
  const cartDetails = useMemo(() => cart.map((line) => ({ ...line, item: menuItems.find((item) => item.id === line.id) })).filter((line): line is CartLine & { item: MenuItem } => Boolean(line.item)), [cart]);
  const cartCount = cartDetails.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartDetails.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const deliveryFee = fulfilment === "delivery" && cartCount > 0 ? 180 : 0;
  const total = subtotal + deliveryFee;
  const visibleItems = useMemo(() => menuItems.filter((item) => {
    const categoryMatch = activeCategory === "Popular" ? item.popular : item.category === activeCategory;
    const searchMatch = `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && searchMatch;
  }), [activeCategory, search]);

  const openCheckout = () => {
    setCheckoutError(""); setOrderSuccess(null); setCheckoutOpen(true); setCartOpen(false);
  };
  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setCheckoutError("");
    if (cartDetails.length === 0) return setCheckoutError("Your bag is empty.");
    if (paymentMethod === "mpesa") return setCheckoutError("M-Pesa payments are not available in this preview. Choose payment on collection or delivery.");
    setCheckoutBusy(true);
    try {
      // Reuse the same idempotency key when an identical checkout is retried after a network error.
      const requestFingerprint = JSON.stringify({ customer, fulfilment, paymentMethod, items: cartDetails.map(({ id, quantity }) => ({ id, quantity })) });
      if (!checkoutRequestRef.current || checkoutRequestRef.current.fingerprint !== requestFingerprint) {
        const key = window.crypto?.randomUUID?.() ?? `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        checkoutRequestRef.current = { fingerprint: requestFingerprint, key };
      }
      const idempotencyKey = checkoutRequestRef.current.key;
      const response = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: customer.name, phone: customer.phone, email: customer.email },
          fulfilmentType: fulfilment, paymentMethod, address: customer.address,
          instructions: customer.instructions,
          items: cartDetails.map(({ id, quantity }) => ({ id, quantity })), idempotencyKey,
        }),
      });
      const result = await response.json() as OrderResponse;
      if (!response.ok || !result.ok || !result.order) throw new Error(result.error ?? "We could not submit your order. Please try again.");
      setOrderSuccess(result.order); setOrderMessage(result.warning ?? result.note ?? result.message ?? "Your order has been received.");
      checkoutRequestRef.current = null;
      setCart([]);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Network error. Please try again.");
    } finally { setCheckoutBusy(false); }
  };

  return <main className="min-h-screen overflow-x-clip bg-vanilla text-ink">
    <div className="bg-ink px-4 py-2 text-center text-[10px] font-semibold tracking-[.1em] text-vanilla sm:text-[11px]">
      <span className="inline-flex items-center gap-2"><MapPin size={13} className="text-[#E6A17F]" /> Westlands <Clock3 size={13} className="ml-2 text-[#E6A17F]" /> Open 24/7</span>
    </div>
    <header className="relative z-30 border-b border-black/[.06] bg-vanilla/95 backdrop-blur-xl">
      <div className="page-shell flex h-[78px] items-center justify-between gap-4">
        <Brand />
        <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Main navigation">
          <a href="#menu" className="text-[13px] font-semibold text-stone-600 transition hover:text-ember">The menu</a>
          <a href="#story" className="text-[13px] font-semibold text-stone-600 transition hover:text-ember">How it works</a>
          <a href="#visit" className="text-[13px] font-semibold text-stone-600 transition hover:text-ember">Find us</a>
          <Link href="/contact" className="text-[13px] font-semibold text-stone-600 transition hover:text-ember">Contact</Link>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link href="/login" className="hidden text-[13px] font-semibold text-stone-600 transition hover:text-ember lg:inline">Sign in</Link>
          <Link href="/register" className="hidden rounded-full border border-ember/20 px-3 py-2 text-[12px] font-bold text-ember transition hover:bg-ember hover:text-white xl:inline">Register</Link>
          <button aria-label="Search menu" onClick={() => { setSearchOpen((value) => !value); setTimeout(() => document.getElementById("menu-search")?.focus(), 40); }} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/[.04]"><Search size={19} /></button>
          <button onClick={() => setCartOpen(true)} className="relative inline-flex h-11 items-center gap-2 rounded-full bg-ember px-4 text-sm font-bold text-white transition hover:bg-ember-dark">
            <ShoppingBag size={17} /><span className="hidden sm:inline">Your bag</span>{cartCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-vanilla px-1 text-[10px] font-black text-ember">{cartCount}</span>}
          </button>
          <button aria-label="Open menu" onClick={() => setMobileMenuOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full border border-black/10 md:hidden"><MenuIcon size={18} /></button>
        </div>
      </div>
      {mobileMenuOpen && <div className="border-t border-black/10 bg-paper px-5 py-4 md:hidden"><div className="flex flex-col gap-4 text-sm font-semibold"><a onClick={() => setMobileMenuOpen(false)} href="#menu">The menu</a><a onClick={() => setMobileMenuOpen(false)} href="#story">How it works</a><a onClick={() => setMobileMenuOpen(false)} href="#visit">Find us</a><Link href="/contact" className="inline-flex items-center gap-1">Contact</Link><Link href="/login" className="inline-flex items-center gap-1">Sign in</Link><Link href="/register" className="inline-flex items-center gap-1">Register</Link><Link href="/admin" className="inline-flex items-center gap-1 text-ember">Staff workspace <ArrowRight size={14}/></Link></div></div>}
    </header>

    <section className="relative overflow-hidden">
      <div className="hero-orbit -right-28 -top-28 h-[540px] w-[540px]" />
      <div className="hero-orbit -right-8 -top-8 h-[390px] w-[390px]" />
      <div className="page-shell relative grid min-h-[610px] items-center gap-10 py-14 md:grid-cols-[.95fr_1.05fr] md:py-16 lg:min-h-[660px] lg:gap-16 lg:py-20">
        <div className="relative z-10 max-w-[590px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ember/15 bg-white/55 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-ember"><MapPin size={13}/> Westlands</div>
          <h1 className="serif-title max-w-[620px] text-[clamp(3.4rem,7vw,6.7rem)] leading-[.91]">Burgers,<br/><span className="text-ember">bowls and</span><br/>more.</h1>
          <p className="mt-6 max-w-[420px] text-sm leading-7 text-stone-600 sm:text-base">Pick your meal, add it to your bag and choose pickup or delivery at checkout. We’re open around the clock.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#menu" className="button-primary">Explore the menu <ArrowRight size={16}/></a>
            <a href="#story" className="inline-flex items-center gap-2 rounded-full px-3 py-3 text-sm font-bold text-ink transition hover:text-ember">How ordering works <ArrowDownRight size={16}/></a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-black/[.08] pt-6 text-[11px] font-semibold text-stone-500">
            <span className="flex items-center gap-2"><ShoppingBag size={14} className="text-ember"/> Order online</span>
            <span className="flex items-center gap-2"><MapPin size={14} className="text-olive"/> Pickup or delivery</span>
            <span className="flex items-center gap-2"><Clock3 size={14} className="text-ember"/> Prep times shown</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[590px]">
          <div className="hero-photo relative aspect-[.96] overflow-hidden rounded-[2rem] bg-[#E8D7C4] sm:aspect-[1.08] md:aspect-[.92]">
            <Image src={PHOTO} alt="Illustrative photo of a burger and fries" fill priority sizes="(max-width: 768px) 94vw, 48vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2b160d]/40 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3 text-white sm:bottom-7 sm:left-7 sm:right-7">
              <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-white/75">On the menu</p><p className="serif-title mt-1 text-3xl sm:text-4xl">Ember Smash Burger</p></div>
              <button onClick={() => addToCart("ember-burger")} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-vanilla text-ember shadow-lg transition hover:scale-105" aria-label="Add Ember smash burger"><Plus size={22}/></button>
            </div>
          </div>
          <div className="floating-stamp absolute -left-3 top-7 grid h-[94px] w-[94px] place-items-center rounded-full border-[5px] border-vanilla bg-ember text-center text-vanilla shadow-xl sm:-left-7 sm:top-12 sm:h-[112px] sm:w-[112px]">
            <div><Utensils size={17} className="mx-auto mb-1"/><p className="text-[9px] font-black uppercase leading-[1.35] tracking-[.1em]">Made to<br/>order</p></div>
          </div>
          <div className="absolute -bottom-5 right-4 rounded-2xl border border-black/[.06] bg-paper px-4 py-3 shadow-soft sm:right-8 sm:px-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#E7EBD8] text-olive"><Clock3 size={18}/></div><div><p className="text-xs font-bold">Estimated prep time</p><p className="mt-1 text-[10px] text-stone-500">Shown on each menu item</p></div></div></div>
        </div>
      </div>
    </section>

    <section className="border-y border-black/[.05] bg-[#F7ECDC] py-4">
      <div className="page-shell flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[10px] font-bold uppercase tracking-[.17em] text-stone-600 sm:justify-between">
        <span className="flex items-center gap-2"><ShoppingBag size={14} className="text-ember"/> Browse the menu</span><span className="hidden text-ember/35 sm:inline"><Utensils size={14}/></span><span className="flex items-center gap-2"><MapPin size={14} className="text-olive"/> Choose pickup or delivery</span><span className="hidden text-ember/35 sm:inline"><Utensils size={14}/></span><span className="flex items-center gap-2"><Clock3 size={14} className="text-ember"/> Check prep times</span>
      </div>
    </section>

    <section id="menu" className="scroll-mt-20 py-16 sm:py-20 lg:py-24">
      <div className="page-shell">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="eyebrow">Made for your next meal</p><h2 className="serif-title mt-3 text-5xl leading-none sm:text-6xl">The menu.</h2><p className="mt-4 max-w-md text-sm leading-6 text-stone-500">Choose from burgers, mains, sides, drinks and desserts. Add your order to the bag when you’re ready. Prices are in KSh. Photos are illustrative.</p></div>
          <div className="flex items-center gap-2 self-start rounded-full border border-black/10 bg-white/55 px-4 py-2.5 text-[11px] font-semibold text-stone-500 sm:self-auto"><span className="h-2 w-2 rounded-full bg-olive"/> Open 24/7 <ChevronDown size={13}/></div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="menu-scroll flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition ${activeCategory === category ? "border-ember bg-ember text-white shadow-sm" : "border-black/[.08] bg-white/45 text-stone-600 hover:border-ember/35 hover:text-ember"}`}>{category}</button>)}
          </div>
          {searchOpen && <label className="flex items-center gap-2 rounded-full border border-black/10 bg-paper px-4 py-2.5 sm:w-[240px]"><Search size={15} className="text-stone-400"/><input id="menu-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the menu" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-stone-400"/><button onClick={() => { setSearch(""); setSearchOpen(false); }} aria-label="Close search"><X size={14}/></button></label>}
        </div>
        {visibleItems.length > 0 ? <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleItems.map((item) => <ProductCard key={item.id} item={item} addToCart={addToCart} quantity={cart.find((line) => line.id === item.id)?.quantity ?? 0}/>)}
        </div> : <div className="mt-7 rounded-3xl border border-dashed border-black/15 bg-white/35 px-5 py-14 text-center"><Search size={26} className="mx-auto text-stone-400"/><p className="mt-3 font-semibold">No matching dishes.</p><p className="mt-1 text-sm text-stone-500">Try another search or choose a different category.</p><button onClick={() => { setSearch(""); setActiveCategory("Popular"); }} className="mt-4 text-sm font-bold text-ember">Clear filters</button></div>}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl border border-ember/10 bg-[#F5E8D7] p-5 sm:flex-row sm:px-7"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-ember"><Leaf size={20}/></div><div><p className="text-sm font-bold">Dietary notes</p><p className="mt-1 text-xs text-stone-500">Add a note at checkout for the kitchen.</p></div></div><a href="#visit" className="inline-flex items-center gap-2 text-xs font-bold text-ember">See location and hours <ArrowRight size={14}/></a></div>
      </div>
    </section>

    <section id="story" className="scroll-mt-20 bg-[#2C2923] py-16 text-vanilla sm:py-20 lg:py-24">
      <div className="page-shell grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="relative aspect-[1.1] overflow-hidden rounded-[1.8rem] bg-[#66513E]"><Image src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1100&q=85" alt="Illustrative photo of a restaurant kitchen" fill sizes="(max-width:768px) 90vw, 44vw" className="object-cover opacity-90"/></div>
          <div className="absolute -bottom-5 -right-3 rounded-2xl bg-vanilla px-5 py-4 text-ink shadow-xl sm:-right-5"><p className="serif-title text-3xl">Place an order.</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-stone-500">Pickup or delivery</p></div>
        </div>
        <div className="max-w-[500px]">
          <p className="eyebrow !text-[#E8A17F]">How it works</p><h2 className="serif-title mt-4 text-5xl leading-[.98] sm:text-6xl">Choose your food.<br/><span className="text-[#E8A17F]">We’ll handle the rest.</span></h2>
          <p className="mt-6 text-sm leading-7 text-white/65">Order online any time. Choose pickup or delivery at checkout, then pay when your order arrives or is ready for collection.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6"><div><p className="serif-title text-3xl">Pickup</p><p className="mt-1 text-xs text-white/50">Choose it at checkout</p></div><div><p className="serif-title text-3xl">Delivery</p><p className="mt-1 text-xs text-white/50">Fee shown before you order</p></div></div>
        </div>
      </div>
    </section>

    <section id="visit" className="scroll-mt-20 py-16 sm:py-20">
      <div className="page-shell"><div className="overflow-hidden rounded-[2rem] bg-[#E8D8C5] p-6 sm:p-10 lg:p-12"><div className="grid gap-8 md:grid-cols-[1.1fr_.9fr] md:items-center"><div><p className="eyebrow">Visit or order online</p><h2 className="serif-title mt-3 text-5xl leading-none sm:text-6xl">Westlands, any time.</h2><p className="mt-4 max-w-md text-sm leading-6 text-stone-600">We’re open 24 hours a day. Place an order online for pickup or delivery.</p><div className="mt-7 flex flex-wrap gap-3"><button onClick={() => { setFulfilment("pickup"); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }} className="button-primary">Order for pickup <ArrowRight size={15}/></button><button onClick={() => { setFulfilment("delivery"); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }} className="button-secondary">Order delivery</button></div></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-black/[.06] bg-paper/80 p-5"><MapPin size={19} className="text-ember"/><p className="mt-4 text-sm font-bold">Location</p><p className="mt-2 text-xs leading-5 text-stone-500">Westlands</p></div><div className="rounded-2xl border border-black/[.06] bg-paper/80 p-5"><Clock3 size={19} className="text-ember"/><p className="mt-4 text-sm font-bold">Opening hours</p><p className="mt-2 text-xs leading-5 text-stone-500">Open 24 hours, every day</p></div><div className="rounded-2xl border border-black/[.06] bg-paper/80 p-5"><Phone size={19} className="text-ember"/><p className="mt-4 text-sm font-bold">Call</p><a href="tel:+254743336009" className="mt-2 block text-xs leading-5 text-stone-600 hover:text-ember">+254 743 336 009</a></div></div></div></div></div>
    </section>

    <footer className="border-t border-black/[.08] bg-paper py-8">
      <div className="page-shell flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><Brand/><p className="text-xs text-stone-500">© {new Date().getFullYear()} Ember Table</p><div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-stone-500"><a href="#menu" className="hover:text-ember">Menu</a><Link href="/contact" className="hover:text-ember">Contact</Link><Link href="/login" className="hover:text-ember">Sign in</Link><Link href="/register" className="hover:text-ember">Register</Link><Link href="/admin" className="hover:text-ember">Staff workspace</Link></div></div>
    </footer>

    {cartOpen && <div className="panel-backdrop fixed inset-0 z-50 bg-[#23180f]/45 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
      <aside className="panel-card ml-auto flex h-full w-full max-w-[470px] flex-col bg-paper shadow-2xl" aria-label="Shopping bag">
        <div className="flex items-center justify-between border-b border-black/[.08] px-5 py-5 sm:px-7"><div>        <p className="eyebrow">Your order</p><h2 className="serif-title mt-1 text-3xl">Your bag <span className="text-stone-400">({cartCount})</span></h2></div><button onClick={() => setCartOpen(false)} aria-label="Close bag" className="grid h-10 w-10 place-items-center rounded-full hover:bg-black/5"><X size={19}/></button></div>
        {cartDetails.length ? <><div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-7">{cartDetails.map(({ id, item, quantity }) => <div key={id} className="flex gap-3 border-b border-black/[.07] pb-4"><div className="relative h-[84px] w-[88px] shrink-0 overflow-hidden rounded-2xl bg-[#F1E3D0]"><Image src={item.image} alt="" fill sizes="88px" className="object-cover"/></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="text-sm font-bold">{item.name}</p><p className="whitespace-nowrap text-sm font-bold">{formatKES(item.price * quantity)}</p></div><p className="mt-1 text-xs text-stone-500">{formatKES(item.price)} each</p><div className="mt-3 inline-flex items-center gap-3 rounded-full border border-black/10 bg-white px-2 py-1"><button aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(id, -1)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-stone-100"><Minus size={13}/></button><span className="w-3 text-center text-xs font-bold">{quantity}</span><button aria-label={`Add one ${item.name}`} disabled={quantity >= 20} onClick={() => updateQuantity(id, 1)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={13}/></button></div></div></div>)}</div><div className="border-t border-black/[.08] bg-vanilla/65 p-5 sm:p-7"><div className="flex justify-between text-xs text-stone-500"><span>Subtotal</span><span className="font-semibold text-ink">{formatKES(subtotal)}</span></div><div className="mt-2 flex justify-between text-xs text-stone-500"><span>Delivery</span><span className="font-semibold text-ink">{fulfilment === "delivery" ? formatKES(180) : "Pickup is free"}</span></div><div className="mt-4 flex justify-between border-t border-black/10 pt-4"><span className="font-bold">Estimated total</span><span className="serif-title text-2xl font-bold text-ember">{formatKES(total)}</span></div><button onClick={openCheckout} className="button-primary mt-5 w-full py-4">Continue to checkout <ArrowRight size={16}/></button><p className="mt-3 text-center text-[10px] text-stone-500">Online payment is not enabled in this preview.</p></div></> : <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><div className="grid h-20 w-20 place-items-center rounded-full bg-[#F2E6D6] text-ember"><ShoppingBag size={30}/></div><h3 className="serif-title mt-5 text-3xl">Your bag is empty.</h3><p className="mt-2 max-w-[250px] text-sm leading-6 text-stone-500">Choose an item from the menu to get started.</p><button onClick={() => { setCartOpen(false); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }} className="button-primary mt-6">Browse the menu</button></div>}
      </aside>
    </div>}

    {checkoutOpen && <div className="panel-backdrop fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-[#23180f]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !checkoutBusy) setCheckoutOpen(false); }}>
      <section className="panel-card relative max-h-[94vh] w-full max-w-[690px] overflow-y-auto rounded-t-[2rem] bg-paper p-5 shadow-2xl sm:rounded-[2rem] sm:p-8" aria-label="Checkout">
        <button onClick={() => setCheckoutOpen(false)} disabled={checkoutBusy} aria-label="Close checkout" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full hover:bg-black/5 sm:right-6 sm:top-6"><X size={19}/></button>
        {orderSuccess ? <div className="px-2 py-10 text-center sm:px-8"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#E7EBD8] text-olive"><Check size={30}/></div><p className="eyebrow mt-5">Order confirmation</p><h2 className="serif-title mt-3 text-4xl sm:text-5xl">Order received.</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-stone-500">{orderMessage}</p><div className="mx-auto mt-7 max-w-sm rounded-2xl border border-black/[.08] bg-vanilla p-5 text-left"><div className="flex items-center justify-between gap-3"><span className="text-xs text-stone-500">Order reference</span><span className="font-mono text-sm font-bold">{orderSuccess.orderNumber}</span></div><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-stone-500">Total</span><span className="text-lg font-bold text-ember">{formatKES(orderSuccess.total)}</span></div><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-stone-500">Fulfilment</span><span className="text-xs font-bold capitalize">{orderSuccess.fulfilmentType}</span></div></div><p className="mt-4 text-[11px] leading-5 text-stone-500">Payment is due when you receive your order. Online payment is not available, and staff order data in this preview is not live.</p><button onClick={() => { setCheckoutOpen(false); setOrderSuccess(null); setCustomer({ name: "", phone: "", email: "", address: "", instructions: "" }); }} className="button-primary mt-6">Back to the menu <ArrowRight size={15}/></button></div> : <>
          <p className="eyebrow">Checkout</p><h2 className="serif-title mt-2 text-4xl">Your details.</h2><p className="mt-2 max-w-md text-sm leading-6 text-stone-500">Enter your contact details and choose how to receive your order.</p>
          <form onSubmit={submitOrder} className="mt-7">
            <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setFulfilment("pickup")} className={`rounded-2xl border p-4 text-left transition ${fulfilment === "pickup" ? "border-ember bg-ember/[.055] ring-2 ring-ember/10" : "border-black/10 bg-white/60"}`}><span className="flex items-center justify-between"><span className="font-bold">Pickup</span><span className="text-xs font-bold text-olive">Free</span></span><span className="mt-1 block text-xs text-stone-500">Pick it up when it’s ready.</span></button><button type="button" onClick={() => setFulfilment("delivery")} className={`rounded-2xl border p-4 text-left transition ${fulfilment === "delivery" ? "border-ember bg-ember/[.055] ring-2 ring-ember/10" : "border-black/10 bg-white/60"}`}><span className="flex items-center justify-between"><span className="font-bold">Delivery</span><span className="text-xs font-bold text-ember">KSh 180</span></span><span className="mt-1 block text-xs text-stone-500">We’ll bring the good stuff to you.</span></button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Your name<input required minLength={2} maxLength={100} autoComplete="name" className="input-field" placeholder="Name for the order" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })}/></label><label className="text-xs font-bold">Phone number<input required minLength={7} maxLength={20} autoComplete="tel" inputMode="tel" className="input-field" placeholder="Your phone number" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}/></label><label className="text-xs font-bold sm:col-span-2">Email <span className="font-normal text-stone-400">(optional)</span><input type="email" maxLength={180} autoComplete="email" className="input-field" placeholder="Your email address" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })}/></label>{fulfilment === "delivery" && <label className="text-xs font-bold sm:col-span-2">Delivery address<input required minLength={6} maxLength={240} autoComplete="street-address" className="input-field" placeholder="Street, building and nearby landmark" value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })}/></label>}<label className="text-xs font-bold sm:col-span-2">Kitchen notes <span className="font-normal text-stone-400">(optional)</span><textarea maxLength={500} rows={2} className="input-field resize-y" placeholder="Add any notes for the kitchen" value={customer.instructions} onChange={(event) => setCustomer({ ...customer, instructions: event.target.value })}/></label></div>
            <div className="mt-5"><p className="text-xs font-bold">How would you like to pay?</p><div className="mt-2 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setPaymentMethod("pay_on_fulfilment")} className={`rounded-2xl border p-4 text-left ${paymentMethod === "pay_on_fulfilment" ? "border-ember bg-ember/[.055] ring-2 ring-ember/10" : "border-black/10 bg-white/60"}`}><span className="block text-sm font-bold">Pay on pickup or delivery</span><span className="mt-1 block text-xs text-stone-500">Pay when you receive your order.</span></button><button type="button" disabled onClick={() => setPaymentMethod("mpesa")} className="rounded-2xl border border-black/[.08] bg-stone-100/70 p-4 text-left"><span className="flex items-center gap-2 text-sm font-bold text-stone-500">M-Pesa <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[9px] uppercase tracking-wide">Unavailable</span></span><span className="mt-1 block text-xs text-stone-500">M-Pesa is not enabled in this preview.</span></button></div></div>
            {checkoutError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">{checkoutError}</div>}
            <div className="mt-6 rounded-2xl bg-vanilla p-4"><div className="flex justify-between text-xs text-stone-500"><span>{cartCount} items · Subtotal</span><span>{formatKES(subtotal)}</span></div><div className="mt-2 flex justify-between text-xs text-stone-500"><span>Delivery fee</span><span>{fulfilment === "delivery" ? formatKES(180) : "Free"}</span></div><div className="mt-3 flex justify-between border-t border-black/10 pt-3"><span className="font-bold">Total</span><span className="serif-title text-2xl font-bold text-ember">{formatKES(total)}</span></div></div>
            <button type="submit" disabled={checkoutBusy || cartCount === 0} className="button-primary mt-5 w-full py-4">{checkoutBusy ? "Placing order" : `Place order (${formatKES(total)})`} <ArrowRight size={16}/></button><p className="mt-3 text-center text-[10px] leading-5 text-stone-500">By placing your order, you confirm the details above are correct.</p>
          </form>
        </>}
      </section>
    </div>}

    {cartCount > 0 && !cartOpen && !checkoutOpen && <button onClick={() => setCartOpen(true)} className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between rounded-full bg-ink px-5 py-4 text-white shadow-2xl sm:hidden"><span className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-ember text-xs font-bold">{cartCount}</span><span className="text-sm font-bold">View your bag</span></span><span className="flex items-center gap-2 text-sm font-bold">{formatKES(subtotal)} <ArrowRight size={16}/></span></button>}
  </main>;
}
