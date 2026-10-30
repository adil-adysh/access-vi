import { DirectedGraph } from './Graph.js';
import type { GraphNode, GraphEdge, GraphMetadata, SerializedGraph } from './types.js';

export interface ParseError {
  readonly line?: number;
  readonly message: string;
}

/**
 * Parses DOT and JSON representations of directed graphs.
 */
export class GraphParser {
  /**
   * Parses Graphviz DOT string into DirectedGraph.
   */
  public static parseDOT(dotString: string, graphId: string = 'dot-graph'): DirectedGraph {
    if (!dotString || typeof dotString !== 'string') {
      throw new Error('DOT input must be a non-empty string.');
    }

    const cleanInput = dotString
      .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
      .replace(/\/\/.*/g, '')           // remove line comments
      .replace(/#.*/g, '');             // remove hash comments

    const digraphMatch = cleanInput.match(/(?:strict\s+)?digraph\s*([a-zA-Z0-9_-]*)\s*\{([\s\S]*)\}/i);
    if (!digraphMatch) {
      throw new Error('Invalid DOT format: Missing "digraph { ... }" declaration.');
    }

    const graphName = digraphMatch[1] ? digraphMatch[1].trim() : graphId;
    const body = digraphMatch[2];

    const metadata: GraphMetadata = {
      id: graphId,
      name: graphName || 'Imported DOT Graph'
    };

    const graph = new DirectedGraph(metadata);
    const nodesMap = new Map<string, GraphNode>();
    const edgesList: GraphEdge[] = [];

    // Split statements by semicolon or newline
    const statements = body
      .split(/;|\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let edgeCounter = 1;

    for (let lineIndex = 0; lineIndex < statements.length; lineIndex++) {
      const stmt = statements[lineIndex];

      // Skip global graph/node/edge attribute blocks e.g. graph [rankdir=LR]
      if (/^(graph|node|edge)\s*\[/i.test(stmt)) {
        continue;
      }

      // Check for edge statement: A -> B [attrs] or A -> B -> C
      if (stmt.includes('->')) {
        const edgeRegex = /^([a-zA-Z0-9_"-]+(?:\s*->\s*[a-zA-Z0-9_"-]+)+)(?:\s*\[(.*)\])?$/;
        const match = stmt.match(edgeRegex);
        if (!match) {
          throw new Error(`Syntax error at statement: "${stmt}"`);
        }

        const chainPart = match[1];
        const attrPart = match[2];
        const attributes = GraphParser.parseAttributes(attrPart);

        const nodeChain = chainPart
          .split('->')
          .map((n) => GraphParser.unquote(n.trim()));

        for (let i = 0; i < nodeChain.length - 1; i++) {
          const source = nodeChain[i];
          const target = nodeChain[i + 1];

          if (!nodesMap.has(source)) {
            nodesMap.set(source, { id: source, label: source });
          }
          if (!nodesMap.has(target)) {
            nodesMap.set(target, { id: target, label: target });
          }

          const edgeId = `e_${source}_${target}_${edgeCounter++}`;
          edgesList.push({
            id: edgeId,
            source,
            target,
            label: attributes.label,
            category: attributes.category,
            metadata: attributes
          });
        }
      } else {
        // Node statement: A [label="..."] or simply A
        const nodeRegex = /^([a-zA-Z0-9_"-]+)(?:\s*\[(.*)\])?$/;
        const match = stmt.match(nodeRegex);
        if (match) {
          const nodeId = GraphParser.unquote(match[1].trim());
          const attrPart = match[2];
          const attributes = GraphParser.parseAttributes(attrPart);

          const existing = nodesMap.get(nodeId);
          nodesMap.set(nodeId, {
            id: nodeId,
            label: attributes.label || existing?.label || nodeId,
            category: attributes.category || existing?.category,
            metadata: { ...(existing?.metadata ?? {}), ...attributes }
          });
        }
      }
    }

    // Add nodes to graph
    for (const node of nodesMap.values()) {
      if (!graph.hasNode(node.id)) {
        graph.addNode(node);
      }
    }

    // Add edges to graph
    for (const edge of edgesList) {
      if (!graph.hasEdge(edge.source, edge.target)) {
        graph.addEdge(edge);
      }
    }

    return graph;
  }

  /**
   * Export DirectedGraph to DOT format.
   */
  public static exportDOT(graph: DirectedGraph): string {
    const meta = graph.getMetadata();
    const safeName = meta.name.replace(/[^a-zA-Z0-9_]/g, '_') || 'G';
    const lines: string[] = [`digraph ${safeName} {`];

    for (const node of graph.getNodes()) {
      const attrs: string[] = [];
      if (node.label && node.label !== node.id) {
        attrs.push(`label="${node.label.replace(/"/g, '\\"')}"`);
      }
      if (node.category) {
        attrs.push(`category="${node.category.replace(/"/g, '\\"')}"`);
      }
      const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : '';
      lines.push(`  "${node.id}"${attrStr};`);
    }

    for (const edge of graph.getEdges()) {
      const attrs: string[] = [];
      if (edge.label) {
        attrs.push(`label="${edge.label.replace(/"/g, '\\"')}"`);
      }
      if (edge.category) {
        attrs.push(`category="${edge.category.replace(/"/g, '\\"')}"`);
      }
      const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : '';
      lines.push(`  "${edge.source}" -> "${edge.target}"${attrStr};`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Parses JSON string into DirectedGraph.
   */
  public static parseJSON(jsonString: string): DirectedGraph {
    try {
      const parsed = JSON.parse(jsonString) as SerializedGraph;
      return DirectedGraph.fromJSON(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse graph JSON: ${msg}`);
    }
  }

  private static parseAttributes(attrString?: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!attrString) return result;

    const regex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^,\s\]]+))/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(attrString)) !== null) {
      const key = match[1];
      const val = match[2] ?? match[3] ?? match[4] ?? '';
      result[key] = val;
    }

    return result;
  }

  private static unquote(str: string): string {
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      return str.slice(1, -1);
    }
    return str;
  }
}
