"use client";

import { useEffect, useRef, useState } from "react";
import { CircleDot, Pause, Play, Radio, ShieldAlert } from "lucide-react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Overlay from "ol/Overlay";
import { fromLonLat } from "ol/proj";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import "ol/ol.css";

type MapEvent = {
  date: string;
  label: string;
  region: string;
  tone: "accent" | "warning" | "primary";
  href: string;
  lon: number;
  lat: number;
};

// Referencias públicas de inteligencia (CISA) con coordenadas reales aproximadas.
const EVENTS: MapEvent[] = [
  { date: "19 FEB 2025", label: "Ghost (Cring) ransomware", region: "América", tone: "accent", href: "https://www.cisa.gov/news-events/alerts/2025/02/19/cisa-and-partners-release-advisory-ghost-cring-ransomware", lon: -63, lat: -18 },
  { date: "12 MAR 2025", label: "Medusa ransomware", region: "Europa", tone: "accent", href: "https://www.cisa.gov/news-events/alerts/2025/03/12/cisa-and-partners-release-cybersecurity-advisory-medusa-ransomware", lon: 12, lat: 47 },
  { date: "03 ABR 2025", label: "Infraestructura fast-flux", region: "Oriente Medio", tone: "warning", href: "https://www.cisa.gov/news-events/alerts/2025/04/03/nsa-cisa-fbi-and-international-partners-release-cybersecurity-advisory-fast-flux-national-security", lon: 44, lat: 26 },
  { date: "11 ABR 2025", label: "Técnica post-explotación Fortinet", region: "Asia-Pacífico", tone: "primary", href: "https://www.cisa.gov/news-events/alerts/2025/04/11/fortinet-releases-advisory-new-post-exploitation-technique-known-vulnerabilities", lon: 102, lat: 12 },
];

const TONE_FILL: Record<MapEvent["tone"], string> = {
  accent: "#b54747",
  warning: "#956317",
  primary: "#315b86",
};

function pointStyle(ev: MapEvent) {
  return new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: TONE_FILL[ev.tone] }),
      stroke: new Stroke({ color: "#ffffff", width: 2 }),
    }),
    text: new Text({
      text: ev.label.split(" ")[0],
      offsetY: -14,
      fill: new Fill({ color: "#e7edf3" }),
      stroke: new Stroke({ color: "rgba(9,18,27,.85)", width: 3 }),
      font: "600 11px 'DM Sans', system-ui, sans-serif",
    }),
  });
}

export function AttackMapOL() {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);
  const [active, setActive] = useState(0);
  const mapObj = useRef<Map | null>(null);

  // Construcción del mapa (una vez).
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    const source = new VectorSource<Feature<Point>>();
    EVENTS.forEach((ev) => {
      const f = new Feature({ geometry: new Point(fromLonLat([ev.lon, ev.lat])), ev });
      f.setStyle(pointStyle(ev));
      source.addFeature(f);
    });

    const overlay = new Overlay({
      element: popupRef.current ?? undefined,
      positioning: "bottom-center",
      offset: [0, -12],
      stopEvent: false,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM(), preload: 4 }), new VectorLayer({ source })],
      view: new View({ center: fromLonLat([-15, 20]), zoom: 2.2, minZoom: 1.5 }),
      controls: [],
      overlays: [overlay],
    });

    map.on("click", (evt) => {
      const hit = map.forEachFeatureAtPixel(evt.pixel, (f) => f as Feature<Point>);
      const el = popupRef.current;
      if (hit) {
        const ev = hit.get("ev") as MapEvent;
        setActive(EVENTS.indexOf(ev));
        if (el) el.style.display = "block";
        overlay.setPosition(evt.coordinate);
        map.getView().animate({ center: evt.coordinate, zoom: Math.max(map.getView().getZoom() ?? 2.2, 3.4), duration: 500 });
      } else if (el) {
        el.style.display = "none";
        overlay.setPosition(undefined);
      }
    });

    mapObj.current = map;
    return () => {
      map.setTarget(undefined);
      mapObj.current = null;
    };
  }, []);


  // Rotación automática del evento activo.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setActive((i) => (i + 1) % EVENTS.length), 3000);
    return () => clearInterval(id);
  }, [running]);

  // Centrar en el evento activo.
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    const ev = EVENTS[active];
    map.getView().animate({ center: fromLonLat([ev.lon, ev.lat]), zoom: 3.2, duration: 600 });
  }, [active]);

  const current = EVENTS[active];

  return (
    <section aria-labelledby="map-title" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-primary">
            <Radio aria-hidden="true" className="h-4 w-4" /> Threat intelligence
          </p>
          <h2 id="map-title" className="mt-1 text-xl font-semibold">Mapa de actividad cibernética</h2>
        </div>
        <button
          aria-label={running ? "Pausar rotación del mapa" : "Reanudar rotación del mapa"}
          aria-pressed={running}
          onClick={() => setRunning(!running)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-background-elevated focus-visible:outline-2 focus-visible:outline-primary"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </header>
      <div className="grid lg:grid-cols-[1.55fr_.85fr]">
        <div className="relative">
          <div
            ref={mapRef}
            className="h-[300px] w-full lg:h-[340px]"
            role="application"
            aria-label="Mapa mundial con referencias de amenazas (OpenLayers)"
          />
          <div
            ref={popupRef}
            className="pointer-events-none absolute z-10 hidden max-w-[240px] rounded-xl border border-border bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{current.date}</p>
            <p className="mt-0.5 font-semibold text-foreground">{current.label}</p>
            <p className="text-muted">{current.region}</p>
          </div>
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-card/80 px-3 py-1.5 text-[10px] text-muted backdrop-blur">
            <span className="flex items-center gap-1.5"><CircleDot className="h-3 w-3 text-primary" aria-hidden="true" /> Referencia destacada</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Alta</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Media</span>
          </div>
        </div>
        <aside className="border-t border-border p-5 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Referencia seleccionada</p>
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <span className="font-mono text-xs">{current.date}</span>
            </div>
            <p className="mt-3 font-medium leading-snug">{current.label}</p>
            <p className="mt-1 text-sm text-muted">Alcance: {current.region}</p>
            <a href={current.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
              Ver alerta original de CISA
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            Mapa real con OpenLayers (OpenStreetMap). Fuentes públicas fechadas; no representan ataques contra la infraestructura local.
          </p>
        </aside>
      </div>
    </section>
  );
}
