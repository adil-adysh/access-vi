import type { NodeShape } from '../../domain/presentation/types.js';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface NodeGeometryInfo {
  readonly shape: NodeShape;
  readonly center: Point;
  readonly radius?: number;
  readonly width?: number;
  readonly height?: number;
}

export const SHAPE_DIMENSIONS = {
  circle: { radius: 24 },
  rectangle: { width: 48, height: 40 },
  diamond: { width: 52, height: 52 } // half-width 26, half-height 26
} as const;

/**
 * Computes intersection of a ray from shape center toward direction (dx, dy)
 * with the outer boundary of the shape.
 */
export function getBoundaryIntersection(
  shape: NodeShape,
  center: Point,
  direction: Point
): Point {
  const { x: cx, y: cy } = center;
  const { x: dx, y: dy } = direction;

  if (dx === 0 && dy === 0) {
    return { x: cx, y: cy };
  }

  if (shape === 'circle') {
    const r = SHAPE_DIMENSIONS.circle.radius;
    const len = Math.hypot(dx, dy);
    return {
      x: cx + (dx / len) * r,
      y: cy + (dy / len) * r
    };
  }

  if (shape === 'rectangle') {
    const hw = SHAPE_DIMENSIONS.rectangle.width / 2;
    const hh = SHAPE_DIMENSIONS.rectangle.height / 2;
    const tx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
    const ty = dy !== 0 ? hh / Math.abs(dy) : Infinity;
    const t = Math.min(tx, ty);
    return {
      x: cx + t * dx,
      y: cy + t * dy
    };
  }

  if (shape === 'diamond') {
    const hw = SHAPE_DIMENSIONS.diamond.width / 2;
    const hh = SHAPE_DIMENSIONS.diamond.height / 2;
    const denom = Math.abs(dx) / hw + Math.abs(dy) / hh;
    const t = denom > 0 ? 1 / denom : 0;
    return {
      x: cx + t * dx,
      y: cy + t * dy
    };
  }

  // Fallback to circle
  const r = 24;
  const len = Math.hypot(dx, dy);
  return {
    x: cx + (dx / len) * r,
    y: cy + (dy / len) * r
  };
}

/**
 * Computes boundary-aware SVG path string for connection between two nodes.
 * Arrowhead reaches the outer edge of the destination shape without being occluded.
 */
export function calculateEdgePath(
  srcShape: NodeShape,
  srcCenter: Point,
  tgtShape: NodeShape,
  tgtCenter: Point,
  variation: 'straight' | 'curved' | 'step' = 'straight',
  isSelfLoop: boolean = false
): string {
  if (isSelfLoop) {
    // Self-loop arc departing top and returning right side of the node boundary
    const topExit = getBoundaryIntersection(srcShape, srcCenter, { x: -8, y: -26 });
    const rightEntry = getBoundaryIntersection(srcShape, srcCenter, { x: 26, y: -4 });

    const c1x = srcCenter.x - 28;
    const c1y = srcCenter.y - 65;
    const c2x = srcCenter.x + 55;
    const c2y = srcCenter.y - 55;

    return `M ${topExit.x} ${topExit.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${rightEntry.x} ${rightEntry.y}`;
  }

  const dx = tgtCenter.x - srcCenter.x;
  const dy = tgtCenter.y - srcCenter.y;

  if (variation === 'curved') {
    const ctrlX = (srcCenter.x + tgtCenter.x) / 2;
    const ctrlY = Math.min(srcCenter.y, tgtCenter.y) - 38;

    const srcDir = { x: ctrlX - srcCenter.x, y: ctrlY - srcCenter.y };
    const tgtDir = { x: ctrlX - tgtCenter.x, y: ctrlY - tgtCenter.y };

    const pStart = getBoundaryIntersection(srcShape, srcCenter, srcDir);
    const pEnd = getBoundaryIntersection(tgtShape, tgtCenter, tgtDir);

    return `M ${pStart.x} ${pStart.y} Q ${ctrlX} ${ctrlY} ${pEnd.x} ${pEnd.y}`;
  }

  if (variation === 'step') {
    const midX = (srcCenter.x + tgtCenter.x) / 2;
    const stepDirX = dx >= 0 ? 1 : -1;

    const pStart = getBoundaryIntersection(srcShape, srcCenter, { x: stepDirX, y: 0 });
    const pEnd = getBoundaryIntersection(tgtShape, tgtCenter, { x: -stepDirX, y: 0 });

    return `M ${pStart.x} ${pStart.y} L ${midX} ${pStart.y} L ${midX} ${pEnd.y} L ${pEnd.x} ${pEnd.y}`;
  }

  // Default straight
  const pStart = getBoundaryIntersection(srcShape, srcCenter, { x: dx, y: dy });
  const pEnd = getBoundaryIntersection(tgtShape, tgtCenter, { x: -dx, y: -dy });

  return `M ${pStart.x} ${pStart.y} L ${pEnd.x} ${pEnd.y}`;
}
