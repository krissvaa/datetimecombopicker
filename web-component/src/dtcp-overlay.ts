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
    /* On platforms with space-consuming (classic) scrollbars, reserve the
       gutter up front: otherwise the vertical scrollbar of a clamped popup
       narrows the fixed-width content, which then overflows horizontally
       and adds a second scrollbar */
    scrollbar-gutter: stable;
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
  /** Shadow-root id map provided by PolylitMixin. */
  declare $: Record<string, HTMLElement>;

  declare fullscreen: boolean;

  static get is() {
    return 'dtcp-overlay';
  }

  static get styles() {
    return [overlayStyles, dtcpOverlayStyles];
  }

  static get properties() {
    return {
      /** Bottom-sheet (mobile) mode; set by the owner via the attribute. */
      fullscreen: {
        type: Boolean,
        observer: '__fullscreenChanged',
      },
    };
  }

  /**
   * The mode can flip while the popup is open (rotating a phone across the
   * fullscreen threshold). The visualViewport resize that drives the
   * position mixin fires before the MediaQueryList change that flips this
   * attribute, so the mixin has already repositioned for the old mode —
   * re-run for the new one: entering fullscreen strips the stale inline
   * anchoring (which would beat the bottom-sheet stylesheet), leaving it
   * re-anchors the popup to the field.
   * @private
   */
  __fullscreenChanged(fullscreen: boolean, oldFullscreen?: boolean) {
    // oldFullscreen is undefined until the attribute first appears
    if (!(this as any).opened || Boolean(fullscreen) === Boolean(oldFullscreen)) {
      return;
    }
    this._updatePosition();
  }

  /**
   * Override a method from `PositionMixin`: while in fullscreen (mobile
   * bottom sheet) mode the stylesheet owns the layout, so skip the popup
   * anchoring — the mixin writes inline styles (top/left and flex
   * justification) on the host that would misplace the sheet. Any inline
   * styles written before entering fullscreen are dropped; the
   * `__fullscreenChanged` observer re-runs this on every mode flip while
   * open, so entering fullscreen cleans up and leaving re-anchors.
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
    const side = this.__updatePlacement();
    // @ts-expect-error the mixin method is not exposed in the typings
    super._updatePosition();
    if (side) {
      this.__fitSidePlacement();
    }
  }

  /**
   * Usable viewport size: `window.inner*` includes the thickness of
   * classic (space-consuming) scrollbars, which the popup cannot occupy —
   * the same measure `PositionMixin` uses for its own clamping.
   * @private
   */
  __viewportSize() {
    return {
      width: Math.min(window.innerWidth, document.documentElement.clientWidth),
      height: Math.min(window.innerHeight, document.documentElement.clientHeight),
    };
  }

  /**
   * In side mode the mixin still aligns the popup to the field's vertical
   * edge and clamps it there; shift it along the field instead so the full
   * popup fits in the viewport (top-aligned to the field when possible).
   * @private
   */
  __fitSidePlacement() {
    const target = (this as any).positionTarget as HTMLElement | undefined;
    const overlayPart = this.$ && this.$.overlay;
    if (!target || !overlayPart) {
      return;
    }
    const margin = 8;
    const partStyle = getComputedStyle(overlayPart);
    const borders = parseFloat(partStyle.borderTopWidth) + parseFloat(partStyle.borderBottomWidth);
    const needed = (((this as any).requiredVerticalSpace as number) || overlayPart.scrollHeight) + borders;
    const viewportHeight = this.__viewportSize().height;
    const top = Math.max(margin, Math.min(target.getBoundingClientRect().top, viewportHeight - needed - margin));
    this.style.justifyContent = 'flex-start';
    this.style.top = `${top}px`;
    this.style.removeProperty('bottom');
  }

  /**
   * Places the popup beside the field when neither above nor below has
   * room for it (short window, field mid-screen), instead of clamping and
   * scrolling. Falls back to the normal below/above placement — and to
   * clamping — as soon as the space situation allows.
   * @private
   */
  __updatePlacement(): boolean {
    const target = (this as any).positionTarget as HTMLElement | undefined;
    const overlayPart = this.$ && (this.$.overlay as HTMLElement | undefined);
    if (!target || !overlayPart || !(this as any).opened) {
      return false;
    }
    const margin = 8;
    const targetRect = target.getBoundingClientRect();
    const viewport = this.__viewportSize();
    const neededHeight = (((this as any).requiredVerticalSpace as number) || overlayPart.offsetHeight) + margin;
    const width = overlayPart.offsetWidth + margin;
    const fitsBelow = viewport.height - targetRect.bottom >= neededHeight;
    const fitsAbove = targetRect.top >= neededHeight;
    const sideFits = width > margin && (viewport.width - targetRect.right >= width || targetRect.left >= width);
    const side = !fitsBelow && !fitsAbove && sideFits;
    if (side !== (this as any).noHorizontalOverlap) {
      (this as any).noHorizontalOverlap = side;
      (this as any).noVerticalOverlap = !side;
    }
    return side;
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
