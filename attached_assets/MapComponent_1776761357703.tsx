import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * MapComponent
 *
 * A reusable React component built with MapLibre GL that renders a base
 * OpenStreetMap layer and toggles domain‑specific overlays via a tabbed
 * interface. Tabs include Accessibility, Care, Transport and Employment.
 *
 * Design Goals:
 *
 *  - Unified user experience: the same map canvas is shared across all
 *    domains so users don't feel like they are switching between separate
 *    applications.
 *  - Accessibility: buttons and tabs are keyboard navigable, labelled
 *    with ARIA attributes and designed to meet WCAG 2.2 AA colour
 *    contrast requirements. Screen reader users can navigate the tabs
 *    and receive announcements when layers are toggled.
 *  - Extensibility: additional tabs and layers can be added by
 *    extending the `layerConfig` array. Each config defines the
 *    underlying data source, MapLibre layer definition and a human‑readable
 *    label.
 *  - Maintainability: separation of concerns between UI state (which
 *    tab is selected), map lifecycle (initialisation and teardown), and
 *    business logic (adding/removing layers).
 */

interface LayerConfig {
  id: string;
  label: string;
  // A function that will be called with the map instance to register
  // sources and layers for this tab. It returns an array of layer ids
  // that should be removed when the tab is hidden.
  addToMap: (map: maplibregl.Map) => string[];
}

// Placeholder data sources for each layer. In a real application these
// would be replaced with API endpoints that return GeoJSON or vector tiles.
const ACCESSIBILITY_DATA_URL = '/data/accessibility.geojson';
const CARE_DATA_URL = '/data/care.geojson';
const TRANSPORT_DATA_URL = '/data/transport.geojson';
const EMPLOYMENT_DATA_URL = '/data/employment.geojson';

const layerConfigs: LayerConfig[] = [
  {
    id: 'accessibility',
    label: 'Accessibility',
    addToMap: (map) => {
      const sourceId = 'accessibility-source';
      const layerId = 'accessibility-layer';
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: ACCESSIBILITY_DATA_URL,
        });
      }
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 6,
            'circle-color': '#0074D9',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
        });
      }
      return [layerId];
    },
  },
  {
    id: 'care',
    label: 'Care',
    addToMap: (map) => {
      const sourceId = 'care-source';
      const layerId = 'care-layer';
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: CARE_DATA_URL,
        });
      }
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'icon-image': 'clinic-15',
            'icon-size': 1.25,
            'icon-allow-overlap': true,
          },
          paint: {},
        });
      }
      return [layerId];
    },
  },
  {
    id: 'transport',
    label: 'Transport',
    addToMap: (map) => {
      const sourceId = 'transport-source';
      const layerId = 'transport-layer';
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: TRANSPORT_DATA_URL,
        });
      }
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'icon-image': 'bus-15',
            'icon-size': 1.25,
            'icon-allow-overlap': true,
          },
        });
      }
      return [layerId];
    },
  },
  {
    id: 'employment',
    label: 'Employment',
    addToMap: (map) => {
      const sourceId = 'employment-source';
      const layerId = 'employment-layer';
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: EMPLOYMENT_DATA_URL,
        });
      }
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'icon-image': 'suitcase-15',
            'icon-size': 1.25,
            'icon-allow-overlap': true,
          },
        });
      }
      return [layerId];
    },
  },
];

const MapComponent: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [activeTab, setActiveTab] = useState(layerConfigs[0].id);

  // Track the layers added to the map so they can be removed when switching
  const activeLayersRef = useRef<string[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }
    // Initialize the MapLibre map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution:
              '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [151.2093, -33.8688], // Sydney default
      zoom: 11,
      attributionControl: false,
    });
    // Add attribution control separately for better placement
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    mapRef.current = map;

    // Clean up on unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update layers when the active tab changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Remove existing layers for previous tab
    activeLayersRef.current.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      // Optionally remove sources if not used elsewhere
      // Note: we keep the sources around to avoid reloading data when
      // toggling back to this tab. If memory becomes a concern, sources
      // can also be removed here.
    });
    activeLayersRef.current = [];
    // Find the config for the active tab
    const config = layerConfigs.find((cfg) => cfg.id === activeTab);
    if (config) {
      // Register layers for the active tab
      activeLayersRef.current = config.addToMap(map);
    }
  }, [activeTab]);

  return (
    <div className="map-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <nav aria-label="Map View Tabs" role="tablist" className="tab-bar" style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
        {layerConfigs.map((config) => (
          <button
            key={config.id}
            role="tab"
            aria-selected={activeTab === config.id ? 'true' : 'false'}
            aria-controls={`panel-${config.id}`}
            id={`tab-${config.id}`}
            onClick={() => setActiveTab(config.id)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: activeTab === config.id ? '#0074D9' : '#f5f5f5',
              color: activeTab === config.id ? '#fff' : '#000',
              border: 'none',
              borderBottom: activeTab === config.id ? '2px solid #005fa3' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {config.label}
          </button>
        ))}
      </nav>
      {/* The map itself */}
      <div
        ref={mapContainerRef}
        id="map"
        style={{ flexGrow: 1, position: 'relative' }}
        aria-labelledby={`tab-${activeTab}`}
        role="tabpanel"
      />
    </div>
  );
};

export default MapComponent;