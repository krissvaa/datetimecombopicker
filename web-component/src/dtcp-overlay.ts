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
    /* Size the popup by its content instead of stretching to the viewport;
       scroll when the viewport clamps it (field mid-screen in a short window) */
    flex: none;
    height: auto;
    max-height: 100%;
    overflow: auto;
    -webkit-tap-highlight-color: transparent;
  }

  [part~='content'] {
    flex: auto;
  }

  :host([top-aligned]) [part~='overlay'] {
    margin-top: var(--vaadin-gap-xs, 4px);
  }

  :host([bottom-aligned]) [part~='overlay'] {
    margin-bottom: var(--vaadin-gap-xs, 4px);
  }

  /* Fullscreen (mobile): bottom sheet with a backdrop. The position mixin
     is disabled in this state (see _updatePosition), so plain rules
     suffice: no inline popup-anchoring styles compete with them. */
  :host([fullscreen]) {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-end;
    padding: 0;
  }

  :host([fullscreen]) [part='overlay'] {
    width: 100%;
    max-height: 80vh;
    margin: 0;
    border-radius: var(--vaadin-radius-l, 0.75em) var(--vaadin-radius-l, 0.75em) 0 0;
  }

  /* Scroll inside the sheet when the content is taller than the 80vh cap
     (e.g. the analog clock on a short viewport) */
  :host([fullscreen]) [part='content'] {
    overflow-y: auto;
    padding: 0;
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
   * Override a method from `PositionMixin`: while in fullscreen (mobile
   * bottom sheet) mode the stylesheet owns the layout, so skip the popup
   * anchoring — the mixin writes inline styles (top/left and flex
   * justification) on the host that would misplace the sheet. Any inline
   * styles written before entering fullscreen are dropped; the flip back
   * to a popup re-runs the anchoring on the next update.
   * @protected
   * @override
   */
  _updatePosition() {
    if (this.hasAttribute('fullscreen')) {
      for (const property of ['top', 'left', 'bottom', 'right', 'justify-content', 'align-items']) {
        this.style.removeProperty(property);
      }
      return;
    }
    // @ts-expect-error the mixin method is not exposed in the typings
    super._updatePosition();
  }

  /**
   * Override a method from `OverlayMixin`: clicks on the owning field (its
   * input or toggle button) are not "outside" — without this, a click on the
   * toggle would close-and-reopen the popup, and a click into the input to
   * edit the text would close it (discarding a staged selection).
   *
   * Only clicks that did NOT travel through this overlay count: in Vaadin
   * 25 the overlay renders inside the owner's shadow root (no more teleport
   * to body), so every click in the popup — including the fullscreen
   * backdrop — has the owner in its composed path. The backdrop must still
   * close the sheet.
   * @protected
   * @override
   */
  _shouldCloseOnOutsideClick(event: Event): boolean {
    const path = event.composedPath();
    const owner = (this as any).owner;
    if (owner && path.includes(owner) && !path.includes(this)) {
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
