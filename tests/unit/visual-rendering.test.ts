import { describe, it, expect } from 'vitest';
import {
  getBoundaryIntersection,
  calculateEdgePath,
  SHAPE_DIMENSIONS
} from '../../src/features/lab/geometry.js';

describe('Boundary-Aware Visual Connection Rendering (Fix 5)', () => {
  const center = { x: 100, y: 100 };

  it('calculates exact circle boundary intersections (r = 24)', () => {
    expect(SHAPE_DIMENSIONS.circle.radius).toBe(24);
    // Right (0 degrees)
    const right = getBoundaryIntersection('circle', center, { x: 1, y: 0 });
    expect(right.x).toBeCloseTo(124);
    expect(right.y).toBeCloseTo(100);

    // Left (180 degrees)
    const left = getBoundaryIntersection('circle', center, { x: -1, y: 0 });
    expect(left.x).toBeCloseTo(76);
    expect(left.y).toBeCloseTo(100);

    // Down (90 degrees)
    const down = getBoundaryIntersection('circle', center, { x: 0, y: 1 });
    expect(down.x).toBeCloseTo(100);
    expect(down.y).toBeCloseTo(124);

    // Up (270 degrees)
    const up = getBoundaryIntersection('circle', center, { x: 0, y: -1 });
    expect(up.x).toBeCloseTo(100);
    expect(up.y).toBeCloseTo(76);
  });

  it('calculates exact rectangle boundary intersections (w = 48, h = 40)', () => {
    // Right: half-width is 24
    const right = getBoundaryIntersection('rectangle', center, { x: 1, y: 0 });
    expect(right.x).toBeCloseTo(124);
    expect(right.y).toBeCloseTo(100);

    // Down: half-height is 20
    const down = getBoundaryIntersection('rectangle', center, { x: 0, y: 1 });
    expect(down.x).toBeCloseTo(100);
    expect(down.y).toBeCloseTo(120);

    // Diagonal: 45 degrees
    const diag = getBoundaryIntersection('rectangle', center, { x: 1, y: 1 });
    expect(diag.x).toBeCloseTo(120);
    expect(diag.y).toBeCloseTo(120);
  });

  it('calculates exact diamond rhombus boundary intersections (hw = 26, hh = 26)', () => {
    // Right vertex
    const right = getBoundaryIntersection('diamond', center, { x: 1, y: 0 });
    expect(right.x).toBeCloseTo(126);
    expect(right.y).toBeCloseTo(100);

    // Top vertex
    const top = getBoundaryIntersection('diamond', center, { x: 0, y: -1 });
    expect(top.x).toBeCloseTo(100);
    expect(top.y).toBeCloseTo(74);

    // 45 degrees diagonal edge midpoint
    const diag = getBoundaryIntersection('diamond', center, { x: 1, y: 1 });
    expect(diag.x).toBeCloseTo(113);
    expect(diag.y).toBeCloseTo(113);
  });

  it('ensures straight arrow path terminates at outer shape boundary instead of center', () => {
    const src = { x: 50, y: 100 };
    const tgt = { x: 200, y: 100 };

    const path = calculateEdgePath('circle', src, 'rectangle', tgt, 'straight');

    // Departure from right border of circle (50 + 24 = 74)
    // Arrival at left border of rectangle (200 - 24 = 176)
    expect(path).toBe('M 74 100 L 176 100');
  });

  it('generates valid quadratic bezier path for curved variation', () => {
    const src = { x: 50, y: 100 };
    const tgt = { x: 200, y: 100 };

    const path = calculateEdgePath('circle', src, 'diamond', tgt, 'curved');
    expect(path).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)? Q \d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/);
    expect(path).toContain('Q 125'); // Midpoint X
  });

  it('generates valid orthogonal path for step variation', () => {
    const src = { x: 50, y: 80 };
    const tgt = { x: 200, y: 140 };

    const path = calculateEdgePath('rectangle', src, 'circle', tgt, 'step');
    // Start at right border of src (50 + 24 = 74, 80)
    // Midpoint X = 125
    // End at left border of tgt (200 - 24 = 176, 140)
    expect(path).toBe('M 74 80 L 125 80 L 125 140 L 176 140');
  });

  it('generates valid loop path for self-loop connections', () => {
    const node = { x: 100, y: 100 };
    const path = calculateEdgePath('circle', node, 'circle', node, 'straight', true);

    expect(path).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)? C /);
  });
});
