import { isDebug } from "./StorageUtils";

// Keep the price and unit from the same source when using a fallback price.
export function formatPropertyPrice(project) {
  const property = project?.project || project;
  const source = [property, property?.plotDetails, ...(property?.configurations || [])]
    .find(item => item?.price != null && String(item.price).trim() !== '');
  const value = Number(source?.price);
  if (!Number.isFinite(value) || value <= 0) return null;

  const unit = String(source?.priceUnit ?? source?.price_unit ?? '').trim();
  const monetaryUnits = { lakh: 'Lakh', lakhs: 'Lakh', lac: 'Lakh', lacs: 'Lakh', cr: 'Cr', crore: 'Cr', crores: 'Cr' };
  const monetaryUnit = monetaryUnits[unit.toLowerCase()];

  isDebug && console.log("unit ====>", unit);
  if (monetaryUnit) return `₹ ${value.toLocaleString('en-IN')} ${monetaryUnit}`;

  let amount = value.toLocaleString('en-IN');
  if (value >= 10000000) amount = `${(value / 10000000).toFixed(value % 10000000 ? 2 : 0)} Cr`;
  else if (value >= 100000) amount = `${(value / 100000).toFixed(value % 100000 ? 2 : 0)} Lakh`;
  return `₹ ${amount}${unit ? ` ${unit}` : ''}`;
}
