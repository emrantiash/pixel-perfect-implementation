import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/brand";

const search = z.object({ from: z.string().optional(), to: z.string().optional() });

export const Route = createFileRoute("/flights")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Flight results — TripFlyer" },
      { name: "description", content: "Compare flight times, stops, baggage and BDT fares on TripFlyer." },
      { property: "og:title", content: "Flight results — TripFlyer" },
      { property: "og:description", content: "Compare flight times, stops, baggage and BDT fares." },
    ],
  }),
  component: Flights,
});

// Mock results — replace with API call.
const base = [
  { airline: "Biman Bangladesh", code: "BG 347", dep: "08:15", arr: "11:40", dur: 445, stops: 0, bag: "35 kg", price: 42500, refundable: true },
  { airline: "US-Bangla Airlines", code: "BS 341", dep: "19:30", arr: "22:50", dur: 440, stops: 0, bag: "30 kg", price: 39800, refundable: false },
  { airline: "Emirates", code: "EK 583", dep: "10:05", arr: "13:25", dur: 440, stops: 0, bag: "30 kg", price: 51200, refundable: true },
  { airline: "flydubai", code: "FZ 502", dep: "23:55", arr: "03:10", dur: 435, stops: 0, bag: "20 kg", price: 36900, refundable: false },
  { airline: "Air Arabia", code: "G9 518", dep: "04:20", arr: "11:05", dur: 645, stops: 1, bag: "20 kg", price: 33400, refundable: false },
];
const fmt = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;

function Flights() {
  const { from = "DAC", to = "DXB" } = Route.useSearch();
  const [sort, setSort] = useState<"cheapest" | "fastest" | "recommended">("recommended");
  const [nonstop, setNonstop] = useState(false);
  const list = useMemo(() => {
    let l = base.filter((f) => !nonstop || f.stops === 0);
    if (sort === "cheapest") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "fastest") l = [...l].sort((a, b) => a.dur - b.dur);
    return l;
  }, [sort, nonstop]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <span className="eyebrow">{from} → {to}</span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{list.length} flights found</h1>
        <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
          <aside className="space-y-6 text-sm">
            <div>
              <div className="eyebrow mb-2">Stops</div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={nonstop} onChange={(e) => setNonstop(e.target.checked)} className="accent-primary" /> Non-stop only</label>
            </div>
            <div className="text-xs text-muted-foreground">More filters (airline, time, price) arrive with the live fare API.</div>
          </aside>
          <div>
            <div className="mb-4 flex w-fit gap-1 rounded-2xl border border-border bg-surface p-1">
              {(["recommended", "cheapest", "fastest"] as const).map((s) => (
                <button key={s} onClick={() => setSort(s)} className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${sort === s ? "bg-foreground text-background" : "text-muted-foreground"}`}>{s}</button>
              ))}
            </div>
            <div className="divide-y divide-border rounded-[24px] border border-border bg-surface">
              {list.map((f) => (
                <div key={f.code} className="grid items-center gap-4 p-5 md:grid-cols-[1.3fr_2fr_1fr]">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-sky-soft font-mono text-xs font-medium">{f.code.slice(0, 2)}</div>
                    <div><div className="font-medium">{f.airline}</div><div className="font-mono text-xs text-muted-foreground">{f.code} · {f.bag}</div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div><div className="font-display text-xl font-semibold">{f.dep}</div><div className="font-mono text-xs text-muted-foreground">{from}</div></div>
                    <div className="flex-1 text-center">
                      <div className="text-xs text-muted-foreground">{fmt(f.dur)}</div>
                      <div className="my-1 h-px bg-border" />
                      <div className={`text-xs ${f.stops ? "text-warning" : "text-success"}`}>{f.stops ? `${f.stops} stop` : "Non-stop"}</div>
                    </div>
                    <div><div className="font-display text-xl font-semibold">{f.arr}</div><div className="font-mono text-xs text-muted-foreground">{to}</div></div>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <div className="text-right">
                      <div className="font-display text-lg font-bold">৳ {f.price.toLocaleString("en-IN")}</div>
                      <div className="text-xs text-muted-foreground">{f.refundable ? "Refundable" : "Non-refundable"}</div>
                    </div>
                    <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-dark">Select</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
