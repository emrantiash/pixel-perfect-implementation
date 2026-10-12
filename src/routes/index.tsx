import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/brand";
import dubai from "@/assets/dest-dubai.jpg";
import bangkok from "@/assets/dest-bangkok.jpg";
import singapore from "@/assets/dest-singapore.jpg";
import london from "@/assets/dest-london.jpg";
import kl from "@/assets/dest-kl.jpg";
import jeddah from "@/assets/dest-jeddah.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TripFlyer | Flight Booking & Travel Agency Platform" },
      { name: "description", content: "Search and book flights from Dhaka to Dubai, Bangkok, Singapore, London and more. Transparent fares in BDT for travellers and agencies." },
      { property: "og:title", content: "TripFlyer — Flight booking for Bangladesh" },
      { property: "og:description", content: "Transparent BDT fares from Dhaka to the world, for travellers and travel agencies." },
    ],
  }),
  component: Index,
});

const destinations = [
  { city: "Dubai", code: "DXB", price: "42,500", img: dubai, bg: "bg-clay-soft hover:bg-clay" },
  { city: "Bangkok", code: "BKK", price: "31,200", img: bangkok, bg: "bg-sky-soft hover:bg-sky" },
  { city: "Singapore", code: "SIN", price: "38,900", img: singapore, bg: "bg-sage-soft hover:bg-sage" },
  { city: "London", code: "LHR", price: "88,400", img: london, bg: "bg-sand-soft hover:bg-sand" },
  { city: "Kuala Lumpur", code: "KUL", price: "29,700", img: kl, bg: "bg-clay-soft hover:bg-clay" },
  { city: "Jeddah", code: "JED", price: "46,100", img: jeddah, bg: "bg-sky-soft hover:bg-sky" },
];
const airports = [
  ["DAC", "Dhaka · Hazrat Shahjalal"], ["CGP", "Chattogram · Shah Amanat"], ["DXB", "Dubai · International"],
  ["BKK", "Bangkok · Suvarnabhumi"], ["SIN", "Singapore · Changi"], ["KUL", "Kuala Lumpur · KLIA"],
  ["DEL", "Delhi · Indira Gandhi"], ["CCU", "Kolkata · Netaji Subhas"], ["LHR", "London · Heathrow"], ["JED", "Jeddah · King Abdulaziz"],
];

function Index() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<"round" | "oneway">("round");
  const [from, setFrom] = useState("DAC");
  const [to, setTo] = useState("DXB");
  const [depart, setDepart] = useState("2026-11-12");
  const [ret, setRet] = useState("2026-11-19");
  const [pax, setPax] = useState(1);
  const [cabin, setCabin] = useState("Economy");
  const name = (c: string) => airports.find((a) => a[0] === c)?.[1] ?? "";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="drift absolute -top-16 -right-16 size-64 rounded-full bg-clay/60 blur-2xl" />
          <div className="drift-slow absolute top-40 -left-24 size-72 rounded-full bg-sky/40 blur-3xl" />
          <div className="drift absolute bottom-10 right-24 size-40 rounded-full bg-sage/50 blur-2xl" />
        </div>
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-24">
          <div className="max-w-2xl">
            <div className="rise inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" /> Live · 412 airlines · 190 destinations
            </div>
            <h1 className="rise mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance [animation-delay:80ms] md:text-6xl">
              Every flight,<br />booked with a <span className="clip-in inline-block text-primary">soft landing</span>.
            </h1>
            <p className="rise mt-5 max-w-[52ch] text-lg text-muted-foreground [animation-delay:160ms]">
              Book flights from Dhaka to Dubai, Bangkok, Singapore and London — calm, precise, always in BDT.
            </p>
          </div>

          <form className="rise mt-10 [animation-delay:240ms]" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/flights", search: { from, to } }); }}>
            <div className="flex w-fit items-center gap-1 rounded-2xl border border-border bg-surface p-1">
              {(["round", "oneway"] as const).map((t) => (
                <button type="button" key={t} onClick={() => setTrip(t)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium ${trip === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "round" ? "Round trip" : "One way"}
                </button>
              ))}
            </div>
            <div className="mt-3 max-w-4xl rounded-[28px] border border-border bg-surface p-3 shadow-soft">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <label className="rounded-2xl bg-clay-soft p-3">
                  <span className="eyebrow text-[10px]">From</span>
                  <select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block w-full bg-transparent font-display text-lg font-semibold outline-none">
                    {airports.map(([c]) => <option key={c}>{c}</option>)}
                  </select>
                  <div className="text-xs text-muted-foreground">{name(from)}</div>
                </label>
                <label className="rounded-2xl bg-sky-soft p-3">
                  <span className="eyebrow text-[10px]">To</span>
                  <select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block w-full bg-transparent font-display text-lg font-semibold outline-none">
                    {airports.map(([c]) => <option key={c}>{c}</option>)}
                  </select>
                  <div className="text-xs text-muted-foreground">{name(to)}</div>
                </label>
                <div className="rounded-2xl bg-sand-soft p-3">
                  <span className="eyebrow text-[10px]">Dates</span>
                  <input type="date" value={depart} onChange={(e) => setDepart(e.target.value)} aria-label="Departure" className="mt-1 block w-full bg-transparent font-display font-semibold outline-none" />
                  {trip === "round"
                    ? <input type="date" value={ret} onChange={(e) => setRet(e.target.value)} aria-label="Return" className="block w-full bg-transparent text-xs text-muted-foreground outline-none" />
                    : <div className="text-xs text-muted-foreground">One way</div>}
                </div>
                <div className="rounded-2xl bg-sage-soft p-3">
                  <span className="eyebrow text-[10px]">Cabin</span>
                  <select value={cabin} onChange={(e) => setCabin(e.target.value)} className="mt-1 block w-full bg-transparent font-display text-lg font-semibold outline-none">
                    {["Economy", "Premium Economy", "Business", "First"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <button type="button" aria-label="Fewer travellers" onClick={() => setPax(Math.max(1, pax - 1))} className="rounded-md px-1.5 hover:bg-sage">−</button>
                    {pax} traveller{pax > 1 ? "s" : ""}
                    <button type="button" aria-label="More travellers" onClick={() => setPax(Math.min(9, pax + 1))} className="rounded-md px-1.5 hover:bg-sage">+</button>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between px-2">
                <div className="font-mono text-xs text-muted-foreground">{cabin} · {trip === "round" ? "round trip" : "one way"} · {pax} pax</div>
                <button className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark">Search flights</button>
              </div>
            </div>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative hidden h-[440px] lg:block" aria-hidden>
            <div className="drift absolute top-4 left-4 size-40 rounded-[32px] bg-clay shadow-clay" />
            <div className="drift-slow absolute top-24 left-28 size-28 rounded-[24px] bg-sky shadow-clay" />
            <div className="drift absolute top-10 right-8 size-32 rounded-[28px] bg-sand shadow-clay" />
            <div className="drift-slow absolute bottom-6 left-10 size-36 rounded-[30px] bg-sage shadow-clay" />
            <div className="drift absolute bottom-16 right-4 size-24 rounded-[20px] bg-primary shadow-clay" />
          </div>
          <div>
            <span className="eyebrow">Why TripFlyer</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">Built for people who book daily.</h2>
            <p className="mt-4 max-w-[46ch] text-muted-foreground">Easy booking for travellers, a serious operations tool for agencies — the same calm engine underneath.</p>
            <ul className="mt-6 space-y-4">
              {[
                ["01", "bg-clay-soft text-primary-dark", "Competitive BDT fares", "Fares, taxes and markups in Bangladeshi Taka — no conversion surprises at checkout."],
                ["02", "bg-sky-soft text-info", "Secure payment & reliable ticketing", "Card, bKash or agent wallet, with instant e-tickets once paid."],
                ["03", "bg-sage-soft text-success", "Agent support", "Wallet, commission and verified onboarding for B2B partners."],
              ].map(([n, c, t, d]) => (
                <li key={n} className="flex gap-4">
                  <div className={`grid size-10 shrink-0 place-items-center rounded-xl font-mono text-sm font-medium ${c}`}>{n}</div>
                  <div><div className="font-medium">{t}</div><div className="text-sm text-muted-foreground">{d}</div></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="eyebrow">Popular routes</span>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">From Dhaka, the world.</h2>
            </div>
            <Link to="/flights" className="text-sm font-medium text-primary-dark hover:underline">View all routes</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {destinations.map((d) => (
              <Link key={d.code} to="/flights" search={{ from: "DAC", to: d.code }} className={`rounded-[24px] p-4 transition-colors ${d.bg}`}>
                <img src={d.img} alt={d.city} loading="lazy" width={1024} height={640} className="aspect-[16/10] w-full rounded-xl object-cover" />
                <div className="mt-3 flex items-baseline justify-between"><span className="font-display font-semibold">{d.city}</span><span className="font-mono text-xs text-muted-foreground">{d.code}</span></div>
                <div className="text-sm font-medium text-primary-dark">from {d.price} BDT</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <span className="eyebrow">How it works</span>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Three moves to a ticket.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["1", "bg-clay", "Search & compare", "Live fares across airlines, sorted by price, duration or recommendation."],
            ["2", "bg-sky", "Book in BDT", "Add passengers, review the fare rules and pay securely — no currency juggling."],
            ["3", "bg-sage", "Fly & manage", "E-ticket in your inbox. Track, change or cancel from one place."],
          ].map(([n, c, t, d]) => (
            <div key={n} className="rounded-[24px] border border-border bg-surface p-6">
              <div className={`grid size-12 place-items-center rounded-2xl font-display font-bold ${c}`}>{n}</div>
              <div className="mt-4 font-display text-lg font-semibold">{t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-foreground py-20 text-background">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <h2 className="font-display text-3xl font-bold tracking-tight">Support that answers.</h2>
            <p className="mt-3 max-w-[42ch] text-background/60">A help desk in Bangla and English, 24/7, for travellers and agency partners alike.</p>
          </div>
          <div className="text-center"><div className="font-display text-4xl font-bold text-primary">24/7</div><div className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-background/50">Support</div></div>
          <div className="text-center"><div className="font-display text-4xl font-bold text-primary">BDT</div><div className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-background/50">Native pricing</div></div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
