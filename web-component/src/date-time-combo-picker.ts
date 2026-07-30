/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 *
 * Field composition modeled on vaadin-time-picker / vaadin-date-picker
 * (vaadin/web-components, Apache-2.0).
 */
import '@vaadin/input-container/vaadin-input-container.js';
import './dtcp-overlay.js';
import './dtcp-overlay-content.js';
import { css, html, LitElement } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { defineCustomElement } from '@vaadin/component-base/src/define.js';
import { ElementMixin } from '@vaadin/component-base/src/element-mixin.js';
import { PolylitMixin } from '@vaadin/component-base/src/polylit-mixin.js';
import { TooltipController } from '@vaadin/component-base/src/tooltip-controller.js';
import { InputControlMixin } from '@vaadin/field-base/src/input-control-mixin.js';
import { InputController } from '@vaadin/field-base/src/input-controller.js';
import { LabelledInputController } from '@vaadin/field-base/src/labelled-input-controller.js';
import { inputFieldShared } from '@vaadin/field-base/src/styles/input-field-shared-styles.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import {
  dateToParts,
  deriveTimeConfig,
  formatDateTime,
  parseDateTime,
  parseIsoDateTime,
  parsePattern,
  partsToDate,
  toIsoDateTime,
} from './dtcp-format.js';
import type { DateTimeParts, TimeConfig, Token } from './dtcp-format.js';
import { DEFAULT_I18N } from './dtcp-overlay-content.js';
import type { DtcpI18n, DtcpOverlayContent } from './dtcp-overlay-content.js';
import type { DtcpOverlay } from './dtcp-overlay.js';
import type { TimeValue } from './dtcp-time-columns.js';

export const DEFAULT_FORMAT = 'dd.MM.yyyy HH:mm';

/**
 * `<date-time-combo-picker>` is a web component for selecting both a date and
 * a time in a single field with a single popup: a month calendar and sliding
 * time columns side by side.
 *
 * The `format` pattern (e.g. `dd.MM.yyyy HH:mm:ss` or `M/d/yyyy h:mm a`)
 * defines how the value is displayed and parsed in the field, and which time
 * columns are visible: no `ss` - no seconds column, no `mm` - no minutes
 * column, `h`/`hh` - 12-hour clock with an AM/PM column.
 *
 * The `value` property is an ISO-8601 local date-time string
 * (`yyyy-MM-ddTHH:mm:ss`), or an empty string when nothing is selected.
 *
 * ```html
 * <date-time-combo-picker
 *   label="Meeting"
 *   format="dd.MM.yyyy HH:mm"
 *   value="2026-07-30T13:30:00"
 * ></date-time-combo-picker>
 * ```
 *
 * @fires value-changed - Fired when the `value` property changes.
 * @fires opened-changed - Fired when the `opened` property changes.
 * @fires invalid-changed - Fired when the `invalid` property changes.
 * @fires change - Fired when the user commits a value change.
 */
class DateTimeComboPicker extends InputControlMixin(ThemableMixin(ElementMixin(PolylitMixin(LitElement)))) {
  declare value: string;
  declare format: string;
  declare min: string | null;
  declare max: string | null;
  declare opened: boolean;
  declare autoOpenDisabled: boolean;
  declare showWeekNumbers: boolean;
  declare i18n: DtcpI18n;
  declare _timeConfig: TimeConfig;
  declare invalid: boolean;
  declare required: boolean;
  declare disabled: boolean;
  declare readonly: boolean;
  declare clearButtonVisible: boolean;

  /** Shadow-root id map provided by PolylitMixin. */
  declare $: Record<string, HTMLElement>;

  private __tokens: Token[] = parsePattern(DEFAULT_FORMAT);
  private __keepInputValue = false;
  private _tooltipController?: TooltipController;

  static get is() {
    return 'date-time-combo-picker';
  }

  static get properties() {
    return {
      /**
       * The date-time format pattern. Supported letters:
       * `yyyy`/`yy`, `MM`/`M`, `dd`/`d`, `HH`/`H`, `hh`/`h`, `mm`/`m`,
       * `ss`/`s` and `a` (AM/PM). Other characters are literals; quote
       * literal text with single quotes.
       */
      format: {
        type: String,
        value: DEFAULT_FORMAT,
        observer: '__formatChanged',
        sync: true,
      },

      /** The earliest allowed value, as an ISO-8601 local date-time string. */
      min: {
        type: String,
        value: null,
        sync: true,
      },

      /** The latest allowed value, as an ISO-8601 local date-time string. */
      max: {
        type: String,
        value: null,
        sync: true,
      },

      /** True when the popup is open. */
      opened: {
        type: Boolean,
        value: false,
        notify: true,
        reflectToAttribute: true,
        observer: '__openedChanged',
        sync: true,
      },

      /** When true, the popup only opens from the toggle button, not on input click. */
      autoOpenDisabled: {
        type: Boolean,
        value: false,
      },

      /** Set true to display ISO-8601 week numbers (requires `i18n.firstDayOfWeek` = 1). */
      showWeekNumbers: {
        type: Boolean,
        value: false,
      },

      /** The object used to localize this component. */
      i18n: {
        type: Object,
        value: () => ({ ...DEFAULT_I18N }),
        sync: true,
      },

      /** @protected */
      _timeConfig: {
        type: Object,
        value: () => deriveTimeConfig(parsePattern(DEFAULT_FORMAT)),
        sync: true,
      },
    };
  }

  static get styles() {
    return [
      inputFieldShared,
      css`
        [part~='toggle-button'] {
          cursor: pointer;
        }
      `,
    ];
  }

  /** @protected */
  render() {
    return html`
      <div class="date-time-combo-picker-container">
        <div part="label">
          <slot name="label"></slot>
          <span part="required-indicator" aria-hidden="true" @click="${this.focus}"></span>
        </div>

        <vaadin-input-container
          id="inputContainer"
          part="input-field"
          .readonly="${this.readonly}"
          .disabled="${this.disabled}"
          .invalid="${this.invalid}"
          theme="${ifDefined((this as any)._theme)}"
          @click="${this.__onInputContainerClick}"
        >
          <slot name="prefix" slot="prefix"></slot>
          <slot name="input"></slot>
          <div id="clearButton" part="clear-button" slot="suffix" aria-hidden="true"></div>
          <div
            id="toggleButton"
            part="toggle-button"
            slot="suffix"
            aria-hidden="true"
            @mousedown="${(e: Event) => e.preventDefault()}"
            @click="${this.__onToggleClick}"
          ></div>
        </vaadin-input-container>

        <div part="helper-text">
          <slot name="helper"></slot>
        </div>

        <div part="error-message">
          <slot name="error-message"></slot>
        </div>

        <slot name="tooltip"></slot>
      </div>

      <dtcp-overlay
        id="overlay"
        .opened="${this.opened}"
        no-vertical-overlap
        theme="${ifDefined((this as any)._theme)}"
        @opened-changed="${this.__onOverlayOpenedChanged}"
        @mousedown="${(e: Event) => e.preventDefault()}"
      >
        <dtcp-overlay-content
          id="overlayContent"
          .selectedDate="${this.__selectedDate()}"
          .timeValue="${this.__timeValue()}"
          .timeConfig="${this._timeConfig}"
          .i18n="${{ ...DEFAULT_I18N, ...this.i18n }}"
          .minDate="${this.__minMaxDate(this.min)}"
          .maxDate="${this.__minMaxDate(this.max)}"
          .showWeekNumbers="${this.showWeekNumbers}"
          @date-selected="${this.__onDateSelected}"
          @time-selected="${this.__onTimeSelected}"
        ></dtcp-overlay-content>
      </dtcp-overlay>
    `;
  }

  /** @protected */
  get clearElement() {
    return this.$ ? this.$.clearButton : null;
  }

  /** @protected */
  ready() {
    super.ready();

    // Note: the InputController/TooltipController .d.ts files inherit the
    // SlotController constructor signature, which does not match their actual
    // JS constructors — hence the casts (same call shape as vaadin-time-picker).
    this.addController(
      new (InputController as any)(this, (input: HTMLInputElement) => {
        (this as any)._setInputElement(input);
        (this as any)._setFocusElement(input);
        (this as any).stateTarget = input;
        (this as any).ariaTarget = input;
      }),
    );
    this.addController(new (LabelledInputController as any)(this.inputElement, (this as any)._labelController));

    this._tooltipController = new (TooltipController as any)(this) as TooltipController;
    this.addController(this._tooltipController);
    this._tooltipController.setPosition('top');

    const overlay = this.$.overlay as DtcpOverlay;
    (overlay as any).positionTarget = this.$.inputContainer;
    (overlay as any).restoreFocusOnClose = false;
  }

  /** Opens the popup, unless the field is disabled or read-only. */
  open() {
    if (!this.disabled && !this.readonly) {
      this.opened = true;
    }
  }

  /** Closes the popup. */
  close() {
    this.opened = false;
  }

  /**
   * Returns true if the field is valid: the typed text parses with the
   * current format, required is satisfied, and the value is inside min/max.
   *
   * @return {boolean}
   */
  checkValidity(): boolean {
    const text = (this as any)._inputElementValue as string | undefined;
    const inputParses = !text || !!parseDateTime(this.__tokens, text);
    const requiredOk = !this.required || !!this.value;
    const rangeOk = !this.value || this.__isInRange(this.value);
    return inputParses && requiredOk && rangeOk;
  }

  /**
   * Override the input event listener from `InputMixin` — typing must not
   * write the raw text into `value`; the text is parsed on commit instead.
   * @protected
   * @override
   */
  _onInput(event: InputEvent) {
    if (event.isTrusted && !this.opened && !this.autoOpenDisabled && event.inputType !== 'insertReplacementText') {
      // Keep the popup available while typing, like vaadin-date-picker
      this.open();
    }
  }

  /**
   * Override the change event listener from `InputMixin` to commit the
   * typed text through the format parser.
   * @protected
   * @override
   */
  _onChange(event: Event) {
    event.stopPropagation();
    this.__commitInputValue();
  }

  /**
   * Override a method from `InputMixin` to display the formatted date-time
   * instead of the raw ISO value.
   * (Typed `any` because the upstream input-mixin.d.ts declares a wrong
   * parameter type for this method; the JS implementation takes a string.)
   * @protected
   * @override
   */
  _forwardInputValue(value: any) {
    if (this.__keepInputValue) {
      return;
    }
    const parts = value ? parseIsoDateTime(value as string) : null;
    (this as any)._inputElementValue = parts ? formatDateTime(this.__tokens, parts) : '';
  }

  /**
   * Override a method from `InputMixin` to reject malformed ISO strings.
   * @protected
   * @override
   */
  _valueChanged(value: string | undefined, oldValue: string | undefined) {
    if (value && !parseIsoDateTime(value)) {
      console.warn(`<date-time-combo-picker> Invalid value "${value}", expected yyyy-MM-ddTHH:mm[:ss]`);
      this.value = oldValue && parseIsoDateTime(oldValue) ? oldValue : '';
      return;
    }
    super._valueChanged(value, oldValue);
  }

  /**
   * Override an observer from `FieldMixin`: commit the typed text and close
   * the popup when the field loses focus.
   * @protected
   * @override
   */
  _setFocused(focused: boolean) {
    if (!focused) {
      this.__commitInputValue();
      this.close();
    }
    super._setFocused(focused);
  }

  /**
   * Override a method from `KeyboardMixin`: commit on Enter and close the popup.
   * @protected
   * @override
   */
  _onEnter(_event: KeyboardEvent) {
    this.__commitInputValue();
    this.close();
  }

  /**
   * Override a method from `ClearButtonMixin`: close the popup on Escape
   * first; fall back to clear-on-Escape behavior when already closed.
   * @protected
   * @override
   */
  _onEscape(event: KeyboardEvent) {
    if (this.opened) {
      event.stopPropagation();
      this.close();
      return;
    }
    super._onEscape(event);
  }

  /**
   * Override a method from `KeyboardMixin`: open the popup on arrow keys.
   * @protected
   * @override
   */
  _onKeyDown(event: KeyboardEvent) {
    super._onKeyDown(event);
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !this.opened) {
      event.preventDefault();
      this.open();
    }
  }

  /** @private */
  __formatChanged(format: string) {
    this.__tokens = parsePattern(format || DEFAULT_FORMAT);
    this._timeConfig = deriveTimeConfig(this.__tokens);
    // Re-render the displayed text with the new format
    if (this.inputElement) {
      this._forwardInputValue(this.value);
    }
  }

  /** @private */
  __openedChanged(opened: boolean, oldOpened?: boolean) {
    if (opened) {
      requestAnimationFrame(() => {
        const content = this.$.overlayContent as DtcpOverlayContent;
        content.initialize();
      });
    } else if (oldOpened) {
      this.validate();
    }
  }

  /** @private */
  __onOverlayOpenedChanged(event: CustomEvent<{ value: boolean }>) {
    this.opened = event.detail.value;
  }

  /** @private */
  __onToggleClick() {
    if (this.opened) {
      this.close();
    } else {
      this.focus();
      this.open();
    }
  }

  /** @private */
  __onInputContainerClick() {
    if (!this.autoOpenDisabled) {
      this.open();
    }
  }

  /** @private */
  __onDateSelected(event: CustomEvent<{ date: Date }>) {
    const date = event.detail.date;
    const current = this.value ? parseIsoDateTime(this.value) : null;
    const parts: DateTimeParts = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hours: current ? current.hours : 0,
      minutes: current ? current.minutes : 0,
      seconds: current ? current.seconds : 0,
    };
    this.__commitParts(parts);
    if (!this._timeConfig.hasTime) {
      // Plain date pattern: behave like a date picker and close on selection
      this.close();
    }
  }

  /** @private */
  __onTimeSelected(event: CustomEvent<TimeValue>) {
    const time = event.detail;
    const current = this.value ? parseIsoDateTime(this.value) : null;
    const base = current ?? dateToParts(new Date());
    const parts: DateTimeParts = {
      year: base.year,
      month: base.month,
      day: base.day,
      hours: time.hours,
      minutes: time.minutes,
      seconds: time.seconds,
    };
    this.__commitParts(parts);
  }

  /** @private */
  __commitParts(parts: DateTimeParts) {
    const iso = toIsoDateTime(parts);
    if (iso !== this.value) {
      this.value = iso;
      this.dispatchEvent(new CustomEvent('change', { bubbles: true }));
    }
    this.validate();
  }

  /** @private */
  __commitInputValue() {
    const text = (((this as any)._inputElementValue as string) || '').trim();
    const oldValue = this.value;

    if (!text) {
      this.value = '';
    } else {
      const parts = parseDateTime(this.__tokens, text);
      if (parts) {
        this.value = toIsoDateTime(parts);
        // Normalize the text even when the value did not change
        this._forwardInputValue(this.value);
      } else {
        // Unparseable text: clear the value but keep the text so the user
        // can correct it; validation marks the field invalid.
        this.__keepInputValue = true;
        this.value = '';
        this.__keepInputValue = false;
      }
    }

    if (this.value !== oldValue) {
      this.dispatchEvent(new CustomEvent('change', { bubbles: true }));
    }
    this.validate();
  }

  /** @private */
  __selectedDate(): Date | null {
    const parts = this.value ? parseIsoDateTime(this.value) : null;
    return parts ? partsToDate(parts) : null;
  }

  /** @private */
  __timeValue(): TimeValue | null {
    const parts = this.value ? parseIsoDateTime(this.value) : null;
    return parts ? { hours: parts.hours, minutes: parts.minutes, seconds: parts.seconds } : null;
  }

  /** @private */
  __minMaxDate(iso: string | null): Date | null {
    const parts = iso ? parseIsoDateTime(iso) : null;
    if (!parts) {
      return null;
    }
    const date = partsToDate(parts);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /** @private */
  __isInRange(value: string): boolean {
    const parts = parseIsoDateTime(value);
    if (!parts) {
      return false;
    }
    const iso = toIsoDateTime(parts);
    const minParts = this.min ? parseIsoDateTime(this.min) : null;
    const maxParts = this.max ? parseIsoDateTime(this.max) : null;
    if (minParts && iso < toIsoDateTime(minParts)) {
      return false;
    }
    if (maxParts && iso > toIsoDateTime(maxParts)) {
      return false;
    }
    return true;
  }
}

defineCustomElement(DateTimeComboPicker);

export { DateTimeComboPicker };
