"use client";

import { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";

type ContactMethod = "whatsapp" | "email";

export default function ContactOptions() {
  const [method, setMethod] = useState<ContactMethod>("whatsapp");
  const isWhatsApp = method === "whatsapp";

  return <section className="mt-8 rounded-3xl border border-black/[.07] bg-paper p-5 sm:p-7">
    <div className="inline-flex rounded-full border border-black/[.08] bg-vanilla p-1" aria-label="Choose a contact method">
      <button type="button" aria-pressed={isWhatsApp} onClick={() => setMethod("whatsapp")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition ${isWhatsApp ? "bg-ember text-white" : "text-stone-500 hover:text-ink"}`}><MessageCircle size={15}/> WhatsApp</button>
      <button type="button" aria-pressed={!isWhatsApp} onClick={() => setMethod("email")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition ${!isWhatsApp ? "bg-ember text-white" : "text-stone-500 hover:text-ink"}`}><Mail size={15}/> Email</button>
    </div>
    <div className="mt-6">
      <p className="text-xs font-semibold text-stone-500">{isWhatsApp ? "Message us on WhatsApp" : "Email for enquiries and support"}</p>
      {isWhatsApp
        ? <a href="https://wa.me/254743336009" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xl font-bold text-ember hover:underline">+254 743 336 009</a>
        : <a href="mailto:info@embertable.com" className="mt-2 inline-block break-all text-xl font-bold text-ember hover:underline">info@embertable.com</a>}
    </div>
  </section>;
}
