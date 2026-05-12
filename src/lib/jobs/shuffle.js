// ALGORITHM: Fisher-Yates shuffle
// Walks backwards, swaps each item with a random earlier item.
// O(N), every ordering equally likely.
// Used to pick a random sample from the filtered job pool.
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickN(pool, n = 8) {
  return shuffle(pool).slice(0, n);
}
