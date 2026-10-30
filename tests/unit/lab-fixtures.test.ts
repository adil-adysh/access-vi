import { describe, it, expect } from 'vitest';
import { LAB_TEST_CASES } from '../../src/domain/lab/fixtures.js';

describe('Laboratory Fixtures Validation (Fix 2 & Fix 6)', () => {
  it('ensures every test fixture with expectedAnswerId has a matching option id', () => {
    expect(LAB_TEST_CASES.length).toBeGreaterThan(0);

    for (const testCase of LAB_TEST_CASES) {
      expect(testCase.id).toBeDefined();
      expect(testCase.category).toBeDefined();
      expect(testCase.prompt).toBeDefined();
      expect(testCase.options.length).toBeGreaterThan(1);

      // Verify all option IDs are non-empty and unique within testCase
      const optionIds = new Set<string>();
      for (const opt of testCase.options) {
        expect(opt.id).toBeTruthy();
        expect(opt.label).toBeTruthy();
        expect(optionIds.has(opt.id)).toBe(false);
        optionIds.add(opt.id);
      }

      // If expectedAnswerId is defined, it MUST exist in optionIds
      if (testCase.expectedAnswerId !== undefined) {
        expect(
          optionIds.has(testCase.expectedAnswerId),
          `Test case "${testCase.id}" has expectedAnswerId "${testCase.expectedAnswerId}" which does not match any option ID: [${[...optionIds].join(', ')}]`
        ).toBe(true);
      }
    }
  });

  it('ensures all perceptual listening trials have blindInAssessment set', () => {
    const listeningCategories = [
      'shape_discrimination',
      'shape_recognition',
      'destination_recognition'
    ];

    const listeningTrials = LAB_TEST_CASES.filter((tc) =>
      listeningCategories.includes(tc.category)
    );

    for (const trial of listeningTrials) {
      expect(
        trial.visualStimulus?.blindInAssessment,
        `Trial "${trial.id}" in category "${trial.category}" must have blindInAssessment: true to prevent answer leakage during listening assessments`
      ).toBe(true);
    }
  });

  it('contains genuine perceptual categories (discrimination, recognition, direction, hierarchy, destination, invariance)', () => {
    const categories = new Set(LAB_TEST_CASES.map((tc) => tc.category));
    expect(categories.has('shape_discrimination')).toBe(true);
    expect(categories.has('shape_recognition')).toBe(true);
    expect(categories.has('identity_vs_category')).toBe(true);
    expect(categories.has('perceived_hierarchy')).toBe(true);
    expect(categories.has('relationship_direction')).toBe(true);
    expect(categories.has('shape_independence')).toBe(true);
    expect(categories.has('geometry_invariance')).toBe(true);
    expect(categories.has('destination_recognition')).toBe(true);
    expect(categories.has('perceived_meaning')).toBe(true);
  });
});
