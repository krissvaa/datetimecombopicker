/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 *
 * An analog clock time selector in the style of the Material Design
 * (Android) time picker: numbers on a dial, a hand pointing at the
 * selection, one view per time part with automatic advancement.
 */
import { css, html, LitElement, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { defineCustomElement } from '@vaadin/component-base/src/define.js';
import { PolylitMixin } from '@vaadin/component-base/src/polylit-mixin.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import type { TimeConfig } from './dtcp-format.js';
import type { TimeColumnsI18n, TimeSteps, TimeValue } from './dtcp-time-columns.js';

type ClockView = 'hours' | 'minutes' | 'seconds';

/** Fraction of the face width at which the (outer) number ring sits. */
const OUTER_RING_RATIO = 0.39;
/** Fraction of the face width for the inner ring (13-00 in 24h mode). */
const INNER_RING_RATIO = 0.26;
/** Delay before advancing to the next view after a selection. */
const VIEW_ADVANCE_DELAY = 300;

const DEFAULT_CONFIG: TimeConfig = {
  hasDate: true,
  hasTime: true,
  use12h: false,
  showHours: true,
  showMinutes: true,
  showSeconds: false,
  showMeridiem: false,
};

interface ClockNumber {
  /** The time part value this number commits (hours: 0-23, minutes/seconds: 0-59). */
  value: number;
  label: string;
  /** Angle on the dial, degrees clockwise from 12 o'clock. */
  angle: number;
  inner: boolean;
}

/**
 * `<dtcp-time-clock>` is an analog-clock alternative to `<dtcp-time-columns>`.
 * It shows one dial per time part (hours, minutes, seconds) with a digital
 * readout for switching between them, and advances automatically after each
 * selection. An internal element, not intended to be used separately.
 *
 * @fires time-changed - Fired when the user selects a time part. `detail` is a {@link TimeValue}.
 */
class TimeClock extends ThemableMixin(PolylitMixin(LitElement)) {
  declare config: TimeConfig;
  declare value: TimeValue | null;
  declare fallbackValue: TimeValue;
  declare steps: TimeSteps;
  declare i18n: TimeColumnsI18n;
  declare autoAdvanceDisabled: boolean;
  declare _activeView: ClockView;
  declare _dragValue: number | null;

  private __advanceTimer?: ReturnType<typeof setTimeout>;

  static get is() {
    return 'dtcp-time-clock';
  }

  static get properties() {
    return {
      /** Which time parts exist and whether the clock is 12h. */
      config: {
        type: Object,
      },

      /** The currently selected time, or null when nothing is selected yet. */
      value: {
        type: Object,
      },

      /** The time used for the parts not yet chosen on the first selection. */
      fallbackValue: {
        type: Object,
      },

      /** Interval between selectable values per part. */
      steps: {
        type: Object,
      },

      /** Accessible names for the views and AM/PM labels. */
      i18n: {
        type: Object,
      },

      /**
       * When true, selecting a value does not automatically advance to the
       * next view (hours to minutes to seconds); the user switches views
       * from the readout instead.
       */
      autoAdvanceDisabled: {
        type: Boolean,
      },

      /** @protected */
      _activeView: {
        type: String,
      },

      /** @protected */
      _dragValue: {
        type: Object,
      },
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        --_face-size: 14em;
      }

      [part='clock-readout'] {
        display: flex;
        align-items: baseline;
        flex: none;
      }

      [part~='readout-segment'],
      [part~='meridiem-button'] {
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      [part='clock-face'] {
        position: relative;
        flex: none;
        width: var(--_face-size);
        height: var(--_face-size);
        border-radius: 50%;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        outline: none;
      }

      [part~='clock-number'] {
        position: absolute;
        top: 50%;
        left: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        transform: translate(-50%, -50%)
          translate(
            calc(sin(var(--_angle)) * var(--_face-size) * var(--_ring)),
            calc(-1 * cos(var(--_angle)) * var(--_face-size) * var(--_ring))
          );
      }

      [part='clock-hand'] {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 2px;
        height: calc(var(--_face-size) * var(--_ring));
        transform-origin: center top;
        transform: translate(-50%, 0) rotate(calc(var(--_angle) + 180deg));
        pointer-events: none;
      }

      [part='clock-hand']::before {
        /* The thumb circle enclosing the selected number */
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translate(-50%, 50%);
        border-radius: 50%;
      }

      [part='clock-hand']::after {
        /* The center pivot dot */
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: inherit;
      }

      [hidden] {
        display: none !important;
      }
    `;
  }

  constructor() {
    super();
    this.config = DEFAULT_CONFIG;
    this.value = null;
    this.fallbackValue = { hours: 0, minutes: 0, seconds: 0 };
    this.steps = { hours: 1, minutes: 1, seconds: 1 };
    this.autoAdvanceDisabled = false;
    this._activeView = 'hours';
    this._dragValue = null;
    this.i18n = {
      hours: 'Hours',
      minutes: 'Minutes',
      seconds: 'Seconds',
      meridiem: 'AM/PM',
      am: 'AM',
      pm: 'PM',
    };
  }

  /** @protected */
  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.__advanceTimer);
  }

  /** Resets to the first available view; called when the overlay opens. */
  initialize() {
    clearTimeout(this.__advanceTimer);
    this._dragValue = null;
    this._activeView = this.__views()[0] ?? 'hours';
  }

  /** @protected */
  render() {
    const display = this.__displayTime();
    const views = this.__views();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const meridiemPm = display.hours >= 12;
    const numbers = this.__numbers();
    const handAngle = this.__handAngle();
    const handInner = this.__isInnerValue(this.__activeValue());

    return html`
      <div part="clock-readout">
        ${views.map((view, index) => {
          const segment =
            view === 'hours' && this.config.use12h
              ? pad2(display.hours % 12 === 0 ? 12 : display.hours % 12)
              : pad2(display[view]);
          return html`
            ${index > 0 ? html`<span part="readout-separator">:</span>` : nothing}
            <button
              part="readout-segment ${view === this._activeView ? 'readout-segment-active' : ''}"
              aria-label="${this.i18n[view]}"
              @click="${() => this.__setView(view)}"
            >
              ${segment}
            </button>
          `;
        })}
        ${this.config.showMeridiem
          ? html`
              <div part="meridiem-toggle" role="group" aria-label="${this.i18n.meridiem}">
                <button
                  part="meridiem-button ${!meridiemPm ? 'meridiem-button-selected' : ''}"
                  aria-pressed="${String(!meridiemPm)}"
                  @click="${() => this.__setMeridiem(false)}"
                >
                  ${this.i18n.am}
                </button>
                <button
                  part="meridiem-button ${meridiemPm ? 'meridiem-button-selected' : ''}"
                  aria-pressed="${String(meridiemPm)}"
                  @click="${() => this.__setMeridiem(true)}"
                >
                  ${this.i18n.pm}
                </button>
              </div>
            `
          : nothing}
      </div>
      <div
        part="clock-face"
        role="slider"
        tabindex="0"
        aria-label="${this.i18n[this._activeView]}"
        aria-valuemin="0"
        aria-valuemax="${this._activeView === 'hours' ? 23 : 59}"
        aria-valuenow="${this.__activeValue()}"
        aria-valuetext="${pad2(this.__activeValue())}"
        @pointerdown="${this.__onPointerDown}"
        @pointermove="${this.__onPointerMove}"
        @pointerup="${this.__onPointerUp}"
        @keydown="${this.__onKeyDown}"
      >
        <div
          part="clock-hand"
          ?hidden="${this.value === null && this._dragValue === null}"
          style="${styleMap({
            '--_angle': `${handAngle}deg`,
            '--_ring': String(handInner ? INNER_RING_RATIO : OUTER_RING_RATIO),
          })}"
        ></div>
        ${numbers.map((number) => {
          const selected = number.value === this.__activeValue();
          return html`
            <div
              part="clock-number ${selected ? 'clock-number-selected' : ''} ${number.inner
                ? 'clock-number-inner'
                : ''}"
              class="${classMap({ selected })}"
              style="${styleMap({
                '--_angle': `${number.angle}deg`,
                '--_ring': String(number.inner ? INNER_RING_RATIO : OUTER_RING_RATIO),
              })}"
            >
              ${number.label}
            </div>
          `;
        })}
      </div>
    `;
  }

  /** @private */
  __views(): ClockView[] {
    const config = this.config || DEFAULT_CONFIG;
    const views: ClockView[] = [];
    if (config.showHours) {
      views.push('hours');
    }
    if (config.showMinutes) {
      views.push('minutes');
    }
    if (config.showSeconds) {
      views.push('seconds');
    }
    return views;
  }

  /** @private */
  __displayTime(): TimeValue {
    return this.value ?? this.fallbackValue ?? { hours: 0, minutes: 0, seconds: 0 };
  }

  /** The value of the active view, with an in-progress drag taking precedence. @private */
  __activeValue(): number {
    if (this._dragValue !== null) {
      return this._dragValue;
    }
    return this.__displayTime()[this._activeView];
  }

  /** @private */
  __step(view: ClockView): number {
    const step = this.steps ? this.steps[view] : 1;
    return Number.isInteger(step) && step >= 1 ? step : 1;
  }

  /** @private */
  __numbers(): ClockNumber[] {
    const pad2 = (n: number) => String(n).padStart(2, '0');
    if (this._activeView === 'hours') {
      if (this.config.use12h) {
        // 12 at the top, then 1..11 clockwise; commits 0-23 preserving meridiem
        const pm = this.__displayTime().hours >= 12;
        return Array.from({ length: 12 }, (_, i) => {
          const label = i === 0 ? 12 : i;
          return {
            value: (i % 12) + (pm ? 12 : 0),
            label: pad2(label),
            angle: i * 30,
            inner: false,
          };
        }).filter((n) => n.value % this.__step('hours') === 0 || this.__step('hours') === 1);
      }
      // 24h: outer ring 12, 1-11; inner ring 00, 13-23
      const numbers: ClockNumber[] = [];
      for (let i = 0; i < 12; i++) {
        numbers.push({ value: i === 0 ? 12 : i, label: pad2(i === 0 ? 12 : i), angle: i * 30, inner: false });
        numbers.push({ value: i === 0 ? 0 : i + 12, label: pad2(i === 0 ? 0 : i + 12), angle: i * 30, inner: true });
      }
      const step = this.__step('hours');
      return step === 1 ? numbers : numbers.filter((n) => n.value % step === 0);
    }
    // Minutes / seconds: labels every 5 units, selection follows the step
    const step = this.__step(this._activeView);
    const labelEvery = Math.max(5, step);
    const numbers: ClockNumber[] = [];
    for (let value = 0; value < 60; value += labelEvery) {
      if (value % step === 0) {
        numbers.push({ value, label: pad2(value), angle: value * 6, inner: false });
      }
    }
    return numbers;
  }

  /** @private */
  __isInnerValue(value: number): boolean {
    return this._activeView === 'hours' && !this.config.use12h && (value === 0 || value > 12);
  }

  /** @private */
  __handAngle(): number {
    const value = this.__activeValue();
    if (this._activeView === 'hours') {
      return (value % 12) * 30;
    }
    return value * 6;
  }

  /** @private */
  __valueFromPointer(event: PointerEvent): number {
    const rect = (this.shadowRoot!.querySelector('[part="clock-face"]') as HTMLElement).getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const angle = (Math.atan2(dx, -dy) * (180 / Math.PI) + 360) % 360;
    const distance = Math.hypot(dx, dy);

    if (this._activeView === 'hours') {
      const step = this.__step('hours');
      const index = Math.round(angle / 30) % 12;
      let hour: number;
      if (this.config.use12h) {
        const pm = this.__displayTime().hours >= 12;
        hour = (index % 12) + (pm ? 12 : 0);
      } else {
        const innerBoundary = rect.width * ((OUTER_RING_RATIO + INNER_RING_RATIO) / 2);
        const inner = distance < innerBoundary;
        if (inner) {
          hour = index === 0 ? 0 : index + 12;
        } else {
          hour = index === 0 ? 12 : index;
        }
      }
      return step === 1 ? hour : Math.round(hour / step) * step % 24;
    }

    const step = this.__step(this._activeView);
    const raw = Math.round(angle / 6) % 60;
    return (Math.round(raw / step) * step) % 60;
  }

  /** @private */
  __onPointerDown(event: PointerEvent) {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this._dragValue = this.__valueFromPointer(event);
  }

  /** @private */
  __onPointerMove(event: PointerEvent) {
    if (this._dragValue !== null && event.buttons > 0) {
      this._dragValue = this.__valueFromPointer(event);
    }
  }

  /** @private */
  __onPointerUp(event: PointerEvent) {
    if (this._dragValue === null) {
      return;
    }
    const selected = this.__valueFromPointer(event);
    this._dragValue = null;
    this.__commitActiveValue(selected, true);
  }

  /** @private */
  __onKeyDown(event: KeyboardEvent) {
    const step = this.__step(this._activeView);
    const max = this._activeView === 'hours' ? 24 : 60;
    const current = this.__activeValue();
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        next = (current + step) % max;
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        next = (current - step + max) % max;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = max - step;
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.__commitActiveValue(next, false);
  }

  /** @private */
  __commitActiveValue(selected: number, advance: boolean) {
    const next: TimeValue = { ...this.__displayTime(), [this._activeView]: selected };
    this.value = next;
    this.dispatchEvent(new CustomEvent('time-changed', { detail: next }));

    if (advance && !this.autoAdvanceDisabled) {
      const views = this.__views();
      const nextView = views[views.indexOf(this._activeView) + 1];
      if (nextView) {
        clearTimeout(this.__advanceTimer);
        this.__advanceTimer = setTimeout(() => {
          this._activeView = nextView;
        }, VIEW_ADVANCE_DELAY);
      }
    }
  }

  /** @private */
  __setView(view: ClockView) {
    clearTimeout(this.__advanceTimer);
    this._activeView = view;
  }

  /** @private */
  __setMeridiem(pm: boolean) {
    const display = this.__displayTime();
    const hours = (display.hours % 12) + (pm ? 12 : 0);
    if (hours !== display.hours || this.value === null) {
      const next: TimeValue = { ...display, hours };
      this.value = next;
      this.dispatchEvent(new CustomEvent('time-changed', { detail: next }));
    }
  }
}

defineCustomElement(TimeClock);

export { TimeClock };
