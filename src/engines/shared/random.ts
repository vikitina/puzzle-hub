export type RandomSource = () => number;

export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const value = random();

    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError(
        'Источник случайных чисел должен возвращать число от 0 до 1, не включая 1.',
      );
    }

    const swapIndex = Math.floor(value * (index + 1));

    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }

  return result;
}