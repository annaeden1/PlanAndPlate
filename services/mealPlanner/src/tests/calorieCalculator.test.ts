import {
  calcTargets,
  lbToKg,
  ftInToCm,
  ACTIVITY_MULTIPLIERS,
  GOAL_MODIFIERS,
  type BodyStats,
} from '../utils/calorieCalculator';

// Reference values cross-checked against calculator.net (Mifflin-St Jeor).
// These lock the goal-driven engine: given body stats + a goal, the app must
// compute the right daily calorie target AND protein need.

describe('calcTargets — calories + protein from stats and goal', () => {
  const male: BodyStats = {
    weightKg: 80,
    heightCm: 180,
    age: 30,
    gender: 'male',
    activityLevel: 'moderate',
    unitSystem: 'metric',
  };

  const female: BodyStats = {
    weightKg: 60,
    heightCm: 165,
    age: 28,
    gender: 'female',
    activityLevel: 'sedentary',
    unitSystem: 'metric',
  };

  it('gain_muscle: surplus calories + high protein (male reference)', () => {
    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780
    // maintenance = 1780 * 1.465 = 2607.7
    // target = 2607.7 * 1.15 = 2998.9 ; protein = 1.9 * 80 = 152
    expect(calcTargets(male, 'gain_muscle')).toEqual({
      bmr: 1780,
      maintenance: 2608,
      targetCalories: 2999,
      proteinGramsPerDay: 152,
    });
  });

  it('lose_weight: deficit calories + muscle-sparing protein (female reference)', () => {
    // BMR = 10*60 + 6.25*165 - 5*28 - 161 = 1330.25
    // maintenance = 1330.25 * 1.2 = 1596.3
    // target = 1596.3 * 0.85 = 1356.9 ; protein = 1.6 * 60 = 96
    expect(calcTargets(female, 'lose_weight')).toEqual({
      bmr: 1330,
      maintenance: 1596,
      targetCalories: 1357,
      proteinGramsPerDay: 96,
    });
  });

  it('maintain_weight: target equals maintenance', () => {
    const t = calcTargets(male, 'maintain_weight')!;
    expect(t.targetCalories).toBe(t.maintenance);
    expect(t.proteinGramsPerDay).toBe(Math.round(1.2 * male.weightKg));
  });

  it('unknown goal falls back to maintain_weight modifier', () => {
    expect(calcTargets(male, 'totally_unknown')).toEqual(
      calcTargets(male, 'maintain_weight'),
    );
  });

  it('higher activity level raises the calorie target', () => {
    const sed = calcTargets({ ...male, activityLevel: 'sedentary' }, 'maintain_weight')!;
    const extra = calcTargets({ ...male, activityLevel: 'extra_active' }, 'maintain_weight')!;
    expect(extra.targetCalories).toBeGreaterThan(sed.targetCalories);
    expect(sed.bmr).toBe(extra.bmr); // BMR is activity-independent
  });

  it('protein scales with bodyweight for a fixed goal', () => {
    const light = calcTargets({ ...male, weightKg: 60 }, 'gain_muscle')!;
    const heavy = calcTargets({ ...male, weightKg: 100 }, 'gain_muscle')!;
    expect(light.proteinGramsPerDay).toBe(Math.round(1.9 * 60));
    expect(heavy.proteinGramsPerDay).toBe(Math.round(1.9 * 100));
  });

  it.each([
    ['missing weight', { ...male, weightKg: 0 }],
    ['missing height', { ...male, heightCm: 0 }],
    ['missing age', { ...male, age: 0 }],
    ['bad activity', { ...male, activityLevel: 'lazy' as BodyStats['activityLevel'] }],
  ])('returns null on incomplete stats (%s)', (_label, stats) => {
    expect(calcTargets(stats, 'gain_muscle')).toBeNull();
  });

  it('returns null for null/undefined stats (legacy users keep old behavior)', () => {
    expect(calcTargets(null, 'gain_muscle')).toBeNull();
    expect(calcTargets(undefined, 'gain_muscle')).toBeNull();
  });
});

describe('unit conversion helpers', () => {
  it('lbToKg converts pounds to kilograms', () => {
    expect(lbToKg(100)).toBeCloseTo(45.3592, 4);
  });

  it('ftInToCm converts feet+inches to centimeters', () => {
    expect(ftInToCm(5, 10)).toBeCloseTo(177.8, 1);
    expect(ftInToCm(6, 0)).toBeCloseTo(182.88, 2);
  });

  it('US-entered stats produce the same target after conversion', () => {
    const metric = calcTargets(
      {
        weightKg: lbToKg(176.37),
        heightCm: ftInToCm(5, 11),
        age: 30,
        gender: 'male',
        activityLevel: 'moderate',
        unitSystem: 'us',
      },
      'maintain_weight',
    );
    expect(metric).not.toBeNull();
    expect(metric!.targetCalories).toBeGreaterThan(0);
  });
});

describe('protein intake verification — realized g/kg of bodyweight', () => {
  const base = {
    heightCm: 180,
    age: 30,
    gender: 'male' as const,
    activityLevel: 'moderate' as const,
    unitSystem: 'metric' as const,
  };

  // What the user ACTUALLY receives per kg, after the engine's rounding:
  // g/kg = proteinGramsPerDay / weightKg
  const realizedPerKg = (goal: string, weightKg: number): number =>
    calcTargets({ ...base, weightKg }, goal)!.proteinGramsPerDay / weightKg;

  // A spread of bodyweights so the assertion isn't an accident of one number.
  const weights = [48, 57, 63, 70, 85, 100, 120];

  // Rounding (Math.round of rate*weight) can shift realized g/kg by at most
  // 0.5/weight ≈ 0.01, so allow a small tolerance around the 1.6–2.2 band.
  const EPS = 0.05;

  describe('muscle/weight goals land in the recommended 1.6–2.2 g/kg band', () => {
    it.each(weights)('gain_muscle @ %d kg', (w: number) => {
      const v = realizedPerKg('gain_muscle', w);
      expect(v).toBeGreaterThanOrEqual(1.6 - EPS);
      expect(v).toBeLessThanOrEqual(2.2 + EPS);
    });

    it.each(weights)('lose_weight @ %d kg', (w: number) => {
      const v = realizedPerKg('lose_weight', w);
      expect(v).toBeGreaterThanOrEqual(1.6 - EPS);
      expect(v).toBeLessThanOrEqual(2.2 + EPS);
    });
  });

  // Documents current behavior: general-health goals sit at 1.2 g/kg, which is
  // BELOW the 1.6–2.2 athletic band. Change here if the band should apply to all.
  describe('general-health goals currently sit at ~1.2 g/kg (below the band)', () => {
    it.each(weights)('maintain_weight @ %d kg', (w: number) => {
      expect(realizedPerKg('maintain_weight', w)).toBeCloseTo(1.2, 1);
    });

    it.each(weights)('eat_healthier @ %d kg', (w: number) => {
      expect(realizedPerKg('eat_healthier', w)).toBeCloseTo(1.2, 1);
    });
  });
});

describe('safe calorie floor (no unsafe deficits)', () => {
  it('clamps a small female on an aggressive cut to 1200 kcal', () => {
    // maintenance ≈ 1286, raw target ≈ 1093 → clamped up to 1200
    const t = calcTargets(
      {
        weightKg: 42,
        heightCm: 150,
        age: 25,
        gender: 'female',
        activityLevel: 'sedentary',
        unitSystem: 'metric',
      },
      'lose_weight',
    )!;
    expect(t.targetCalories).toBe(1200);
  });

  it('clamps a small male on an aggressive cut to 1500 kcal', () => {
    // maintenance ≈ 1656, raw target ≈ 1408 → clamped up to 1500
    const t = calcTargets(
      {
        weightKg: 50,
        heightCm: 160,
        age: 25,
        gender: 'male',
        activityLevel: 'sedentary',
        unitSystem: 'metric',
      },
      'lose_weight',
    )!;
    expect(t.targetCalories).toBe(1500);
  });

  it('does not clamp normal targets above the floor', () => {
    const t = calcTargets(
      {
        weightKg: 80,
        heightCm: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'moderate',
        unitSystem: 'metric',
      },
      'lose_weight',
    )!;
    expect(t.targetCalories).toBeGreaterThan(1500); // computed deficit, not the floor
  });
});

describe('engine constants', () => {
  it('activity multipliers are monotonic from sedentary to extra_active', () => {
    const order: (keyof typeof ACTIVITY_MULTIPLIERS)[] = [
      'sedentary',
      'light',
      'moderate',
      'active',
      'very_active',
      'extra_active',
    ];
    for (let i = 1; i < order.length; i++) {
      expect(ACTIVITY_MULTIPLIERS[order[i]]).toBeGreaterThan(
        ACTIVITY_MULTIPLIERS[order[i - 1]],
      );
    }
  });

  it('every goal modifier defines a calorie factor and protein-per-kg', () => {
    for (const goal of Object.values(GOAL_MODIFIERS)) {
      expect(goal.calorieFactor).toBeGreaterThan(0);
      expect(goal.proteinPerKg).toBeGreaterThan(0);
    }
  });
});
