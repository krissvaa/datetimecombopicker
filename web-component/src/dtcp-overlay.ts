/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 *
 * Composition modeled on vaadin-date-picker-overlay
 * (vaadin/web-components, Apache-2.0).
 */
import { css, html, LitElement } from 'lit';
import { defineCustomElement } from '@vaadin/component-base/src/define.js';
import { DirMixin } from '@vaadin/component-base/src/dir-mixin.js';
import { PolylitMixin } from '@vaadin/component-base/src/polylit-mixin.js';
import { OverlayMixin } from '@vaadin/overlay/src/vaadin-overlay-mixin.js';
import { PositionMixin } from '@vaadin/overlay/src/vaadin-overlay-position-mixin.js';
import { overlayStyles } from '@vaadin/overlay/src/styles/vaadin-overlay-base-styles.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';

const dtcpOverlayStyles = css`
  [part='overlay'] {
    display: flex;
    flex: auto;
  }

  [part~='content'] {
    flex: auto;
  }

  @media (forced-colors: active) {
    [part='overlay'] {
      outline: 3px solid;
    }
  }
`;

/**
 * `<dtcp-overlay>` is the popup used by `<date-time-combo-picker>`.
 * An internal element, not intended to be used separately.
 *
 * @private
 */
class DtcpOverlay extends PositionMixin(OverlayMixin(DirMixin(ThemableMixin(PolylitMixin(LitElement))))) {
  static get is() {
    return 'dtcp-overlay';
  }

  static get styles() {
    return [overlayStyles, dtcpOverlayStyles];
  }

  /**
   * Override a method from `OverlayMixin`: clicks on the owning field (its
   * input or toggle button) are not "outside" — without this, a click on the
   * toggle would close-and-reopen the popup, and a click into the input to
   * edit the text would close it (discarding a staged selection).
   * @protected
   * @override
   */
  _shouldCloseOnOutsideClick(event: Event): boolean {
    const path = event.composedPath();
    const owner = (this as any).owner;
    if (owner && path.includes(owner)) {
      return false;
    }
    return (super._shouldCloseOnOutsideClick as (event: Event) => boolean)(event);
  }

  /** @protected */
  render() {
    return html`
      <div id="backdrop" part="backdrop" ?hidden="${!(this as any).withBackdrop}"></div>
      <div part="overlay" id="overlay">
        <div part="content" id="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

defineCustomElement(DtcpOverlay);

export { DtcpOverlay };
