import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MapPin, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Suggestion =
  | { kind: "restaurant"; id: string; name: string; slug: string; city: string | null }
  | { kind: "place"; name: string; label: string };

export function SearchAutocomplete({
  value,
  onChange,
  placeholder = "Zoek restaurants, keukens of steden...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const [restRes, placeRes] = await Promise.all([
        supabase
          .rpc("search_restaurants", { _q: q, _limit: 5, _offset: 0, _sort: "popular" })
          .then((r) => (r.data ?? []) as any[]),
        fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&featuretype=settlement&q=${encodeURIComponent(q)}`,
          { headers: { Accept: "application/json" } },
        )
          .then((r) => r.json())
          .then((d: any[]) =>
            (d ?? []).filter((p) =>
              ["city", "town", "village", "administrative", "country", "state"].includes(p.type) ||
              ["city", "town", "village", "country", "state", "region"].includes(p.addresstype),
            ),
          )
          .catch(() => [] as any[]),
      ]);
      if (cancelled) return;
      const seen = new Set<string>();
      const places: Suggestion[] = [];
      for (const p of placeRes) {
        const a = p.address ?? {};
        const name = a.city || a.town || a.village || a.state || a.country || p.name || p.display_name?.split(",")[0];
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        places.push({ kind: "place", name, label: p.display_name });
        if (places.length >= 5) break;
      }
      const sug: Suggestion[] = [
        ...places,
        ...restRes.slice(0, 5).map((r) => ({
          kind: "restaurant" as const,
          id: r.id,
          name: r.name,
          slug: r.slug,
          city: r.city,
        })),
      ];
      setItems(sug);
      setActive(0);
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const choose = (s: Suggestion) => {
    setOpen(false);
    if (s.kind === "restaurant") {
      navigate({ to: "/restaurant/$slug", params: { slug: s.slug } });
    } else {
      navigate({ to: "/zoeken", search: { q: s.name } });
    }
  };

  const submit = () => {
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    navigate({ to: "/zoeken", search: { q } });
  };

  return (
    <div ref={boxRef} className="flex-1 relative">
      <div className="flex items-center gap-3 px-4 py-2">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (open && items[active]) choose(items[active]);
              else submit();
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="flex-1 border-0 outline-none bg-transparent h-11 text-base placeholder:text-muted-foreground"
        />
      </div>
      {open && items.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[9999]">
          <ul role="listbox">
            {items.map((s, i) => (
              <li
                key={s.kind + (s.kind === "restaurant" ? s.id : s.name)}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(s);
                }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${
                  i === active ? "bg-muted" : ""
                }`}
              >
                {s.kind === "place" ? (
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Utensils className="w-4 h-4 text-primary shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate">{s.name}</div>
                  {s.kind === "restaurant" && s.city && (
                    <div className="text-xs text-muted-foreground truncate">{s.city}</div>
                  )}
                  {s.kind === "place" && (
                    <div className="text-xs text-muted-foreground truncate">{s.label}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
