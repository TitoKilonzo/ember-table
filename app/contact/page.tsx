import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock3, MapPin } from "lucide-react";
import ContactOptions from "@/components/contact-options";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return <main className="min-h-screen bg-vanilla px-4 py-8 text-ink sm:px-6 sm:py-12">
    <div className="mx-auto max-w-[840px]">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Ember Table home"><Image src="/brand-mark.svg" width={40} height={40} alt="" /><span className="display-wordmark text-2xl font-bold">ember table</span></Link>
        <Link href="/" className="text-sm font-semibold text-stone-600 transition hover:text-ember">Back home</Link>
      </div>
      <section className="mt-12 rounded-[2rem] bg-[#2C2923] p-7 text-vanilla sm:mt-16 sm:p-11">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#E8A17F]">Get in touch</p>
        <h1 className="serif-title mt-3 text-5xl">We’re here to help.</h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-white/65">For enquiries, order questions or support, choose the contact method that works best for you.</p>
        <ContactOptions />
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 p-4"><MapPin size={18} className="mt-0.5 text-[#E8A17F]"/><div><p className="text-sm font-bold">Find us</p><p className="mt-1 text-xs text-white/55">Westlands</p></div></div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 p-4"><Clock3 size={18} className="mt-0.5 text-[#E8A17F]"/><div><p className="text-sm font-bold">Opening hours</p><p className="mt-1 text-xs text-white/55">Open 24 hours, every day</p></div></div>
        </div>
      </section>
      <nav className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-stone-500" aria-label="Related pages"><Link href="/" className="hover:text-ember">Home</Link><Link href="/login" className="hover:text-ember">Sign in</Link><Link href="/register" className="hover:text-ember">Register</Link></nav>
    </div>
  </main>;
}
