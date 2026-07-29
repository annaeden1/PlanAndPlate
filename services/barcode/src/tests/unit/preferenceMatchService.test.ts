import { checkPreferenceMatches } from '../../services/preferenceMatchService';
import { ProductNutrition } from '../../utils/types/product';

const product = (overrides: Partial<ProductNutrition> = {}): ProductNutrition => ({
  ...overrides,
});

describe('preferenceMatchService - checkPreferenceMatches', () => {
  describe('allergies', () => {
    it('returns unknown when the product has no safety evidence at all', () => {
      const matches = checkPreferenceMatches(product(), { allergies: ['dairy'] });
      expect(matches).toEqual([{ label: 'dairy free', status: 'unknown' }]);
    });

    it('flags a confirmed allergen (from allergens_tags) as mismatch', () => {
      const matches = checkPreferenceMatches(
        product({ allergens_tags: ['en:milk'] }),
        { allergies: ['dairy'] },
      );
      expect(matches[0]).toEqual({ label: 'dairy free', status: 'mismatch' });
    });

    it('flags a potential allergen risk (from ingredients_text) as mismatch', () => {
      const matches = checkPreferenceMatches(
        product({ ingredients_text: 'wheat flour, sugar' }),
        { allergies: ['gluten'] },
      );
      expect(matches[0]).toEqual({ label: 'gluten free', status: 'mismatch' });
    });

    it('marks match when an explicit free-from label tag is present', () => {
      const matches = checkPreferenceMatches(
        product({ labels_tags: ['en:no-gluten'], categories: 'snacks' }),
        { allergies: ['gluten'] },
      );
      expect(matches[0]).toEqual({ label: 'gluten free', status: 'match' });
    });

    it('returns unknown when there is evidence but no conflict and no free-from claim', () => {
      const matches = checkPreferenceMatches(
        product({ categories: 'snacks' }),
        { allergies: ['nuts'] },
      );
      expect(matches[0]).toEqual({ label: 'nuts free', status: 'unknown' });
    });

    it('ignores negated allergen mentions ("no milk") and does not flag mismatch', () => {
      const matches = checkPreferenceMatches(
        product({ ingredients_text: 'water, no milk, cocoa', categories: 'drinks' }),
        { allergies: ['dairy'] },
      );
      expect(matches[0].status).toBe('unknown');
    });

    it('falls back to the allergy name itself for unknown allergy keys', () => {
      const matches = checkPreferenceMatches(
        product({ ingredients_text: 'contains mustard seeds' }),
        { allergies: ['mustard'] },
      );
      expect(matches[0]).toEqual({ label: 'mustard free', status: 'mismatch' });
    });

    it('recognizes free-from tags for dairy, eggs, nuts and soy', () => {
      const cases: Array<[string, string]> = [
        ['dairy', 'en:dairy-free'],
        ['eggs', 'en:egg-free'],
        ['nuts', 'en:nut-free'],
        ['soy', 'en:soy-free'],
      ];
      for (const [allergy, tag] of cases) {
        const matches = checkPreferenceMatches(
          product({ labels_tags: [tag], categories: 'food' }),
          { allergies: [allergy] },
        );
        expect(matches[0].status).toBe('match');
      }
    });

    it('handles multiple allergies in one call', () => {
      const matches = checkPreferenceMatches(
        product({ allergens_tags: ['en:milk'], ingredients_text: 'milk, sugar' }),
        { allergies: ['dairy', 'soy'] },
      );
      expect(matches).toHaveLength(2);
      expect(matches[0].status).toBe('mismatch');
      expect(matches[1].status).toBe('unknown');
    });

    it('returns no allergy matches when allergies list is missing', () => {
      const matches = checkPreferenceMatches(product({ categories: 'x' }), {});
      expect(matches).toEqual([]);
    });
  });

  describe('diet compatibility', () => {
    it('does not add a diet match for unsupported diets', () => {
      const matches = checkPreferenceMatches(
        product({ categories: 'x' }),
        { diet: ['keto'] },
      );
      expect(matches).toEqual([]);
    });

    it('returns unknown diet status when no safety evidence', () => {
      const matches = checkPreferenceMatches(product(), { diet: ['vegan'] });
      expect(matches[0]).toEqual({ label: 'Vegan Compatible', status: 'unknown' });
    });

    describe('vegan', () => {
      it('mismatch when a non-vegan tag is present', () => {
        const matches = checkPreferenceMatches(
          product({ labels_tags: ['en:non-vegan'], categories: 'food' }),
          { diet: ['vegan'] },
        );
        expect(matches[0].status).toBe('mismatch');
      });

      it('mismatch when an animal/vegan-extra keyword appears in text', () => {
        const matches = checkPreferenceMatches(
          product({ ingredients_text: 'cream, sugar' }),
          { diet: ['vegan'] },
        );
        expect(matches[0].status).toBe('mismatch');
      });

      it('unknown when a vegan tag is uncertain', () => {
        const matches = checkPreferenceMatches(
          product({ ingredients_analysis_tags: ['en:vegan-status-unknown'] }),
          { diet: ['vegan'] },
        );
        expect(matches[0].status).toBe('unknown');
      });

      it('match when an exact vegan claim tag is present', () => {
        const matches = checkPreferenceMatches(
          product({ labels_tags: ['en:vegan'], categories: 'food' }),
          { diet: ['vegan'] },
        );
        expect(matches[0].status).toBe('match');
      });

      it('matches a claim tag that has no language prefix', () => {
        const matches = checkPreferenceMatches(
          product({ labels_tags: ['vegan'], categories: 'food' }),
          { diet: ['vegan'] },
        );
        expect(matches[0].status).toBe('match');
      });

      it('unknown when evidence exists but no vegan claim or conflict', () => {
        const matches = checkPreferenceMatches(
          product({ categories: 'water' }),
          { diet: ['vegan'] },
        );
        expect(matches[0].status).toBe('unknown');
      });
    });

    describe('vegetarian variants', () => {
      it('mismatch when a non-vegetarian tag is present', () => {
        const matches = checkPreferenceMatches(
          product({ labels_tags: ['en:non-vegetarian'], categories: 'food' }),
          { diet: ['vegetarian'] },
        );
        expect(matches[0].status).toBe('mismatch');
      });

      it('mismatch when a meat keyword appears in text', () => {
        const matches = checkPreferenceMatches(
          product({ ingredients_text: 'beef, salt' }),
          { diet: ['vegetarian'] },
        );
        expect(matches[0].status).toBe('mismatch');
      });

      it('lactoVegetarian mismatches on egg', () => {
        const matches = checkPreferenceMatches(
          product({ ingredients_text: 'egg, flour' }),
          { diet: ['lactoVegetarian'] },
        );
        expect(matches[0].status).toBe('mismatch');
      });

      it('ovoVegetarian mismatches on dairy', () => {
        const matches = checkPreferenceMatches(
          product({ ingredients_text: 'milk, sugar' }),
          { diet: ['ovoVegetarian'] },
        );
        expect(matches[0].status).toBe('mismatch');
      });

      it('unknown when a vegetarian tag is uncertain', () => {
        const matches = checkPreferenceMatches(
          product({ ingredients_analysis_tags: ['en:vegetarian-status-unknown'] }),
          { diet: ['vegetarian'] },
        );
        expect(matches[0].status).toBe('unknown');
      });

      it('match when an exact vegetarian claim tag is present', () => {
        const matches = checkPreferenceMatches(
          product({ labels_tags: ['en:vegetarian'], categories: 'food' }),
          { diet: ['vegetarian'] },
        );
        expect(matches[0].status).toBe('match');
      });

      it('unknown when evidence exists but no vegetarian claim or conflict', () => {
        const matches = checkPreferenceMatches(
          product({ categories: 'water' }),
          { diet: ['lactoVegetarian'] },
        );
        expect(matches[0].status).toBe('unknown');
      });
    });

    describe('glutenFree and pescatarian', () => {
      it('glutenFree delegates to the gluten allergy check (mismatch on wheat)', () => {
        const matches = checkPreferenceMatches(
          product({ ingredients_text: 'wheat flour' }),
          { diet: ['glutenFree'] },
        );
        expect(matches[0]).toEqual({
          label: 'Gluten Free Compatible',
          status: 'mismatch',
        });
      });

      it('pescatarian mismatches on land-meat keywords', () => {
        const matches = checkPreferenceMatches(
          product({ ingredients_text: 'pork, salt' }),
          { diet: ['pescatarian'] },
        );
        expect(matches[0].status).toBe('mismatch');
      });

      it('pescatarian is unknown when only fish/other evidence present', () => {
        const matches = checkPreferenceMatches(
          product({ ingredients_text: 'tuna, water' }),
          { diet: ['pescatarian'] },
        );
        expect(matches[0].status).toBe('unknown');
      });
    });
  });

  it('combines allergy and diet matches', () => {
    const matches = checkPreferenceMatches(
      product({ labels_tags: ['en:vegan', 'en:no-gluten'], categories: 'food' }),
      { allergies: ['gluten'], diet: ['vegan'] },
    );
    expect(matches).toEqual([
      { label: 'gluten free', status: 'match' },
      { label: 'Vegan Compatible', status: 'match' },
    ]);
  });
});
