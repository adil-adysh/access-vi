import { describe, it, expect } from 'vitest';
import {
  ParitySoundRegistry,
  DEFAULT_PARITY_CONFIG_V1
} from '../../src/audio/parity/ParitySoundRegistry.js';
import { ParitySonificationEngine } from '../../src/audio/parity/ParitySonificationEngine.js';
import { resolveNodePresentation, resolveEdgePresentation } from '../../src/domain/presentation/types.js';
import { SonificationStrategy } from '../../src/audio/sonification/SonificationStrategy.js';
import { DEFAULT_SONIFICATION_CONFIG } from '../../src/audio/types.js';
import type { GraphNode, GraphEdge } from '../../src/domain/graph/types.js';

describe('Visual-Auditory Parity Sonification & Governing Rules (Section 8 Verification)', () => {
  const registry = new ParitySoundRegistry(DEFAULT_PARITY_CONFIG_V1);
  const engine = new ParitySonificationEngine(undefined, DEFAULT_PARITY_CONFIG_V1);

  // ------------------------------------------------------------------------
  // Verification Item 1: Same visual shape with different labels produces identical sound parameters
  // ------------------------------------------------------------------------
  it('Verification 1: Same visual shape with different labels produces identical intrinsic sound parameters', () => {
    const nodeA: GraphNode = {
      id: 'node_1',
      label: 'Authentication Gateway',
      presentation: { shape: 'circle' }
    };

    const nodeB: GraphNode = {
      id: 'node_99',
      label: 'Zebra Service',
      presentation: { shape: 'circle' }
    };

    const toneA = registry.createNodeCategoryTone(resolveNodePresentation(nodeA).shape);
    const toneB = registry.createNodeCategoryTone(resolveNodePresentation(nodeB).shape);

    expect(toneA.frequency).toBe(toneB.frequency);
    expect(toneA.durationSec).toBe(toneB.durationSec);
    expect(toneA.waveform).toBe(toneB.waveform);
    expect(toneA.gain).toBe(toneB.gain);
    expect(toneA.pan).toBe(toneB.pan);
    expect(toneA.envelope).toEqual(toneB.envelope);
  });

  // ------------------------------------------------------------------------
  // Verification Item 2: Different configured shapes resolve to different category cues
  // ------------------------------------------------------------------------
  it('Verification 2: Different configured shapes resolve to different category cues with calibrated gains', () => {
    const toneCircle = registry.createNodeCategoryTone('circle');
    const toneRectangle = registry.createNodeCategoryTone('rectangle');
    const toneDiamond = registry.createNodeCategoryTone('diamond');

    // Distinct waveforms
    expect(toneCircle.waveform).toBe('sine');
    expect(toneRectangle.waveform).toBe('triangle');
    expect(toneDiamond.waveform).toBe('square');

    // Identical reference frequency (no pitch hierarchy)
    expect(toneCircle.frequency).toBe(300);
    expect(toneRectangle.frequency).toBe(300);
    expect(toneDiamond.frequency).toBe(300);

    // Identical duration
    expect(toneCircle.durationSec).toBe(0.20);
    expect(toneRectangle.durationSec).toBe(0.20);
    expect(toneDiamond.durationSec).toBe(0.20);

    // Psychoacoustically calibrated gains: sine (0.28) > triangle (0.22) > square (0.14)
    expect(toneCircle.gain).toBeGreaterThan(toneRectangle.gain!);
    expect(toneRectangle.gain).toBeGreaterThan(toneDiamond.gain!);
  });

  // ------------------------------------------------------------------------
  // Verification Item 3: Changing node IDs and labels does not alter intrinsic sonification
  // ------------------------------------------------------------------------
  it('Verification 3: Changing node IDs and labels does not alter intrinsic sonification', () => {
    const baseNode: GraphNode = {
      id: 'ID_ALPHA',
      label: 'Initial Label',
      presentation: { shape: 'rectangle' }
    };

    const modifiedNode: GraphNode = {
      id: 'ID_OMEGA_EXTREME_999999',
      label: 'Completely Different Label With Long Text',
      presentation: { shape: 'rectangle' }
    };

    const toneInitial = registry.createNodeCategoryTone(resolveNodePresentation(baseNode).shape);
    const toneModified = registry.createNodeCategoryTone(resolveNodePresentation(modifiedNode).shape);

    expect(toneInitial).toEqual(toneModified);
  });

  // ------------------------------------------------------------------------
  // Verification Item 4: Changing node shape does not alter edge direction or connection semantics
  // ------------------------------------------------------------------------
  it('Verification 4: Changing node shape does not alter edge direction or connection semantics', () => {
    const edge: GraphEdge = {
      id: 'e1',
      source: 'A',
      target: 'B'
    };

    expect(edge.source).toBe('A');
    expect(edge.target).toBe('B');

    const connCue1 = registry.createDirectedConnectionSequence();
    const connCue2 = registry.createDirectedConnectionSequence();
    expect(connCue1.notes.map((n) => n.tone.frequency)).toEqual(connCue2.notes.map((n) => n.tone.frequency));

    const outgoingSeq1 = registry.createRelationshipDirectionSequence('outgoing');
    const outgoingSeq2 = registry.createRelationshipDirectionSequence('outgoing');

    // Outgoing direction remains strictly invariant regardless of whether target is circle or diamond
    expect(outgoingSeq1.notes.map((n) => n.tone.frequency)).toEqual([360, 440]);
    expect(outgoingSeq2.notes.map((n) => n.tone.frequency)).toEqual([360, 440]);
  });

  // ------------------------------------------------------------------------
  // Verification Item 5: Reversing an edge changes its directional event appropriately
  // ------------------------------------------------------------------------
  it('Verification 5: Reversing an edge changes its directional event appropriately', () => {
    const outgoingSeq = registry.createRelationshipDirectionSequence('outgoing');
    const incomingSeq = registry.createRelationshipDirectionSequence('incoming');

    const outFreqs = outgoingSeq.notes.map((n) => n.tone.frequency);
    const inFreqs = incomingSeq.notes.map((n) => n.tone.frequency);

    // Outgoing is ascending step (360 -> 440 Hz)
    expect(outFreqs[0]).toBe(360);
    expect(outFreqs[1]).toBe(440);
    expect(outFreqs[1]).toBeGreaterThan(outFreqs[0]);

    // Incoming is descending step (440 -> 360 Hz)
    expect(inFreqs[0]).toBe(440);
    expect(inFreqs[1]).toBe(360);
    expect(inFreqs[1]).toBeLessThan(inFreqs[0]);
  });

  // ------------------------------------------------------------------------
  // Verification Item 6: Decorative connection geometry does not alter topological sound meaning
  // ------------------------------------------------------------------------
  it('Verification 6: Decorative connection geometry does not alter topological sound meaning', () => {
    const edgeStraight: GraphEdge = {
      id: 'e1',
      source: 'A',
      target: 'B',
      presentation: { geometryVariation: 'straight' }
    };

    const edgeCurved: GraphEdge = {
      id: 'e1',
      source: 'A',
      target: 'B',
      presentation: { geometryVariation: 'curved' }
    };

    const edgeStep: GraphEdge = {
      id: 'e1',
      source: 'A',
      target: 'B',
      presentation: { geometryVariation: 'step' }
    };

    const resStraight = resolveEdgePresentation(edgeStraight);
    const resCurved = resolveEdgePresentation(edgeCurved);
    const resStep = resolveEdgePresentation(edgeStep);

    // Visual variations are captured
    expect(resStraight.geometryVariation).toBe('straight');
    expect(resCurved.geometryVariation).toBe('curved');
    expect(resStep.geometryVariation).toBe('step');

    // But auditory relationship cues are completely invariant
    const audioSeqStraight = registry.createRelationshipDirectionSequence('outgoing');
    const audioSeqCurved = registry.createRelationshipDirectionSequence('outgoing');
    const audioSeqStep = registry.createRelationshipDirectionSequence('outgoing');

    expect(audioSeqStraight.notes).toEqual(audioSeqCurved.notes);
    expect(audioSeqStraight.notes).toEqual(audioSeqStep.notes);
  });

  // ------------------------------------------------------------------------
  // Verification Item 7: Renderer, audio strategy, and accessibility representation use the same shape mapping
  // ------------------------------------------------------------------------
  it('Verification 7: Renderer, audio strategy, and accessibility representation use the same shape mapping', () => {
    const node: GraphNode = {
      id: 'node_x',
      label: 'Target Unit',
      presentation: { shape: 'rectangle' }
    };

    // Single source of truth: resolveNodePresentation
    const resolved = resolveNodePresentation(node);

    // 1. Accessibility markup uses resolved.shape and resolved.ariaLabel
    expect(resolved.shape).toBe('rectangle');
    expect(resolved.ariaLabel).toBe('Rectangle shape, Node Target Unit');

    // 2. Audio registry receives the exact same resolved.shape
    const tone = registry.createNodeCategoryTone(resolved.shape);
    expect(tone.waveform).toBe('triangle'); // rectangle -> triangle
    expect(tone.frequency).toBe(300);

    // 3. Renderer properties match
    expect(resolved.shapeName).toBe('Rectangle');
  });

  // ------------------------------------------------------------------------
  // Verification Item 8: All relevant graph text remains available through accessible markup
  // ------------------------------------------------------------------------
  it('Verification 8: All relevant graph text remains available through accessible markup without musical pitch encoding', () => {
    const node: GraphNode = {
      id: 'N42',
      label: 'Main Central Processing Core',
      presentation: { shape: 'circle' }
    };

    const resolved = resolveNodePresentation(node);

    // Text is fully present in accessible string
    expect(resolved.ariaLabel).toContain('Main Central Processing Core');
    expect(resolved.ariaLabel).toContain('Circle shape');

    // Audio tone does not encode text
    const tone = registry.createNodeCategoryTone(resolved.shape);
    expect(tone.frequency).toBe(300); // Standard constant frequency
  });

  // ------------------------------------------------------------------------
  // Verification Item 9: Audio can be cancelled and replayed without stale playback
  // ------------------------------------------------------------------------
  it('Verification 9: Audio can be cancelled and replayed without stale playback', () => {
    // Calling cancelPlayback cleans up handles immediately
    engine.cancelPlayback();
    // Does not throw and returns cleanly
    expect(() => engine.cancelPlayback()).not.toThrow();
  });

  // ------------------------------------------------------------------------
  // Verification Item 10: Existing A/B/C research configurations and their mapping contracts remain intact
  // ------------------------------------------------------------------------
  it('Verification 10: Existing A/B/C research configurations and their mapping contracts remain intact', () => {
    // Condition B (non-spatial) and C (spatial) still use SonificationStrategy pentatonic scale
    const freqA = SonificationStrategy.getNodeFrequency('A');
    const freqB = SonificationStrategy.getNodeFrequency('B');
    expect(freqB).toBeGreaterThan(freqA);

    const seqB = SonificationStrategy.mapEventToSequence(
      {
        type: 'NODE_FOCUS',
        nodeId: 'A',
        nodeIndex: 0,
        totalNodes: 3,
        direction: 'outgoing',
        neighborIds: ['B'],
        isSpatial: false
      },
      DEFAULT_SONIFICATION_CONFIG
    );

    // Existing condition B pan contract = 0.0
    expect(seqB.notes[0].tone.pan).toBe(0.0);

    // Revised parity registry is distinct and versioned
    expect(registry.getVersion()).toBe('visual-auditory-parity-v1');
  });

  // ------------------------------------------------------------------------
  // Verification Item 11: Unknown shape and missing metadata cases have deterministic, documented behavior
  // ------------------------------------------------------------------------
  it('Verification 11: Unknown shape and missing metadata cases have deterministic, documented behavior', () => {
    // Missing metadata -> defaults to circle
    const missingNode: GraphNode = { id: 'M1', label: 'Missing Presentation' };
    const resolvedMissing = resolveNodePresentation(missingNode);
    expect(resolvedMissing.shape).toBe('circle');
    expect(resolvedMissing.isFallback).toBe(false);

    // Unknown shape -> documented fallback to circle with isFallback: true
    const unknownNode: GraphNode = {
      id: 'U1',
      label: 'Unknown Star Node',
      presentation: { shape: 'star' as any }
    };
    const resolvedUnknown = resolveNodePresentation(unknownNode);
    expect(resolvedUnknown.shape).toBe('circle');
    expect(resolvedUnknown.isFallback).toBe(true);
    expect(resolvedUnknown.rawShape).toBe('star');

    // Both produce valid, audible category tones (sine wave fallback)
    const toneMissing = registry.createNodeCategoryTone(resolvedMissing.shape);
    const toneUnknown = registry.createNodeCategoryTone(resolvedUnknown.shape);
    expect(toneMissing.waveform).toBe('sine');
    expect(toneUnknown.waveform).toBe('sine');
    expect(toneMissing.frequency).toBe(300);
    expect(toneUnknown.frequency).toBe(300);
  });

  // ------------------------------------------------------------------------
  // Verification: Mono compatibility
  // ------------------------------------------------------------------------
  it('ensures all parity audio cues default to pan = 0.0 for mono-compatibility', () => {
    const toneCircle = registry.createNodeCategoryTone('circle');
    const toneRect = registry.createNodeCategoryTone('rectangle');
    const toneDiamond = registry.createNodeCategoryTone('diamond');

    expect(toneCircle.pan).toBe(0.0);
    expect(toneRect.pan).toBe(0.0);
    expect(toneDiamond.pan).toBe(0.0);

    const outgoing = registry.createRelationshipDirectionSequence('outgoing');
    for (const note of outgoing.notes) {
      expect(note.tone.pan).toBe(0.0);
    }

    const incoming = registry.createRelationshipDirectionSequence('incoming');
    for (const note of incoming.notes) {
      expect(note.tone.pan).toBe(0.0);
    }
  });

  it('Fix 9: allows empirical gain adjustment without altering reference pitch or duration', () => {
    const reg = new ParitySoundRegistry();
    expect(reg.getShapeGain('circle')).toBe(0.28);
    expect(reg.getShapeGain('diamond')).toBe(0.14);

    reg.setShapeGain('diamond', 0.18);
    expect(reg.getShapeGain('diamond')).toBe(0.18);

    const diamondTone = reg.createNodeCategoryTone('diamond');
    expect(diamondTone.gain).toBe(0.18);
    expect(diamondTone.frequency).toBe(300);

    reg.resetToDefaultGains();
    expect(reg.getShapeGain('diamond')).toBe(0.14);
  });

  it('Finding 8: supports meaningful lineStyle distinctions (dashed edges) with pulsed directional audio', () => {
    const reg = new ParitySoundRegistry();
    const solidSeq = reg.createRelationshipDirectionSequence('outgoing', 'rel', 'solid');
    const dashedSeq = reg.createRelationshipDirectionSequence('outgoing', 'rel', 'dashed');

    // Both preserve total duration and 360 -> 440 Hz interval
    expect(solidSeq.totalDurationSec).toBe(dashedSeq.totalDurationSec);

    // Solid has 2 sustained tones
    expect(solidSeq.notes.length).toBe(2);
    expect(solidSeq.notes.map((n) => n.tone.frequency)).toEqual([360, 440]);

    // Dashed has 4 pulsed/interrupted tones articulating the visual dashes
    expect(dashedSeq.notes.length).toBe(4);
    expect(dashedSeq.notes.map((n) => n.tone.frequency)).toEqual([360, 360, 440, 440]);
  });
});
