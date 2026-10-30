# Accessibility, NVDA and usability test plan

## Non-negotiable requirements

The browser app must support a complete nonvisual journey: choose graph, learn controls, explore, start/finish task, enter answer, review consent/settings, export and delete session. Every action needs a keyboard path and a discoverable accessible name. A sighted tester should not be required to interpret the interface.

Target first: **Windows 11 + Microsoft Edge + NVDA**. Also test browser variants when feasible. Automated checks are necessary but never equivalent to manual screen-reader verification.

## Keyboard behavior

- Start with native buttons, lists, forms, dialogs, and visible heading structure.
- Scope arrow-key graph traversal to an explicit focused explorer, not the whole page.
- Let Tab/Shift+Tab travel between controls; offer Escape/Stop/Back without traps.
- Keep current node and selected neighbor distinct from DOM focus and announce transitions deliberately.
- Provide keyboard help, shortcut conflict review, and a no-time-limit exploration mode.
- Do not override NVDA reading shortcuts while outside the explorer.

The WAI-ARIA application role changes how some screen readers interpret the page. Use only if a particular custom widget cannot be expressed with ordinary semantic controls; confine it to the narrowest container and verify manually [R7, R10].

## Speech and live regions

- Avoid speaking the same node twice via NVDA and browser speech.
- Prefer ordinary textual accessible names for standard UI; provide a dedicated status only for meaningful changes.
- Announce task prompts, errors and answer submission through a consistent strategy.
- Never rely on synthetic speech completion for elapsed-time measurement.
- Ensure typed-response fields retain predictable NVDA forms mode.

## Audio and sensory alternatives

- No audio until requested; user-controlled volume and immediate Stop.
- Comfortable calibration; no sharp transients or intentionally startling sounds.
- Non-spatial/mono playback must remain usable when stereo discrimination fails.
- Avoid absolute dependence on high frequencies or small pan differences.
- Clarify that alternate sensory modes may not be equivalent to a spatial experimental condition; use a transparent accommodation/exclusion policy.

## Manual checklist (record results with version/date)

1. Launch in Edge with NVDA; verify headings, buttons and first focus.
2. Navigate menus by keyboard; inspect help and enter explorer.
3. Explore incoming/outgoing edges; return to previous/start node; no focus traps.
4. Trigger and cancel each audio sequence; verify actual sound is distinct and repeatable.
5. Change condition A/B/C; ensure labels, information and navigation remain equivalent.
6. Begin/abort/resume task; enter and submit answers without a pointer.
7. Verify timeouts, error messages, imports, exports, deletion and consent UI.
8. Check live-region verbosity, NVDA/browse-mode conflicts, and edge navigation with both desktop and laptop keyboard layouts.
9. Confirm mono fallback, headphone channel swap, volume limit and keyboard Stop.
10. Re-test after any dependency, DOM or keyboard-state change.

## Automated tests

axe-core and Playwright: keyboard path, focus visibility, label associations, roles, form errors, dialog focus, tab order, no critical WCAG issues. Use accessibility snapshots where meaningful. Playwright does not validate audio perception or NVDA announcements; log manual outcomes separately.

References: [R7], [R9], [R10].
