import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const EMPTY_MARKERS: MapPlace[] = [];

export type MapPlace = {
  id: string;
  coordinates: [longitude: number, latitude: number];
  title: string;
  detail?: string;
  kind: "bus" | "stop" | "subway" | "incident";
};

export type MapBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type MapViewProps = {
  compact?: boolean;
  emptyLabel?: string;
  markers?: MapPlace[];
  onViewportChange?: (bounds: MapBounds) => void;
};

export default function MapView({
  compact = false,
  emptyLabel = "지도에서 확인할 교통정보가 없어요.",
  markers = EMPTY_MARKERS,
  onViewportChange,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let active = true;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [127.8, 36.4],
      zoom: compact ? 5.1 : 5.6,
      minZoom: 4.5,
      maxZoom: 18,
      scrollZoom: !compact,
      attributionControl: false,
      maxBounds: [
        [122.5, 31],
        [133.8, 40.8],
      ],
    });
    mapRef.current = map;
    if (!compact) {
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    }
    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution:
          '<a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>',
      }),
      "bottom-right",
    );
    const reportBounds = () => {
      const bounds = map.getBounds();
      onViewportChange?.({
        minX: bounds.getWest(),
        maxX: bounds.getEast(),
        minY: bounds.getSouth(),
        maxY: bounds.getNorth(),
      });
    };

    map.once("load", () => {
      if (!active) return;
      for (const layer of map.getStyle().layers) {
        if (layer.type === "symbol" && layer.layout?.["text-field"]) {
          map.setLayoutProperty(layer.id, "text-field", ["get", "name:ko"]);
        }
      }
      setMapReady(true);
      setMapError("");
      reportBounds();
    });
    map.on("moveend", reportBounds);
    map.on("error", () => {
      if (!active) return;
      setMapError("지도를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    });

    return () => {
      active = false;
      map.off("moveend", reportBounds);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [compact, onViewportChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const activeMarkers: Marker[] = [];
    for (const place of markers) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = `map-marker map-marker-${place.kind}`;
      element.setAttribute("aria-label", place.title);
      element.textContent =
        place.kind === "bus"
          ? "B"
          : place.kind === "subway"
            ? "M"
            : place.kind === "incident"
              ? "!"
              : "●";
      const marker = new Marker({ element, anchor: "bottom" })
        .setLngLat(place.coordinates)
        .addTo(map);
      element.addEventListener("click", () => {
        setSelectedPlace(place);
        map.easeTo({
          center: place.coordinates,
          zoom: Math.max(map.getZoom(), 13),
        });
      });
      activeMarkers.push(marker);
    }

    return () => {
      activeMarkers.forEach((marker) => marker.remove());
    };
  }, [mapReady, markers]);

  return (
    <div className={compact ? "mini-map" : "full-map"}>
      <div
        ref={containerRef}
        className="maplibre-map-container"
        aria-label="한국어 전국 지도"
      />
      {mapError ? (
        <div className="map-overlay map-error" role="alert">
          <strong>한국어 지도를 표시할 수 없습니다</strong>
          <small>{mapError}</small>
        </div>
      ) : !mapReady ? (
        <div className="map-overlay map-loading" role="status">
          <strong>한국어 지도 불러오는 중</strong>
        </div>
      ) : null}
      {selectedPlace && (
        <div className="map-place-card" role="status">
          <button
            type="button"
            className="map-place-close"
            aria-label="선택 장소 닫기"
            onClick={() => setSelectedPlace(null)}
          >
            ×
          </button>
          <strong>{selectedPlace.title}</strong>
          {selectedPlace.detail && <span>{selectedPlace.detail}</span>}
        </div>
      )}
      {!compact && markers.length === 0 && mapReady && (
        <div className="map-empty-label">{emptyLabel}</div>
      )}
      {compact && mapReady && (
        <div className="map-empty-label">전국 범위 · 지도 확대 가능</div>
      )}
    </div>
  );
}
