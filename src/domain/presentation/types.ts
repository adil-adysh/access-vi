/**
 * Presentation domain model for visual-auditory parity.
 *
 * Defines explicit, typed representations for visual styling and shapes
 * that are shared across visual rendering, sonification, and accessible descriptions.
 */

export type NodeShape = 'circle' | 'rectangle' | 'diamond';

export const SUPPORTED_NODE_SHAPES: readonly NodeShape[] = ['circle', 'rectangle', 'diamond'] as const;

export const DEFAULT_NODE_SHAPE: NodeShape = 'circle';

export interface NodePresentation {
  readonly shape?: NodeShape | string;
  readonly originalDeclaredShape?: string;
  readonly isFallback?: boolean;
  readonly fallbackReason?: string;
  readonly fillColor?: string;
  readonly strokeColor?: string;
  readonly strokeStyle?: 'solid' | 'dashed' | 'dotted';
  readonly strokeWidth?: number;
  readonly ariaDescription?: string;
}

export type EdgeGeometryVariation = 'straight' | 'curved' | 'step';

export interface EdgePresentation {
  readonly lineStyle?: 'solid' | 'dashed' | 'dotted';
  readonly strokeColor?: string;
  readonly strokeWidth?: number;
  readonly arrowStyle?: 'standard' | 'double' | 'open';
  readonly geometryVariation?: EdgeGeometryVariation;
  readonly ariaDescription?: string;
}

export interface ResolvedNodePresentation {
  readonly shape: NodeShape;
  readonly originalDeclaredShape?: string;
  readonly isFallback: boolean;
  readonly fallbackReason?: string;
  readonly rawShape?: string; // backwards compatibility alias
  readonly fillColor: string;
  readonly strokeColor: string;
  readonly strokeStyle: 'solid' | 'dashed' | 'dotted';
  readonly strokeWidth: number;
  readonly shapeName: string;
  readonly shapeDescription: string;
  readonly ariaLabel: string;
}

export interface ResolvedEdgePresentation {
  readonly lineStyle: 'solid' | 'dashed' | 'dotted';
  readonly strokeColor: string;
  readonly strokeWidth: number;
  readonly arrowStyle: 'standard' | 'double' | 'open';
  readonly geometryVariation: EdgeGeometryVariation;
  readonly ariaLabel: string;
}

/**
 * Normalizes input shape string into a supported NodeShape with fallback handling.
 */
export function normalizeShape(input?: string | null): {
  shape: NodeShape;
  isFallback: boolean;
  originalDeclaredShape?: string;
  fallbackReason?: string;
  rawShape?: string;
} {
  if (!input || typeof input !== 'string') {
    return { shape: DEFAULT_NODE_SHAPE, isFallback: false };
  }

  const raw = input.trim();
  const cleaned = raw.toLowerCase();
  if (cleaned === 'circle') {
    return { shape: 'circle', isFallback: false, originalDeclaredShape: raw, rawShape: raw };
  }
  if (cleaned === 'rectangle' || cleaned === 'rect' || cleaned === 'box' || cleaned === 'square') {
    return { shape: 'rectangle', isFallback: false, originalDeclaredShape: raw, rawShape: raw };
  }
  if (cleaned === 'diamond' || cleaned === 'rhombus') {
    return { shape: 'diamond', isFallback: false, originalDeclaredShape: raw, rawShape: raw };
  }

  // Documented fallback for unknown / unsupported shapes:
  // Reverts deterministically to DEFAULT_NODE_SHAPE ('circle') with isFallback = true.
  return {
    shape: DEFAULT_NODE_SHAPE,
    isFallback: true,
    originalDeclaredShape: raw,
    rawShape: raw,
    fallbackReason: `Unsupported shape "${raw}" mapped to default circle sound and visual`
  };
}

/**
 * Resolves node visual presentation properties from node metadata and presentation object.
 *
 * Governing Rule A & B: Shape is resolved strictly from presentation or shape metadata.
 * Shape is NEVER inferred from node ID or label text.
 */
export function resolveNodePresentation(node: {
  readonly id?: string;
  readonly label?: string;
  readonly presentation?: NodePresentation;
  readonly metadata?: Record<string, unknown>;
}): ResolvedNodePresentation {
  const explicitShape =
    node.presentation?.originalDeclaredShape ??
    node.presentation?.shape ??
    (typeof node.metadata?.originalDeclaredShape === 'string'
      ? node.metadata.originalDeclaredShape
      : typeof node.metadata?.shape === 'string'
        ? node.metadata.shape
        : undefined);

  const norm = normalizeShape(explicitShape);
  const shape = norm.shape;
  const isFallback = node.presentation?.isFallback ?? norm.isFallback;
  const originalDeclaredShape = node.presentation?.originalDeclaredShape ?? norm.originalDeclaredShape;
  const fallbackReason = node.presentation?.fallbackReason ?? norm.fallbackReason;

  const shapeName = shape.charAt(0).toUpperCase() + shape.slice(1);
  const shapeDesc = isFallback
    ? `Fallback Circle (unsupported shape "${originalDeclaredShape || 'unknown'}")`
    : `${shapeName} shape`;

  const nodeName = node.label || node.id || 'Unnamed node';
  const ariaLabel = isFallback
    ? `${nodeName}, ${originalDeclaredShape || 'unknown'} shape (unsupported, mapped to circle sound and visual)`
    : `${shapeDesc}, Node ${nodeName}`;

  return {
    shape,
    originalDeclaredShape,
    isFallback,
    fallbackReason,
    rawShape: originalDeclaredShape,
    fillColor: node.presentation?.fillColor ?? '#1e293b',
    strokeColor: node.presentation?.strokeColor ?? '#38bdf8',
    strokeStyle: node.presentation?.strokeStyle ?? 'solid',
    strokeWidth: node.presentation?.strokeWidth ?? 2,
    shapeName,
    shapeDescription: shapeDesc,
    ariaLabel
  };
}

/**
 * Resolves edge presentation properties from edge metadata and presentation object.
 *
 * Governing Rule D: Decorative geometries (straight, curved, step) do not alter topological semantics.
 */
export function resolveEdgePresentation(edge: {
  readonly id?: string;
  readonly source?: string;
  readonly target?: string;
  readonly label?: string;
  readonly presentation?: EdgePresentation;
  readonly metadata?: Record<string, unknown>;
}): ResolvedEdgePresentation {
  const geomRaw =
    edge.presentation?.geometryVariation ??
    (typeof edge.metadata?.geometryVariation === 'string'
      ? (edge.metadata.geometryVariation as EdgeGeometryVariation)
      : undefined);

  const geometryVariation: EdgeGeometryVariation =
    geomRaw === 'curved' || geomRaw === 'step' ? geomRaw : 'straight';

  const lineStyle = edge.presentation?.lineStyle ?? 'solid';
  const strokeColor = edge.presentation?.strokeColor ?? '#64748b';
  const strokeWidth = edge.presentation?.strokeWidth ?? 2;
  const arrowStyle = edge.presentation?.arrowStyle ?? 'standard';

  const desc =
    edge.presentation?.ariaDescription ??
    (edge.source && edge.target ? `Directed edge from ${edge.source} to ${edge.target}` : 'Directed edge');

  return {
    lineStyle,
    strokeColor,
    strokeWidth,
    arrowStyle,
    geometryVariation,
    ariaLabel: desc
  };
}
