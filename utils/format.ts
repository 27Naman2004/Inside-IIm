export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatLargeNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const absValue = Math.abs(value);
  const suffix = value < 0 ? '-' : '';
  
  if (absValue >= 1e12) {
    return `${suffix}$${(absValue / 1e12).toFixed(2)}T`;
  }
  if (absValue >= 1e9) {
    return `${suffix}$${(absValue / 1e9).toFixed(2)}B`;
  }
  if (absValue >= 1e6) {
    return `${suffix}$${(absValue / 1e6).toFixed(2)}M`;
  }
  
  return formatCurrency(value);
}

export function formatPercent(value: number | null | undefined, scale = true): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  // If the API returns margins as decimals (e.g. 0.23 for 23%) but returns growth as percentages (e.g. 12.5 for 12.5%),
  // we scale if scale is true (usually margins are decimals, growth is percentage)
  const pct = scale ? value * 100 : value;
  const prefix = pct > 0 ? '+' : '';
  return `${prefix}${pct.toFixed(2)}%`;
}
