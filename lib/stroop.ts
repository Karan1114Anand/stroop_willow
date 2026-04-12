export type Color = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';
export type BlockType = 'congruent' | 'incongruent' | 'stress';

export interface Trial {
  trial_number: number;
  word_shown: Color;
  ink_color: Color;
}

export const COLORS: Color[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

export const COLOR_HEX: Record<Color, string> = {
  RED: '#e63946',
  BLUE: '#4361ee',
  GREEN: '#2dc653',
  YELLOW: '#f4a261',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate 20 congruent trials (word === ink), 5 per color, shuffled */
export function generateBlock1(): Trial[] {
  const trials: Trial[] = [];
  for (const color of COLORS) {
    for (let i = 0; i < 5; i++) {
      trials.push({ trial_number: 0, word_shown: color, ink_color: color });
    }
  }
  return shuffle(trials).map((t, i) => ({ ...t, trial_number: i + 1 }));
}

/** Generate 20 incongruent trials (word !== ink), balanced, shuffled */
export function generateIncongruentBlock(): Trial[] {
  const trials: Trial[] = [];
  const inkColors = shuffle([...COLORS, ...COLORS, ...COLORS, ...COLORS, ...COLORS]).slice(0, 20);
  const wordColors = shuffle([...COLORS, ...COLORS, ...COLORS, ...COLORS, ...COLORS]).slice(0, 20);

  for (let i = 0; i < 20; i++) {
    let word = wordColors[i];
    let ink = inkColors[i];
    // ensure mismatch
    if (word === ink) {
      // swap word to next different color
      const alternatives = COLORS.filter((c) => c !== ink);
      word = alternatives[Math.floor(Math.random() * alternatives.length)];
    }
    trials.push({ trial_number: i + 1, word_shown: word, ink_color: ink });
  }
  return trials;
}

export function generateBlock2(): Trial[] {
  return generateIncongruentBlock();
}

export function generateBlock3(): Trial[] {
  return generateIncongruentBlock();
}

export function computeMeanRT(rts: (number | null)[]): number | null {
  const valid = rts.filter((r): r is number => r !== null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}
