/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 *
 * Ambient declarations for Vaadin modules that ship without .d.ts files.
 */
declare module '@vaadin/overlay/src/styles/vaadin-overlay-base-styles.js' {
  import type { CSSResultGroup } from 'lit';
  export const overlayStyles: CSSResultGroup;
}

declare module '@vaadin/vaadin-themable-mixin/lumo-injection-mixin.js' {
  import type { Constructor } from '@open-wc/dedupe-mixin';
  // Adds no public API; static `lumoInjector` is loosely typed on purpose
  export function LumoInjectionMixin<T extends Constructor<object>>(base: T): T;
}

declare module '@vaadin/component-base/src/css-utils.js' {
  import type { CSSResultGroup } from 'lit';
  export function addGlobalStyles(id: string, ...styles: CSSResultGroup[]): void;
}

