export interface KeyBinding {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly category: 'navigation' | 'audio' | 'information';
}

export const KEY_BINDINGS: KeyBinding[] = [
  {
    key: 'ArrowDown / J',
    label: 'Next Neighbor',
    description: 'Select next neighboring node in current direction',
    category: 'navigation'
  },
  {
    key: 'ArrowUp / K',
    label: 'Previous Neighbor',
    description: 'Select previous neighboring node in current direction',
    category: 'navigation'
  },
  {
    key: 'ArrowRight / Enter / Space',
    label: 'Traverse',
    description: 'Move into the currently selected neighbor',
    category: 'navigation'
  },
  {
    key: 'ArrowLeft / Backspace',
    label: 'Go Back',
    description: 'Return to the previously visited node in history',
    category: 'navigation'
  },
  {
    key: 'Home / H',
    label: 'Go to Start',
    description: 'Return directly to the initial starting node',
    category: 'navigation'
  },
  {
    key: 'D',
    label: 'Toggle Direction',
    description: 'Switch between outgoing and incoming connections',
    category: 'navigation'
  },
  {
    key: 'R',
    label: 'Replay Audio',
    description: 'Replay the auditory representation for the current node',
    category: 'audio'
  },
  {
    key: 'Escape',
    label: 'Cancel Audio',
    description: 'Immediately stop ongoing audio playback',
    category: 'audio'
  },
  {
    key: 'I',
    label: 'Inspect Node',
    description: 'Announce full exact connection details for current node',
    category: 'information'
  },
  {
    key: '? / K',
    label: 'Help',
    description: 'Announce keyboard shortcuts and navigation instructions',
    category: 'information'
  }
];
