// src/functions/percentageByCategory.js
import { statsByCategory } from './statsByCategory.js';

export async function percentageByCategory({ city }) {
  const counts = await statsByCategory({ city });
  const total  = Object.values(counts).reduce((a,b)=>a+b,0);
  const pct    = {};
  Object.entries(counts).forEach(([k,v]) => pct[k] = total ? (v/total) : 0);
  return { total, percentage: pct };
}
