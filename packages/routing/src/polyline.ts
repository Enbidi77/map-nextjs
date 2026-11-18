import type { Coordinate } from '@modern-maps/types';

/**
 * Decodes an encoded polyline string into an array of [longitude, latitude] coordinates.
 * Compatible with Google Polyline Algorithm and OSRM precision 5 and 6.
 */
export function decodePolyline(encoded: string, precision: number = 5): Coordinate[] {
  const factor = Math.pow(10, precision);
  const coordinates: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lng / factor, lat / factor]);
  }

  return coordinates;
}

/**
 * Encodes an array of [longitude, latitude] coordinates into a polyline string.
 */
export function encodePolyline(coordinates: Coordinate[], precision: number = 5): string {
  const factor = Math.pow(10, precision);
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lng, lat] of coordinates) {
    const latInt = Math.round(lat * factor);
    const lngInt = Math.round(lng * factor);

    output += encodeSignedNumber(latInt - prevLat);
    output += encodeSignedNumber(lngInt - prevLng);

    prevLat = latInt;
    prevLng = lngInt;
  }

  return output;
}

function encodeSignedNumber(num: number): string {
  let sgnNum = num << 1;
  if (num < 0) {
    sgnNum = ~sgnNum;
  }
  return encodeNumber(sgnNum);
}

function encodeNumber(num: number): string {
  let encodeString = '';
  let nextValue = num;

  while (nextValue >= 0x20) {
    encodeString += String.fromCharCode((0x20 | (nextValue & 0x1f)) + 63);
    nextValue >>= 5;
  }

  encodeString += String.fromCharCode(nextValue + 63);
  return encodeString;
}
