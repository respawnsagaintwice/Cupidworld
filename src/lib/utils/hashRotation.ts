export function getDeterministicRotation(id: string, maxDeg: number = 3.2): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  // Map hash to range [-maxDeg, maxDeg]
  const normalized = ((Math.abs(hash) % 1000) / 1000) * (maxDeg * 2) - maxDeg;
  return Number(normalized.toFixed(2));
}

export function getDeterministicTapePosition(id: string): 'center' | 'left' | 'right' | 'corners' {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
  }
  const mod = Math.abs(hash) % 4;
  switch (mod) {
    case 0: return 'center';
    case 1: return 'left';
    case 2: return 'right';
    default: return 'center';
  }
}
