// src/functions/geocodePlace.js
import fetch from 'node-fetch';
const MAPS_KEY = process.env.MAPS_KEY;          // chiave Google Maps

export async function geocodePlaceName({ text }) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text)}&key=${MAPS_KEY}`;
  const { status, results } = await (await fetch(url)).json();
  if (status !== 'OK') {
    console.error(`Geocoding error: ${status}`);
    return null;
  }

  const { lat, lng } = results[0].geometry.location;
  return { lat, lng, formatted_address: results[0].formatted_address };
}
