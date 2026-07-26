export interface ParsedKmlPlacemark {
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  externalRef?: string;
}

import { decodeXmlText } from "@/lib/access/import/xml-escape";

export interface ParsedKmlDocument {
  placemarks: ParsedKmlPlacemark[];
  networkLinkHref?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCoordinates(text: string): { lat: number; lng: number } | null {
  const parts = text.trim().split(/[\s,]+/).map(Number);
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null;
  const lng = parts[0];
  const lat = parts[1];
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function parseKmlXml(xml: string): ParsedKmlDocument {
  const placemarks: ParsedKmlPlacemark[] = [];

  const networkMatch = xml.match(
    /<NetworkLink[^>]*>[\s\S]*?<href[^>]*>([^<]+)<\/href>/i
  );
  const rawHref = networkMatch?.[1]?.trim();
  const networkLinkHref = rawHref ? decodeXmlText(rawHref) : undefined;

  const placemarkBlocks = xml.match(/<Placemark[\s\S]*?<\/Placemark>/gi) ?? [];

  for (const block of placemarkBlocks) {
    const name = block.match(/<name[^>]*>([\s\S]*?)<\/name>/i)?.[1]?.trim();
    if (!name) continue;

    const rawDesc =
      block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ?? "";
    const description = stripHtml(rawDesc);

    let lat: number | undefined;
    let lng: number | undefined;

    const pointCoords = block.match(
      /<Point[\s\S]*?<coordinates[^>]*>([\s\S]*?)<\/coordinates>/i
    )?.[1];
    if (pointCoords) {
      const c = parseCoordinates(pointCoords);
      if (c) {
        lat = c.lat;
        lng = c.lng;
      }
    }

    const externalRef =
      block.match(/<id[^>]*>([^<]+)<\/id>/i)?.[1]?.trim() ??
      block.match(/name="([^"]+)"/i)?.[1];

    placemarks.push({
      name,
      description: description || undefined,
      latitude: lat,
      longitude: lng,
      externalRef,
    });
  }

  return { placemarks, networkLinkHref };
}

export function sanitizeKmlDescription(text: string): string {
  return stripHtml(text).slice(0, 8000);
}
