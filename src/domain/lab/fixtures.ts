import type { LabTestCase } from './types.js';

export const LAB_TEST_CASES: readonly LabTestCase[] = [
  // ----------------------------------------------------
  // Capability A: Shape Category Discrimination
  // ----------------------------------------------------
  {
    id: 'shape-discrim-01',
    category: 'shape_discrimination',
    title: 'Shape Discrimination: Trial 1',
    instructions:
      'Listen to Sound 1 and Sound 2 using the playback buttons. Determine whether both sounds represent the same visual shape category or different shape categories.',
    prompt: 'Do Sound 1 and Sound 2 represent the same shape category or different shape categories?',
    options: [
      { id: 'same_category', label: 'Same shape category' },
      { id: 'different_category', label: 'Different shape categories' }
    ],
    expectedAnswerId: 'same_category',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'circle',
      shape2: 'circle'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: '1', shape: 'circle', x: 80, y: 80 },
        { id: '2', label: '2', shape: 'circle', x: 200, y: 80 }
      ],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'shape-discrim-02',
    category: 'shape_discrimination',
    title: 'Shape Discrimination: Trial 2',
    instructions:
      'Listen to Sound 1 and Sound 2. Determine whether they represent the same shape category or different shape categories.',
    prompt: 'Do Sound 1 and Sound 2 represent the same shape category or different shape categories?',
    options: [
      { id: 'same_category', label: 'Same shape category' },
      { id: 'different_category', label: 'Different shape categories' }
    ],
    expectedAnswerId: 'different_category',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'circle',
      shape2: 'rectangle'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: '1', shape: 'circle', x: 80, y: 80 },
        { id: '2', label: '2', shape: 'rectangle', x: 200, y: 80 }
      ],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'shape-discrim-03',
    category: 'shape_discrimination',
    title: 'Shape Discrimination: Trial 3',
    instructions:
      'Listen to Sound 1 and Sound 2. Determine whether they represent the same shape category or different shape categories.',
    prompt: 'Do Sound 1 and Sound 2 represent the same shape category or different shape categories?',
    options: [
      { id: 'same_category', label: 'Same shape category' },
      { id: 'different_category', label: 'Different shape categories' }
    ],
    expectedAnswerId: 'different_category',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'rectangle',
      shape2: 'diamond'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: '1', shape: 'rectangle', x: 80, y: 80 },
        { id: '2', label: '2', shape: 'diamond', x: 200, y: 80 }
      ],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'shape-discrim-04',
    category: 'shape_discrimination',
    title: 'Shape Discrimination: Trial 4',
    instructions:
      'Listen to Sound 1 and Sound 2. Determine whether they represent the same shape category or different shape categories.',
    prompt: 'Do Sound 1 and Sound 2 represent the same shape category or different shape categories?',
    options: [
      { id: 'same_category', label: 'Same shape category' },
      { id: 'different_category', label: 'Different shape categories' }
    ],
    expectedAnswerId: 'same_category',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'diamond',
      shape2: 'diamond'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: '1', shape: 'diamond', x: 80, y: 80 },
        { id: '2', label: '2', shape: 'diamond', x: 200, y: 80 }
      ],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'shape-discrim-05',
    category: 'shape_discrimination',
    title: 'Shape Discrimination: Trial 5',
    instructions:
      'Listen to Sound 1 and Sound 2. Determine whether they represent the same shape category or different shape categories.',
    prompt: 'Do Sound 1 and Sound 2 represent the same shape category or different shape categories?',
    options: [
      { id: 'same_category', label: 'Same shape category' },
      { id: 'different_category', label: 'Different shape categories' }
    ],
    expectedAnswerId: 'same_category',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'rectangle',
      shape2: 'rectangle'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: '1', shape: 'rectangle', x: 80, y: 80 },
        { id: '2', label: '2', shape: 'rectangle', x: 200, y: 80 }
      ],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'shape-discrim-06',
    category: 'shape_discrimination',
    title: 'Shape Discrimination: Trial 6',
    instructions:
      'Listen to Sound 1 and Sound 2. Determine whether they represent the same shape category or different shape categories.',
    prompt: 'Do Sound 1 and Sound 2 represent the same shape category or different shape categories?',
    options: [
      { id: 'same_category', label: 'Same shape category' },
      { id: 'different_category', label: 'Different shape categories' }
    ],
    expectedAnswerId: 'different_category',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'circle',
      shape2: 'diamond'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: '1', shape: 'circle', x: 80, y: 80 },
        { id: '2', label: '2', shape: 'diamond', x: 200, y: 80 }
      ],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },

  // ----------------------------------------------------
  // Capability B: Shape Category Recognition
  // ----------------------------------------------------
  {
    id: 'shape-recog-01',
    category: 'shape_recognition',
    title: 'Shape Recognition: Trial 1',
    instructions:
      'Listen to the test sound. Based on the candidate shape timbres learned in training, identify which visual shape category this sound represents.',
    prompt: 'Which visual shape category does this sound represent?',
    options: [
      { id: 'circle_shape', label: 'Circle (pure sine wave)' },
      { id: 'rectangle_shape', label: 'Rectangle (triangle wave)' },
      { id: 'diamond_shape', label: 'Diamond (softened square wave)' }
    ],
    expectedAnswerId: 'circle_shape',
    soundStimulus: {
      type: 'single_shape',
      shape1: 'circle'
    },
    visualStimulus: {
      nodes: [{ id: '1', label: '1', shape: 'circle', x: 140, y: 80 }],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'shape-recog-02',
    category: 'shape_recognition',
    title: 'Shape Recognition: Trial 2',
    instructions:
      'Listen to the test sound and identify which visual shape category it represents.',
    prompt: 'Which visual shape category does this sound represent?',
    options: [
      { id: 'circle_shape', label: 'Circle (pure sine wave)' },
      { id: 'rectangle_shape', label: 'Rectangle (triangle wave)' },
      { id: 'diamond_shape', label: 'Diamond (softened square wave)' }
    ],
    expectedAnswerId: 'rectangle_shape',
    soundStimulus: {
      type: 'single_shape',
      shape1: 'rectangle'
    },
    visualStimulus: {
      nodes: [{ id: '1', label: '1', shape: 'rectangle', x: 140, y: 80 }],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'shape-recog-03',
    category: 'shape_recognition',
    title: 'Shape Recognition: Trial 3',
    instructions:
      'Listen to the test sound and identify which visual shape category it represents.',
    prompt: 'Which visual shape category does this sound represent?',
    options: [
      { id: 'circle_shape', label: 'Circle (pure sine wave)' },
      { id: 'rectangle_shape', label: 'Rectangle (triangle wave)' },
      { id: 'diamond_shape', label: 'Diamond (softened square wave)' }
    ],
    expectedAnswerId: 'diamond_shape',
    soundStimulus: {
      type: 'single_shape',
      shape1: 'diamond'
    },
    visualStimulus: {
      nodes: [{ id: '1', label: '1', shape: 'diamond', x: 140, y: 80 }],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },

  // ----------------------------------------------------
  // Capability C: Identity vs Category Testing
  // ----------------------------------------------------
  {
    id: 'identity-cat-01',
    category: 'identity_vs_category',
    title: 'Identity vs Category: Node A and Node B',
    instructions:
      'Listen to Sound 1 (Node A: "User Accounts") and Sound 2 (Node B: "Billing Service"). Both nodes visually appear as circles.',
    prompt:
      'Given that Node A and Node B produce the same intrinsic sound, what does this acoustic match convey under visual-auditory parity?',
    options: [
      {
        id: 'same_category_distinct_entities',
        label:
          'Both nodes belong to the same visual shape category (Circle), but remain distinct entities with independent labels'
      },
      {
        id: 'exact_same_entity',
        label: 'Both nodes are the exact same entity in the graph'
      },
      {
        id: 'cyclic_connection',
        label: 'A cyclic link exists between Node A and Node B'
      }
    ],
    expectedAnswerId: 'same_category_distinct_entities',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'circle',
      shape2: 'circle'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'User Accounts', shape: 'circle', x: 80, y: 80 },
        { id: 'B', label: 'Billing Service', shape: 'circle', x: 200, y: 80 }
      ],
      edges: []
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'identity-cat-02',
    category: 'identity_vs_category',
    title: 'Identity vs Category: Server Alpha and Database Omega',
    instructions:
      'Listen to Sound A (Node A: "Server Alpha", Circle) and Sound B (Node B: "Database Omega", Rectangle).',
    prompt: 'What does the acoustic difference between Sound A and Sound B convey?',
    options: [
      {
        id: 'different_categories',
        label:
          'Different visual shape categories (Circle vs Rectangle) for two distinct node entities'
      },
      {
        id: 'higher_priority',
        label: 'Node B has higher priority or rank than Node A'
      },
      {
        id: 'direct_connection',
        label: 'Node A directly connects to Node B'
      }
    ],
    expectedAnswerId: 'different_categories',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'circle',
      shape2: 'rectangle'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'Server Alpha', shape: 'circle', x: 80, y: 80 },
        { id: 'B', label: 'Database Omega', shape: 'rectangle', x: 200, y: 80 }
      ],
      edges: []
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'identity-cat-03',
    category: 'identity_vs_category',
    title: 'Identity vs Category: Cache Cluster and Analytics Engine',
    instructions:
      'Node B is "Cache Cluster" and Node C is "Analytics Engine", both rectangles. Listen to both sounds.',
    prompt: 'What does the acoustic match between B and C indicate?',
    options: [
      {
        id: 'same_category_distinct_entities',
        label:
          'Same visual shape category (Rectangle) with independent node identities identified by their screen-reader labels'
      },
      {
        id: 'exact_same_entity',
        label: 'Node B and Node C are identical nodes with identical connections'
      },
      {
        id: 'bidirectional_edge',
        label: 'A bidirectional edge exists between B and C'
      }
    ],
    expectedAnswerId: 'same_category_distinct_entities',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'rectangle',
      shape2: 'rectangle'
    },
    visualStimulus: {
      nodes: [
        { id: 'B', label: 'Cache Cluster', shape: 'rectangle', x: 80, y: 80 },
        { id: 'C', label: 'Analytics Engine', shape: 'rectangle', x: 200, y: 80 }
      ],
      edges: []
    },
    supportsPerceivedMeaning: true
  },

  // ----------------------------------------------------
  // Capability D: Perceived Hierarchy Testing
  // ----------------------------------------------------
  {
    id: 'perceived-hier-01',
    category: 'perceived_hierarchy',
    title: 'Perceived Hierarchy: Circle vs Rectangle',
    instructions:
      'Listen to Sound 1 (Circle) and Sound 2 (Rectangle). Both are played at 300 Hz carrier frequency.',
    prompt:
      'Comparing Sound 1 and Sound 2, does either sound feel more important, dominant, or higher in status, or do they feel like neutral peers?',
    options: [
      {
        id: 'neutral_peers',
        label: 'Perceptually neutral peers (neither implies higher status or priority)'
      },
      {
        id: 'sound1_dominant',
        label: 'Sound 1 feels higher, more important, or higher priority'
      },
      {
        id: 'sound2_dominant',
        label: 'Sound 2 feels higher, more important, or higher priority'
      }
    ],
    expectedAnswerId: 'neutral_peers',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'circle',
      shape2: 'rectangle'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: '1', shape: 'circle', x: 80, y: 80 },
        { id: '2', label: '2', shape: 'rectangle', x: 200, y: 80 }
      ],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'perceived-hier-02',
    category: 'perceived_hierarchy',
    title: 'Perceived Hierarchy: Circle vs Diamond',
    instructions:
      'Listen to Sound 1 (Circle) and Sound 2 (Diamond softened square wave at 300 Hz).',
    prompt:
      'Comparing Sound 1 and Sound 2, does either sound convey an unintended hierarchical rank?',
    options: [
      {
        id: 'neutral_peers',
        label: 'Perceptually neutral peers (different categories without rank)'
      },
      {
        id: 'sound1_dominant',
        label: 'Sound 1 feels dominant or higher rank'
      },
      {
        id: 'sound2_dominant',
        label: 'Sound 2 feels dominant or higher rank'
      }
    ],
    expectedAnswerId: 'neutral_peers',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'circle',
      shape2: 'diamond'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: '1', shape: 'circle', x: 80, y: 80 },
        { id: '2', label: '2', shape: 'diamond', x: 200, y: 80 }
      ],
      edges: [],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },

  // ----------------------------------------------------
  // Capability E: Relationship & Direction Testing
  // ----------------------------------------------------
  {
    id: 'rel-dir-01',
    category: 'relationship_direction',
    title: 'Relationship Direction: Outgoing Connection',
    instructions:
      'Listen to the relationship direction cue between two nodes. Focus on the interval between tones.',
    prompt: 'Based on the direction audio cue, which connection direction is being communicated?',
    options: [
      {
        id: 'outgoing',
        label: 'Outgoing connection (departing from current node)'
      },
      {
        id: 'incoming',
        label: 'Incoming connection (entering into current node)'
      },
      {
        id: 'bidirectional',
        label: 'Bidirectional link'
      }
    ],
    expectedAnswerId: 'outgoing',
    soundStimulus: {
      type: 'edge_journey',
      shape1: 'circle',
      shape2: 'circle',
      direction: 'outgoing'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A', shape: 'circle', x: 70, y: 80 },
        { id: 'B', label: 'B', shape: 'circle', x: 210, y: 80 }
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', direction: 'outgoing', geometryVariation: 'straight' }
      ],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'rel-dir-02',
    category: 'relationship_direction',
    title: 'Relationship Direction: Incoming Connection',
    instructions:
      'Listen to the relationship sound journey for the reverse direction. Notice the inverted interval.',
    prompt: 'Based on the direction audio cue, which connection direction is being communicated?',
    options: [
      {
        id: 'incoming',
        label: 'Incoming connection (entering into current node)'
      },
      {
        id: 'outgoing',
        label: 'Outgoing connection (departing from current node)'
      },
      {
        id: 'bidirectional',
        label: 'Bidirectional link'
      }
    ],
    expectedAnswerId: 'incoming',
    soundStimulus: {
      type: 'edge_journey',
      shape1: 'circle',
      shape2: 'circle',
      direction: 'incoming'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A', shape: 'circle', x: 70, y: 80 },
        { id: 'B', label: 'B', shape: 'circle', x: 210, y: 80 }
      ],
      edges: [
        { id: 'e2', source: 'B', target: 'A', direction: 'incoming', geometryVariation: 'straight' }
      ],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },

  // ----------------------------------------------------
  // Capability F: Shape Independence Testing
  // ----------------------------------------------------
  {
    id: 'shape-indep-01',
    category: 'shape_independence',
    title: 'Shape Independence: Target Shape Variation',
    instructions:
      'Compare an outgoing edge A → B where B is a Circle, versus A → B where B is changed to a Rectangle.',
    prompt:
      'When target Node B changes its visual shape from Circle to Rectangle, what happens to the directed relationship cue between A and B?',
    options: [
      {
        id: 'unchanged_relationship',
        label:
          "The directed relationship cue remains completely unchanged; only B's intrinsic category sound changes"
      },
      {
        id: 'direction_inverted',
        label: 'The directed relationship cue changes its direction and pitch'
      },
      {
        id: 'warning_replaced',
        label: 'The relationship is replaced by a warning tone'
      }
    ],
    expectedAnswerId: 'unchanged_relationship',
    soundStimulus: {
      type: 'edge_journey',
      shape1: 'circle',
      shape2: 'rectangle',
      direction: 'outgoing'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A', shape: 'circle', x: 70, y: 80 },
        { id: 'B', label: 'B', shape: 'rectangle', x: 210, y: 80 }
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', direction: 'outgoing', geometryVariation: 'straight' }
      ]
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'shape-indep-02',
    category: 'shape_independence',
    title: 'Shape Independence: Target Diamond Variation',
    instructions:
      'Now target Node B is a Diamond. Listen to the edge journey A (Circle) → B (Diamond).',
    prompt:
      'Does changing the target node shape alter the acoustic definition of an outgoing connection?',
    options: [
      {
        id: 'orthogonal_independent',
        label: 'No, node shape and connection properties remain strictly orthogonal and independent'
      },
      {
        id: 'connection_inverted',
        label: 'Yes, the connection becomes an incoming connection'
      },
      {
        id: 'duration_doubled',
        label: 'Yes, the connection duration doubles'
      }
    ],
    expectedAnswerId: 'orthogonal_independent',
    soundStimulus: {
      type: 'edge_journey',
      shape1: 'circle',
      shape2: 'diamond',
      direction: 'outgoing'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A', shape: 'circle', x: 70, y: 80 },
        { id: 'B', label: 'B', shape: 'diamond', x: 210, y: 80 }
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', direction: 'outgoing', geometryVariation: 'straight' }
      ]
    },
    supportsPerceivedMeaning: true
  },

  // ----------------------------------------------------
  // Capability G: Geometry Invariance Testing
  // ----------------------------------------------------
  {
    id: 'geom-invar-01',
    category: 'geometry_invariance',
    title: 'Geometry Invariance: Straight vs Curved Arrow',
    instructions:
      'A diagram designer changes a straight arrow A → B to a curved decorative spline to route around another object. Topological connectivity is unchanged.',
    prompt:
      'According to Governing Rule D, how should the relationship sound change when a decorative line bend is added without semantic change?',
    options: [
      {
        id: 'invariant_sound',
        label:
          'The sound must remain identical because decorative geometry does not alter topological semantics'
      },
      {
        id: 'curved_pitch_bend',
        label: 'The sound should introduce a curved pitch bend matching the line angle'
      },
      {
        id: 'volume_increase',
        label: 'The sound should increase in volume'
      }
    ],
    expectedAnswerId: 'invariant_sound',
    soundStimulus: {
      type: 'edge_journey',
      shape1: 'circle',
      shape2: 'circle',
      direction: 'outgoing'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A', shape: 'circle', x: 60, y: 80 },
        { id: 'B', label: 'B', shape: 'circle', x: 220, y: 80 }
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', direction: 'outgoing', geometryVariation: 'curved' }
      ],
      decorativeNote: 'Curved bezier path rendering'
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'geom-invar-02',
    category: 'geometry_invariance',
    title: 'Geometry Invariance: Orthogonal Step Bend',
    instructions:
      'The connection A → B is rendered with an orthogonal step bend (Manhattan routing).',
    prompt:
      'Does the 90-degree step bend invent new auditory events or pitch changes?',
    options: [
      {
        id: 'invariant_sound',
        label:
          'No, topological relationship cues remain invariant to drawing style and routing bends'
      },
      {
        id: 'corner_clicks',
        label: 'Yes, two click sounds are added at each 90-degree corner'
      },
      {
        id: 'carrier_drop',
        label: 'Yes, the step bend lowers the carrier frequency'
      }
    ],
    expectedAnswerId: 'invariant_sound',
    soundStimulus: {
      type: 'edge_journey',
      shape1: 'circle',
      shape2: 'rectangle',
      direction: 'outgoing'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A', shape: 'circle', x: 60, y: 50 },
        { id: 'B', label: 'B', shape: 'rectangle', x: 220, y: 110 }
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', direction: 'outgoing', geometryVariation: 'step' }
      ],
      decorativeNote: 'Orthogonal step bend routing'
    },
    supportsPerceivedMeaning: true
  },

  // ----------------------------------------------------
  // Capability H: Destination Recognition
  // ----------------------------------------------------
  {
    id: 'dest-recog-01',
    category: 'destination_recognition',
    title: 'Destination Recognition: Journey to Node B',
    instructions:
      'Listen to the complete connection journey departing from Node A (Circle). Based on the arrival tone, determine the visual shape of the reached destination.',
    prompt: 'What visual shape category was reached at the destination?',
    options: [
      { id: 'diamond_destination', label: 'Diamond (softened square wave)' },
      { id: 'circle_destination', label: 'Circle (pure sine wave)' },
      { id: 'rectangle_destination', label: 'Rectangle (triangle wave)' }
    ],
    expectedAnswerId: 'diamond_destination',
    soundStimulus: {
      type: 'edge_journey',
      shape1: 'circle',
      shape2: 'diamond',
      direction: 'outgoing'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A', shape: 'circle', x: 70, y: 80 },
        { id: 'B', label: 'B', shape: 'diamond', x: 210, y: 80 }
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', direction: 'outgoing', geometryVariation: 'straight' }
      ],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'dest-recog-02',
    category: 'destination_recognition',
    title: 'Destination Recognition: Journey to Node C',
    instructions:
      'Listen to the connection journey departing from Node A (Rectangle). Determine the destination shape.',
    prompt: 'What visual shape category was reached at the destination?',
    options: [
      { id: 'circle_destination', label: 'Circle (pure sine wave)' },
      { id: 'rectangle_destination', label: 'Rectangle (triangle wave)' },
      { id: 'diamond_destination', label: 'Diamond (softened square wave)' }
    ],
    expectedAnswerId: 'circle_destination',
    soundStimulus: {
      type: 'edge_journey',
      shape1: 'rectangle',
      shape2: 'circle',
      direction: 'outgoing'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A', shape: 'rectangle', x: 70, y: 80 },
        { id: 'B', label: 'B', shape: 'circle', x: 210, y: 80 }
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', direction: 'outgoing', geometryVariation: 'straight' }
      ],
      blindInAssessment: true
    },
    supportsPerceivedMeaning: true
  },

  // ----------------------------------------------------
  // Capability I: Perceived-Meaning Testing (Qualitative / Subjective)
  // ----------------------------------------------------
  {
    id: 'perceived-meaning-01',
    category: 'perceived_meaning',
    title: 'Perceived Meaning: Rectangle Triangle Tone',
    instructions:
      'Listen to the triangle-wave tone assigned to the Rectangle shape category. Consider what immediate impressions or associations this sound creates.',
    prompt: 'What did this sound suggest to you most strongly?',
    options: [
      { id: 'diff_category', label: 'Different category / type of object' },
      { id: 'high_priority', label: 'Higher importance, priority, or ranking' },
      { id: 'direction_flow', label: 'Direction, flow, or movement' },
      { id: 'greater_quantity', label: 'Greater quantity, magnitude, or size' },
      { id: 'no_meaning', label: 'No particular meaning' },
      { id: 'other', label: 'Other interpretation' }
    ],
    soundStimulus: {
      type: 'single_shape',
      shape1: 'rectangle'
    },
    visualStimulus: {
      nodes: [{ id: 'R', label: 'R', shape: 'rectangle', x: 140, y: 80 }],
      edges: []
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'perceived-meaning-02',
    category: 'perceived_meaning',
    title: 'Perceived Meaning: Diamond Softened Square Tone',
    instructions:
      'Listen to the softened square-wave tone assigned to the Diamond shape category. Consider whether any unintended hierarchy or urgency is perceived.',
    prompt: 'What did this sound suggest to you most strongly?',
    options: [
      { id: 'diff_category', label: 'Different category / type of object' },
      { id: 'high_priority', label: 'Higher importance, priority, or ranking' },
      { id: 'direction_flow', label: 'Direction, flow, or movement' },
      { id: 'greater_quantity', label: 'Greater quantity, magnitude, or size' },
      { id: 'no_meaning', label: 'No particular meaning' },
      { id: 'other', label: 'Other interpretation' }
    ],
    soundStimulus: {
      type: 'single_shape',
      shape1: 'diamond'
    },
    visualStimulus: {
      nodes: [{ id: 'D', label: 'D', shape: 'diamond', x: 140, y: 80 }],
      edges: []
    },
    supportsPerceivedMeaning: true
  }
];
