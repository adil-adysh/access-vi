/**
 * Domain types for directed graph representation, metadata, and difficulty metrics.
 */

export interface GraphNode {
  readonly id: string;
  readonly label?: string;
  readonly category?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label?: string;
  readonly category?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface GraphMetadata {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version?: string;
  readonly isTraining?: boolean;
  readonly difficultyMetrics?: GraphDifficultyMetrics;
  readonly customData?: Record<string, unknown>;
}

export interface GraphDifficultyMetrics {
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly density: number;
  readonly avgInDegree: number;
  readonly avgOutDegree: number;
  readonly maxInDegree: number;
  readonly maxOutDegree: number;
  readonly cycleCount: number;
  readonly hasCycles: boolean;
  readonly branchingNodes: string[];
  readonly convergenceNodes: string[];
  readonly avgShortestPathLength: number;
  readonly diameter: number;
}

export interface SerializedGraph {
  readonly metadata: GraphMetadata;
  readonly nodes: GraphNode[];
  readonly edges: GraphEdge[];
}

export interface GraphComparisonResult {
  readonly precision: number; // Correct reconstructed edges / total reconstructed edges
  readonly recall: number;    // Correct reconstructed edges / total ground truth edges
  readonly f1Score: number;
  readonly missingEdges: Array<{ source: string; target: string }>;
  readonly extraEdges: Array<{ source: string; target: string }>;
  readonly matchedEdges: Array<{ source: string; target: string }>;
  readonly exactMatch: boolean;
}
