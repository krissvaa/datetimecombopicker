/**
 * Ambient declarations for Vaadin modules that ship without .d.ts files.
 */
declare module '@vaadin/overlay/src/vaadin-overlay-styles.js' {
  import type { CSSResultGroup } from 'lit';
  export const overlayStyles: CSSResultGroup;
}

declare module '@vaadin/vaadin-lumo-styles/font-icons.js';
