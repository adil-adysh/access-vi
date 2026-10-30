import { DirectedGraph } from './Graph.js';
import type { GraphNode, GraphEdge, GraphMetadata, SerializedGraph } from './types.js';
import { normalizeShape, type NodePresentation, type EdgePresentation, type EdgeGeometryVariation } from '../presentation/types.js';

export interface ParseError {
  readonly line?: number;
  readonly column?: number;
  readonly message: string;
}

type TokenType =
  | 'STRICT'
  | 'DIGRAPH'
  | 'GRAPH'
  | 'SUBGRAPH'
  | 'NODE_KW'
  | 'EDGE_KW'
  | 'IDENTIFIER'
  | 'ARROW'         // ->
  | 'DASH_DASH'     // --
  | 'LBRACE'        // {
  | 'RBRACE'        // }
  | 'LBRACKET'      // [
  | 'RBRACKET'      // ]
  | 'EQUALS'        // =
  | 'SEMICOLON'     // ;
  | 'COMMA'         // ,
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

class DotLexer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private col: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.input.length) break;

      const ch = this.input[this.pos];
      const startLine = this.line;
      const startCol = this.col;

      if (ch === '{') {
        this.advance();
        tokens.push({ type: 'LBRACE', value: '{', line: startLine, column: startCol });
      } else if (ch === '}') {
        this.advance();
        tokens.push({ type: 'RBRACE', value: '}', line: startLine, column: startCol });
      } else if (ch === '[') {
        this.advance();
        tokens.push({ type: 'LBRACKET', value: '[', line: startLine, column: startCol });
      } else if (ch === ']') {
        this.advance();
        tokens.push({ type: 'RBRACKET', value: ']', line: startLine, column: startCol });
      } else if (ch === '=') {
        this.advance();
        tokens.push({ type: 'EQUALS', value: '=', line: startLine, column: startCol });
      } else if (ch === ';') {
        this.advance();
        tokens.push({ type: 'SEMICOLON', value: ';', line: startLine, column: startCol });
      } else if (ch === ',') {
        this.advance();
        tokens.push({ type: 'COMMA', value: ',', line: startLine, column: startCol });
      } else if (ch === '-' && this.peek() === '>') {
        this.advance();
        this.advance();
        tokens.push({ type: 'ARROW', value: '->', line: startLine, column: startCol });
      } else if (ch === '-' && this.peek() === '-') {
        this.advance();
        this.advance();
        tokens.push({ type: 'DASH_DASH', value: '--', line: startLine, column: startCol });
      } else if (ch === '"' || ch === "'") {
        const val = this.readQuotedString(ch);
        tokens.push({ type: 'IDENTIFIER', value: val, line: startLine, column: startCol });
      } else if (this.isIdentStart(ch)) {
        const val = this.readIdentifier();
        const lower = val.toLowerCase();
        if (lower === 'strict') {
          tokens.push({ type: 'STRICT', value: val, line: startLine, column: startCol });
        } else if (lower === 'digraph') {
          tokens.push({ type: 'DIGRAPH', value: val, line: startLine, column: startCol });
        } else if (lower === 'graph') {
          tokens.push({ type: 'GRAPH', value: val, line: startLine, column: startCol });
        } else if (lower === 'subgraph') {
          tokens.push({ type: 'SUBGRAPH', value: val, line: startLine, column: startCol });
        } else if (lower === 'node') {
          tokens.push({ type: 'NODE_KW', value: val, line: startLine, column: startCol });
        } else if (lower === 'edge') {
          tokens.push({ type: 'EDGE_KW', value: val, line: startLine, column: startCol });
        } else {
          tokens.push({ type: 'IDENTIFIER', value: val, line: startLine, column: startCol });
        }
      } else {
        throw new Error(`Unexpected character "${ch}" in DOT input at line ${this.line}, column ${this.col}`);
      }
    }

    tokens.push({ type: 'EOF', value: '', line: this.line, column: this.col });
    return tokens;
  }

  private advance(): string {
    const ch = this.input[this.pos++];
    if (ch === '\n') {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
    return ch;
  }

  private peek(): string | null {
    return this.pos + 1 < this.input.length ? this.input[this.pos + 1] : null;
  }

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        this.advance();
        continue;
      }

      // Line comments: // or #
      if (ch === '#' || (ch === '/' && this.peek() === '/')) {
        while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
          this.advance();
        }
        continue;
      }

      // Block comments: /* ... */
      if (ch === '/' && this.peek() === '*') {
        const startLine = this.line;
        const startCol = this.col;
        this.advance(); // /
        this.advance(); // *
        let terminated = false;
        while (this.pos < this.input.length) {
          if (this.input[this.pos] === '*' && this.peek() === '/') {
            this.advance(); // *
            this.advance(); // /
            terminated = true;
            break;
          }
          this.advance();
        }
        if (!terminated) {
          throw new Error(`Unterminated block comment starting at line ${startLine}, column ${startCol}`);
        }
        continue;
      }

      break;
    }
  }

  private readQuotedString(quoteChar: string): string {
    const startLine = this.line;
    const startCol = this.col;
    this.advance(); // opening quote
    let str = '';

    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (ch === '\\') {
        this.advance(); // skip backslash
        if (this.pos >= this.input.length) break;
        const esc = this.advance();
        if (esc === 'n') str += '\n';
        else if (esc === 't') str += '\t';
        else if (esc === 'r') str += '\r';
        else if (esc === '"') str += '"';
        else if (esc === "'") str += "'";
        else if (esc === '\\') str += '\\';
        else str += esc;
      } else if (ch === quoteChar) {
        this.advance(); // closing quote
        return str;
      } else {
        str += this.advance();
      }
    }

    throw new Error(`Unterminated string literal starting at line ${startLine}, column ${startCol}`);
  }

  private isIdentStart(ch: string): boolean {
    return /[a-zA-Z0-9_.-]/.test(ch);
  }

  private readIdentifier(): string {
    let id = '';
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (/[a-zA-Z0-9_.-]/.test(ch)) {
        id += this.advance();
      } else {
        break;
      }
    }
    return id;
  }
}

/**
 * Parses DOT and JSON representations of directed graphs.
 */
export class GraphParser {
  /**
   * Parses Graphviz DOT string into DirectedGraph using token scanner.
   */
  public static parseDOT(dotString: string, graphId: string = 'dot-graph'): DirectedGraph {
    if (!dotString || typeof dotString !== 'string' || !dotString.trim()) {
      throw new Error('DOT input must be a non-empty string.');
    }

    const lexer = new DotLexer(dotString);
    const tokens = lexer.tokenize();
    let current = 0;

    function peek(): Token {
      return tokens[current] ?? { type: 'EOF', value: '', line: 0, column: 0 };
    }

    function consume(expected?: TokenType): Token {
      const tok = peek();
      if (expected && tok.type !== expected) {
        throw new Error(
          `Syntax error at line ${tok.line}, column ${tok.column}: expected "${expected}" but got "${tok.type}" (${tok.value})`
        );
      }
      current++;
      return tok;
    }

    // Optional "strict"
    if (peek().type === 'STRICT') {
      consume('STRICT');
    }

    // Check for undirected graph rejection
    if (peek().type === 'GRAPH') {
      const gTok = consume('GRAPH');
      throw new Error(
        `Syntax error at line ${gTok.line}, column ${gTok.column}: Undirected graphs ('graph') are not supported. Please use 'digraph'.`
      );
    }

    consume('DIGRAPH');

    let graphName = graphId;
    if (peek().type === 'IDENTIFIER') {
      graphName = consume('IDENTIFIER').value;
    }

    consume('LBRACE');

    const metadata: GraphMetadata = {
      id: graphId,
      name: graphName || 'Imported DOT Graph'
    };

    const graph = new DirectedGraph(metadata);
    const nodesMap = new Map<string, GraphNode>();
    const edgesList: GraphEdge[] = [];
    let edgeCounter = 1;

    function parseAttributeBlock(): Record<string, string> {
      const attrs: Record<string, string> = {};
      consume('LBRACKET');
      while (peek().type !== 'RBRACKET' && peek().type !== 'EOF') {
        const keyTok = consume('IDENTIFIER');
        const key = keyTok.value;
        let val = '';
        if (peek().type === 'EQUALS') {
          consume('EQUALS');
          const valTok = consume('IDENTIFIER');
          val = valTok.value;
        } else {
          val = 'true';
        }
        attrs[key] = val;

        // Skip optional comma or semicolon
        if (peek().type === 'COMMA' || peek().type === 'SEMICOLON') {
          consume();
        }
      }
      consume('RBRACKET');
      return attrs;
    }

    while (peek().type !== 'RBRACE' && peek().type !== 'EOF') {
      const tok = peek();

      // Semicolon separator
      if (tok.type === 'SEMICOLON') {
        consume('SEMICOLON');
        continue;
      }

      // Reject subgraphs
      if (tok.type === 'SUBGRAPH') {
        throw new Error(
          `Unsupported DOT feature at line ${tok.line}, column ${tok.column}: subgraphs are not supported. Please declare nodes and edges directly.`
        );
      }

      // Global graph/node/edge attribute blocks: graph [...] / node [...] / edge [...]
      if (tok.type === 'GRAPH' || tok.type === 'NODE_KW' || tok.type === 'EDGE_KW') {
        consume();
        if (peek().type === 'LBRACKET') {
          parseAttributeBlock();
        }
        continue;
      }

      // Reject undirected edge --
      if (tok.type === 'DASH_DASH') {
        throw new Error(
          `Syntax error at line ${tok.line}, column ${tok.column}: Undirected edges ('--') are not supported in digraphs. Please use '->'.`
        );
      }

      // Must be an identifier for node or edge statement
      if (tok.type === 'IDENTIFIER') {
        const firstNode = consume('IDENTIFIER').value;

        // Edge statement chain: A -> B (-> C ...)*
        if (peek().type === 'ARROW') {
          const nodeChain = [firstNode];
          while (peek().type === 'ARROW') {
            consume('ARROW');
            const nextNode = consume('IDENTIFIER').value;
            nodeChain.push(nextNode);
          }

          let edgeAttrs: Record<string, string> = {};
          if (peek().type === 'LBRACKET') {
            edgeAttrs = parseAttributeBlock();
          }

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
            const geomVar = edgeAttrs.geometryVariation as EdgeGeometryVariation | undefined;
            const edgePresentation: EdgePresentation | undefined =
              edgeAttrs.geometryVariation || edgeAttrs.style || edgeAttrs.color
                ? {
                    lineStyle: edgeAttrs.style as any,
                    strokeColor: edgeAttrs.color,
                    geometryVariation: geomVar,
                    ariaDescription: edgeAttrs.description
                  }
                : undefined;

            edgesList.push({
              id: edgeId,
              source,
              target,
              label: edgeAttrs.label,
              category: edgeAttrs.category,
              presentation: edgePresentation,
              metadata: edgeAttrs
            });
          }
        } else {
          // Node statement: A [attrs] or simply A
          let nodeAttrs: Record<string, string> = {};
          if (peek().type === 'LBRACKET') {
            nodeAttrs = parseAttributeBlock();
          }

          const existing = nodesMap.get(firstNode);
          const rawShape =
            nodeAttrs.shape ||
            (existing?.presentation?.originalDeclaredShape as string | undefined) ||
            (existing?.presentation?.shape as string | undefined);
          const normalized = rawShape ? normalizeShape(rawShape) : undefined;
          const nodePresentation: NodePresentation | undefined = normalized
            ? {
                shape: normalized.shape,
                originalDeclaredShape: normalized.originalDeclaredShape,
                isFallback: normalized.isFallback,
                fallbackReason: normalized.fallbackReason,
                fillColor: nodeAttrs.fillcolor || nodeAttrs.color || existing?.presentation?.fillColor,
                strokeColor: nodeAttrs.bordercolor || nodeAttrs.color || existing?.presentation?.strokeColor,
                strokeStyle: (nodeAttrs.style as any) || existing?.presentation?.strokeStyle,
                ariaDescription: nodeAttrs.description || existing?.presentation?.ariaDescription
              }
            : existing?.presentation;

          nodesMap.set(firstNode, {
            id: firstNode,
            label: nodeAttrs.label || existing?.label || firstNode,
            category: nodeAttrs.category || existing?.category,
            presentation: nodePresentation,
            metadata: { ...(existing?.metadata ?? {}), ...nodeAttrs }
          });
        }
      } else {
        throw new Error(
          `Unexpected token "${tok.value}" (${tok.type}) in DOT statement at line ${tok.line}, column ${tok.column}`
        );
      }
    }

    consume('RBRACE');

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
      const exportedShape = (node.presentation?.isFallback && node.presentation?.originalDeclaredShape) ? node.presentation.originalDeclaredShape : (node.presentation?.shape || node.presentation?.originalDeclaredShape);
      if (exportedShape) {
        attrs.push(`shape="${exportedShape.replace(/"/g, '\\"')}"`);
      }
      if (node.presentation?.fillColor) {
        attrs.push(`fillcolor="${node.presentation.fillColor.replace(/"/g, '\\"')}"`);
      }
      if (node.presentation?.strokeColor) {
        attrs.push(`color="${node.presentation.strokeColor.replace(/"/g, '\\"')}"`);
      }
      if (node.presentation?.strokeStyle) {
        attrs.push(`style="${node.presentation.strokeStyle.replace(/"/g, '\\"')}"`);
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
      if (edge.presentation?.geometryVariation) {
        attrs.push(`geometryVariation="${edge.presentation.geometryVariation}"`);
      }
      if (edge.presentation?.lineStyle) {
        attrs.push(`style="${edge.presentation.lineStyle}"`);
      }
      if (edge.presentation?.strokeColor) {
        attrs.push(`color="${edge.presentation.strokeColor}"`);
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
}
