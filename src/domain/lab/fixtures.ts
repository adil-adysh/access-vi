import type { LabTestCase } from './types.js';

export const LAB_TEST_CASES: readonly LabTestCase[] = [
  // ----------------------------------------------------
  // Capability A: Individual Shape Testing & Discrimination
  // ----------------------------------------------------
  {
    id: 'shape-discrim-01',
    category: 'shape_discrimination',
    title: 'Shape Discrimination: Trial 1',
    instructions:
      'Listen to Sound 1 and Sound 2 using the Play buttons. Determine whether both sounds represent the same visual shape category or different shape categories.',
    prompt: 'Do Sound 1 and Sound 2 represent the same shape category or different shape categories?',
    options: ['Same shape category', 'Different shape categories'],
    expectedAnswer: 'Same shape category',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'circle',
      shape2: 'circle'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: 'Shape 1', shape: 'circle', x: 80, y: 80 },
        { id: '2', label: 'Shape 2', shape: 'circle', x: 200, y: 80 }
      ],
      edges: []
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
    options: ['Same shape category', 'Different shape categories'],
    expectedAnswer: 'Different shape categories',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'circle',
      shape2: 'rectangle'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: 'Shape 1', shape: 'circle', x: 80, y: 80 },
        { id: '2', label: 'Shape 2', shape: 'rectangle', x: 200, y: 80 }
      ],
      edges: []
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
    options: ['Same shape category', 'Different shape categories'],
    expectedAnswer: 'Different shape categories',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'rectangle',
      shape2: 'diamond'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: 'Shape 1', shape: 'rectangle', x: 80, y: 80 },
        { id: '2', label: 'Shape 2', shape: 'diamond', x: 200, y: 80 }
      ],
      edges: []
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
    options: ['Same shape category', 'Different shape categories'],
    expectedAnswer: 'Same shape category',
    soundStimulus: {
      type: 'compare_shapes',
      shape1: 'diamond',
      shape2: 'diamond'
    },
    visualStimulus: {
      nodes: [
        { id: '1', label: 'Shape 1', shape: 'diamond', x: 80, y: 80 },
        { id: '2', label: 'Shape 2', shape: 'diamond', x: 200, y: 80 }
      ],
      edges: []
    },
    supportsPerceivedMeaning: true
  },

  // ----------------------------------------------------
  // Capability B: Identity vs Category Testing
  // ----------------------------------------------------
  {
    id: 'identity-cat-01',
    category: 'identity_vs_category',
    title: 'Identity vs Category: Circle A and Circle B',
    instructions:
      'Node A is labeled "User Accounts" and Node B is labeled "Billing Service". Both visually appear as circles. Listen to both node sounds and review their accessible labels.',
    prompt:
      'Given that Node A and Node B produce the same intrinsic sound, what does this sound convey according to visual-auditory parity?',
    options: [
      'Both nodes belong to the same visual shape category (Circle), but remain distinct entities identified by their labels',
      'Both nodes are the exact same entity in the graph',
      'The graph has a cyclic loop between A and B'
    ],
    expectedAnswer:
      'Both nodes belong to the same visual shape category (Circle), but remain distinct entities identified by their labels',
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
    title: 'Identity vs Category: Circle A and Rectangle B',
    instructions:
      'Node A is labeled "Server Alpha" (Circle) and Node B is labeled "Database Omega" (Rectangle). Listen to both sounds.',
    prompt: 'What does the difference between Sound A and Sound B convey?',
    options: [
      'Different visual shape categories (Circle vs Rectangle) for two distinct node entities',
      'Node B has higher priority or rank than Node A',
      'Node A connects to Node B'
    ],
    expectedAnswer:
      'Different visual shape categories (Circle vs Rectangle) for two distinct node entities',
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
    title: 'Identity vs Category: Rectangle B and Rectangle C',
    instructions:
      'Node B is labeled "Cache Cluster" and Node C is labeled "Analytics Engine", both rectangles. Listen to both sounds.',
    prompt: 'What does the acoustic match between B and C indicate?',
    options: [
      'Same visual shape category (Rectangle) with independent node identities identified by their screen-reader labels',
      'Node B and Node C are identical nodes with identical connections',
      'A bidirectional edge exists between B and C'
    ],
    expectedAnswer:
      'Same visual shape category (Rectangle) with independent node identities identified by their screen-reader labels',
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
  // Capability C: Relationship & Direction Testing
  // ----------------------------------------------------
  {
    id: 'rel-dir-01',
    category: 'relationship_direction',
    title: 'Directed Relationship: A → B',
    instructions:
      'Listen to the relationship sound journey from Node A (Circle) to Node B (Circle). Focus on the direction cue between the two shape sounds.',
    prompt: 'Which directed connection is communicated by this sound pattern?',
    options: [
      'Outgoing connection from A to B (A → B)',
      'Incoming connection from B into A (B → A)',
      'Undirected bidirectional link'
    ],
    expectedAnswer: 'Outgoing connection from A to B (A → B)',
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
      ]
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'rel-dir-02',
    category: 'relationship_direction',
    title: 'Directed Relationship: B → A',
    instructions:
      'Listen to the relationship sound journey for the reverse direction. Notice the inverted interval in the direction cue.',
    prompt: 'Which directed connection is communicated by this sound pattern?',
    options: [
      'Incoming connection from B into A (B → A)',
      'Outgoing connection from A to B (A → B)',
      'No relationship'
    ],
    expectedAnswer: 'Incoming connection from B into A (B → A)',
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
      ]
    },
    supportsPerceivedMeaning: true
  },
  {
    id: 'rel-dir-03',
    category: 'relationship_direction',
    title: 'Relationship Topology: Branching vs Convergence',
    instructions:
      'In a graph, Node A has outgoing connections to both Node B and Node C (A → B and A → C).',
    prompt:
      'Under Visual-Auditory Parity, how are endpoints B and C identified without assigning different musical pitches to their IDs?',
    options: [
      'Through NVDA screen-reader textual labels and semantic focus, while audio indicates identical outgoing directionality',
      'By giving Node B a high musical pitch and Node C a low musical pitch',
      'By synthesizing speech through Web Speech API over the sound'
    ],
    expectedAnswer:
      'Through NVDA screen-reader textual labels and semantic focus, while audio indicates identical outgoing directionality',
    soundStimulus: {
      type: 'direction_only',
      direction: 'outgoing'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A', shape: 'circle', x: 60, y: 80 },
        { id: 'B', label: 'B', shape: 'circle', x: 180, y: 40 },
        { id: 'C', label: 'C', shape: 'circle', x: 180, y: 120 }
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', direction: 'outgoing', geometryVariation: 'straight' },
        { id: 'e2', source: 'A', target: 'C', direction: 'outgoing', geometryVariation: 'straight' }
      ]
    },
    supportsPerceivedMeaning: false
  },

  // ----------------------------------------------------
  // Capability D: Shape Independence Testing
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
      'The directed relationship cue remains completely unchanged; only B\'s intrinsic category sound changes',
      'The directed relationship cue changes its direction and pitch',
      'The relationship is replaced by a warning tone'
    ],
    expectedAnswer:
      'The directed relationship cue remains completely unchanged; only B\'s intrinsic shape cue changes',
    soundStimulus: {
      type: 'edge_journey',
      shape1: 'circle',
      shape2: 'rectangle',
      direction: 'outgoing'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A (Circle)', shape: 'circle', x: 70, y: 80 },
        { id: 'B', label: 'B (Rectangle)', shape: 'rectangle', x: 210, y: 80 }
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
      'No, node shape and connection properties remain strictly orthogonal and independent',
      'Yes, the connection becomes an incoming connection',
      'Yes, the connection duration doubles'
    ],
    expectedAnswer:
      'No, node shape and connection properties remain strictly orthogonal and independent',
    soundStimulus: {
      type: 'edge_journey',
      shape1: 'circle',
      shape2: 'diamond',
      direction: 'outgoing'
    },
    visualStimulus: {
      nodes: [
        { id: 'A', label: 'A (Circle)', shape: 'circle', x: 70, y: 80 },
        { id: 'B', label: 'B (Diamond)', shape: 'diamond', x: 210, y: 80 }
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', direction: 'outgoing', geometryVariation: 'straight' }
      ]
    },
    supportsPerceivedMeaning: true
  },

  // ----------------------------------------------------
  // Capability E: Geometry Invariance Testing
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
      'The sound must remain identical because decorative geometry does not alter topological semantics',
      'The sound should introduce a curved pitch bend matching the line angle',
      'The sound should increase in volume'
    ],
    expectedAnswer:
      'The sound must remain identical because decorative geometry does not alter topological semantics',
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
      'No, topological relationship cues remain invariant to drawing style and routing bends',
      'Yes, two click sounds are added at each 90-degree corner',
      'Yes, the step bend lowers the carrier frequency'
    ],
    expectedAnswer:
      'No, topological relationship cues remain invariant to drawing style and routing bends',
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
  // Capability F: Perceived-Meaning Testing
  // ----------------------------------------------------
  {
    id: 'perceived-meaning-01',
    category: 'perceived_meaning',
    title: 'Perceived Meaning: Rectangle Triangle Tone',
    instructions:
      'Listen to the triangle-wave tone assigned to the Rectangle shape category. Consider what immediate impressions or associations this sound creates.',
    prompt: 'What did this sound suggest to you most strongly?',
    options: [
      'Different category / type of object',
      'Higher importance, priority, or ranking',
      'Direction, flow, or movement',
      'Greater quantity, magnitude, or size',
      'No particular meaning',
      'Other interpretation'
    ],
    soundStimulus: {
      type: 'single_shape',
      shape1: 'rectangle'
    },
    visualStimulus: {
      nodes: [{ id: 'R', label: 'Rectangle Node', shape: 'rectangle', x: 140, y: 80 }],
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
      'Different category / type of object',
      'Higher importance, priority, or ranking',
      'Direction, flow, or movement',
      'Greater quantity, magnitude, or size',
      'No particular meaning',
      'Other interpretation'
    ],
    soundStimulus: {
      type: 'single_shape',
      shape1: 'diamond'
    },
    visualStimulus: {
      nodes: [{ id: 'D', label: 'Diamond Node', shape: 'diamond', x: 140, y: 80 }],
      edges: []
    },
    supportsPerceivedMeaning: true
  }
];
