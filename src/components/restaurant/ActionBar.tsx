import { useEffect, useState } from "react";
import { Navigation, Phone, Globe, Share2, Heart } from "lucide-react";
import { t } from "@/lib/i18n/strings";
import type { LocaleCode } from "@/lib/i18n/locales";

type Props = {
  locale: LocaleCode;
  id: string;
  name: string;
  lat: number;
  lng: number;
  phone?: string | null;
  website?: string | null;
};

const STORAGE_KEY = "pr.favorites.v1";

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
}

export function ActionBar({ locale, id, name, lat, lng, phone, website }: Props) {
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(readFavorites().includes(id));
  }, [id]);

  const navHref = isAppleDevice()
    ? `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  function toggleFav() {
    const cur = readFavorites();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setFav(next.includes(id));
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try { await (navigator as any).share({ title: name, url }); return; } catch { /* user cancelled */ }
    }
    try { await navigator.clipboard.writeText(url); alert(tr("action.linkCopied")); } catch { /* ignore */ }
  }

  const btn = "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md hover:bg-muted text-xs font-medium transition-colors min-w-0";
  const iconCls = "w-5 h-5";

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-2">
        <div className="grid grid-cols-5 gap-1">
          <a href={navHref} target="_blank" rel="noopener" className={btn}>
            <Navigation className={iconCls + " text-primary"} />
            <span className="truncate">{tr("action.navigate")}</span>
          </a>
          {phone ? (
            <a href={`tel:${phone}`} className={btn}>
              <Phone className={iconCls} />
              <span className="truncate">{tr("action.call")}</span>
            </a>
          ) : (
            <span className={btn + " opacity-40 cursor-not-allowed"}>
              <Phone className={iconCls} />
              <span className="truncate">{tr("action.call")}</span>
            </span>
          )}
          {website ? (
            <a href={website} target="_blank" rel="noopener nofollow" className={btn}>
              <Globe className={iconCls} />
              <span className="truncate">{tr("action.website")}</span>
            </a>
          ) : (
            <span className={btn + " opacity-40 cursor-not-allowed"}>
              <Globe className={iconCls} />
              <span className="truncate">{tr("action.website")}</span>
            </span>
          )}
          <button type="button" onClick={share} className={btn}>
            <Share2 className={iconCls} />
            <span className="truncate">{tr("action.share")}</span>
          </button>
          <button type="button" onClick={toggleFav} className={btn} aria-pressed={fav}>
            <Heart className={iconCls + (fav ? " fill-red-500 text-red-500" : "")} />
            <span className="truncate">{fav ? tr("action.saved") : tr("action.save")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
