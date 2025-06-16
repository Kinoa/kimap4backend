// src/functions/findNear.js
import { db } from '../firestore.js';

const R = 6371;
const bbox = (lat,lng,km)=>{
  const dLat = (km/R)*(180/Math.PI);
  const dLng = dLat/Math.cos(lat*Math.PI/180);
  return [lat-dLat,lat+dLat,lng-dLng,lng+dLng];
};

export async function findAccessiblePlacesNear({ category, lat, lng, radius_km=0.5, limit=5 }) {
  const [latMin,latMax,lngMin,lngMax] = bbox(lat,lng,radius_km);

  let q = db.collection('places')
            .where('latitude','>=',latMin).where('latitude','<=',latMax)
            .where('longitude','>=',lngMin).where('longitude','<=',lngMax)
            .where('wheelchair','==','yes');          // geo-query bounding-box :contentReference[oaicite:1]{index=1}

  if (category) q = q.where('category','==',category);
  if (limit)    q = q.limit(limit);

  const snap = await q.get();
  return snap.docs.map(d => d.data());
}
