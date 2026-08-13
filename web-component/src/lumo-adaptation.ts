/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 */
import { css } from 'lit';

/**
 * Adds a style block to the document head. Equivalent to component-base's
 * `addGlobalStyles`, inlined because that module only exists from platform
 * 25.1.6 on — importing it broke apps on earlier 25.1 patches.
 */
function addGlobalStyles(id: string, styles: { toString(): string }): void {
  const styleTag = document.createElement('style');
  styleTag.id = id;
  styleTag.textContent = styles.toString();
  document.head.insertAdjacentElement('afterbegin', styleTag);
}

/**
 * Registers `<date-time-combo-picker>` with Vaadin's Lumo style-injection
 * mechanism, so the field picks up the same Lumo treatment as Vaadin's own
 * date picker whenever the Lumo theme stylesheet is present (and drops it
 * when the theme goes away).
 *
 * Only the tag-to-modules mapping is declared here — all listed modules
 * are the ones Lumo ships for `vaadin-date-picker`. They exist in the
 * document only while a Lumo stylesheet is loaded, which is what keeps
 * the injection Lumo-gated: LumoInjector injects whenever the mapped
 * modules resolve to rules, and re-evaluates on `--_lumo-<tag>-inject`
 * changes. The marker mirrors `vaadin-date-picker`'s (set to 1 by Lumo)
 * so those re-evaluations fire at the right moments without this
 * component ever loading Lumo code itself.
 */
addGlobalStyles(
  'dtcp-lumo-adaptation',
  css`
    :root {
      --_lumo-date-time-combo-picker-inject: var(--_lumo-vaadin-date-picker-inject, 0);
      --_lumo-date-time-combo-picker-inject-modules:
        lumo_mixins_field-label,
        lumo_mixins_field-required,
        lumo_mixins_field-error-message,
        lumo_mixins_field-button,
        lumo_mixins_field-helper,
        lumo_mixins_field-base,
        lumo_components_date-picker;
    }
  `,
);
