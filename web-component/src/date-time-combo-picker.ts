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
import { MediaQueryController } from '@vaadin/component-base/src/media-query-controller.js';
import { PolylitMixin } from '@vaadin/component-base/src/polylit-mixin.js';
import { TooltipController } from '@vaadin/component-base/src/tooltip-controller.js';
import { InputControlMixin } from '@vaadin/field-base/src/input-control-mixin.js';
import { InputController } from '@vaadin/field-base/src/input-controller.js';
import { LabelledInputController } from '@vaadin/field-base/src/labelled-input-controller.js';
import { inputFieldShared } from '@vaadin/field-base/src/styles/input-field-shared-styles.js';
import '@vaadin/component-base/src/styles/style-props.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import { LumoInjectionMixin } from '@vaadin/vaadin-themable-mixin/lumo-injection-mixin.js';
import './lumo-adaptation.js';
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
import type { DtcpI18n, DtcpOverlayContent, IsDateDisabledFn, TimeViewKind } from './dtcp-overlay-content.js';
import type { DtcpOverlay } from './dtcp-overlay.js';
import type { TimeValue } from './dtcp-time-columns.js';

export const DEFAULT_FORMAT = 'dd.MM.yyyy HH:mm';

const FULLSCREEN_MEDIA_QUERY = '(max-width: 450px), (max-height: 450px)';

/**
 * `<date-time-combo-picker>` is a web component for selecting both a date and
 * a time in a single field with a single popup: a month calendar and a time
 * selector side by side.
 *
 * The `format` pattern (e.g. `dd.MM.yyyy HH:mm:ss` or `M/d/yyyy h:mm a`)
 * defines how the value is displayed and parsed in the field, and which time
 * parts are offered: no `ss` - no seconds, no `mm` - no minutes,
 * `h`/`hh` - 12-hour clock with an AM/PM selector.
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
 * ### Properties and attributes
 *
 * Property (attribute) | Description | Default
 * ---|---|---
 * `value` (`value`) | ISO-8601 local date-time string, `''` when empty | `''`
 * `format` (`format`) | Date-time pattern driving display, parsing and the popup UI | `dd.MM.yyyy HH:mm`
 * `min` / `max` (`min`/`max`) | Earliest / latest allowed value (ISO string) | `null`
 * `timeView` (`time-view`) | Time selector: `columns` or `clock` (analog dial) | `columns`
 * `autoAdvanceDisabled` (`auto-advance-disabled`) | Clock only: don't auto-advance to the next view after selecting | `false`
 * `autoAdvanceDelay` (`auto-advance-delay`) | Clock only: milliseconds before auto-advancing | `300`
 * `mobileTabsDisabled` (`mobile-tabs-disabled`) | Fullscreen only: stack the calendar above the time selector instead of the default Date/Time tabs | `false`
 * `hourStep` / `minuteStep` / `secondStep` | Interval between selectable time values | `1`
 * `isDateDisabled` | `({day, month, year}) => boolean` (0-based month) disabling dates | -
 * `initialPosition` (`initial-position`) | ISO date(-time) shown and used as defaults when empty | -
 * `autoApply` (`auto-apply`) | `true` applies selections immediately without the OK/Cancel action bar | `false`
 * `closeOnComplete` (`close-on-complete`) | With `autoApply`: close once the date and every visible time part have been picked | `false`
 * `okButtonHidden` / `cancelButtonHidden` (`ok-button-hidden`/`cancel-button-hidden`) | Hide a default action-bar button | `false`
 * `opened` (`opened`) | Whether the popup is open | `false`
 * `autoOpenDisabled` (`auto-open-disabled`) | Only open the popup from the toggle button | `false`
 * `showWeekNumbers` (`show-week-numbers`) | ISO week numbers (requires `firstDayOfWeek: 1`) | `false`
 * `i18n` | Localization object (month/weekday names, labels, `firstDayOfWeek`) | English
 * `label`, `placeholder`, `helperText`, `errorMessage`, `required`, `disabled`, `readonly`, `clearButtonVisible`, `invalid` | Standard Vaadin field properties | -
 *
 * Content with `slot="action-bar"` is placed at the start of the popup's
 * OK/Cancel action bar (e.g. a custom "Now" button).
 *
 * On viewports narrower than 450px the popup becomes a fullscreen
 * bottom sheet with a backdrop.
 *
 * @fires value-changed - Fired when the `value` property changes.
 * @fires opened-changed - Fired when the `opened` property changes.
 * @fires invalid-changed - Fired when the `invalid` property changes.
 * @fires change - Fired when the user commits a value change.
 */
class DateTimeComboPicker extends InputControlMixin(
  ThemableMixin(ElementMixin(PolylitMixin(LumoInjectionMixin(LitElement)))),
) {
  declare value: string;
  declare format: string;
  declare min: string | null;
  declare max: string | null;
  declare opened: boolean;
  declare autoOpenDisabled: boolean;
  declare showWeekNumbers: boolean;
  declare i18n: DtcpI18n;
  declare hourStep: number;
  declare minuteStep: number;
  declare secondStep: number;
  declare isDateDisabled: IsDateDisabledFn | undefined;
  declare initialPosition: string | null;
  declare autoApply: boolean;
  declare closeOnComplete: boolean;
  declare okButtonHidden: boolean;
  declare cancelButtonHidden: boolean;
  declare timeView: TimeViewKind;
  declare autoAdvanceDisabled: boolean;
  declare autoAdvanceDelay: number;
  declare mobileTabsDisabled: boolean;
  declare _fullscreen: boolean;
  declare _stagedParts: DateTimeParts | null;
  declare _timeConfig: TimeConfig;
  declare invalid: boolean;
  declare required: boolean;
  declare disabled: boolean;
  declare readonly: boolean;
  declare clearButtonVisible: boolean;

  /** Shadow-root id map provided by PolylitMixin. */
  declare $: Record<string, HTMLElement>;

  private __tokens: Token[] = parsePattern(DEFAULT_FORMAT);
  /** Parts explicitly picked in the popup since it opened (for closeOnComplete). */
  private __pickedParts = new Set<string>();
  private __keepInputValue = false;
  private _tooltipController?: TooltipController;
  private __violation: 'badInput' | 'required' | 'min' | 'max' | 'dateDisabled' | null = null;
  private __i18nErrorActive = false;
  private __userErrorMessage = '';

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
        observer: '__constraintsChanged',
        sync: true,
      },

      /** The latest allowed value, as an ISO-8601 local date-time string. */
      max: {
        type: String,
        value: null,
        observer: '__constraintsChanged',
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
        observer: '__i18nChanged',
        sync: true,
      },

      /** Interval between the items of the hours column. Must divide 24 evenly for a uniform column. */
      hourStep: {
        type: Number,
        value: 1,
        sync: true,
      },

      /** Interval between the items of the minutes column. */
      minuteStep: {
        type: Number,
        value: 1,
        sync: true,
      },

      /** Interval between the items of the seconds column. */
      secondStep: {
        type: Number,
        value: 1,
        sync: true,
      },

      /**
       * A function that determines whether a given date is disabled.
       * Receives `{ day, month, year }` (month is 0-based) and returns true
       * to disable the date. Disabled dates cannot be selected in the
       * calendar and make the value invalid.
       */
      isDateDisabled: {
        type: Object,
        observer: '__constraintsChanged',
        sync: true,
      },

      /**
       * The date-time (ISO-8601 string, `yyyy-MM-dd` or `yyyy-MM-ddTHH:mm[:ss]`)
       * to show and to use for the unselected date/time parts when there is
       * no value yet. Defaults to the current date-time.
       */
      initialPosition: {
        type: String,
        value: null,
        sync: true,
      },

      /**
       * When false (default), selections are staged and the popup shows a
       * Cancel/OK action bar; only OK applies the staged selection. When
       * true, selections in the popup are applied to the value immediately
       * and the action bar is hidden.
       */
      autoApply: {
        type: Boolean,
        value: false,
        sync: true,
      },

      /**
       * When true (with `autoApply`), the popup closes automatically once
       * every part offered by the format — the date and each visible time
       * part — has been picked since the popup opened. Gives instant-apply
       * pickers (which have no OK button) a natural end to the flow.
       */
      closeOnComplete: {
        type: Boolean,
        value: false,
        sync: true,
      },

      /** Hides the OK button of the action bar. */
      okButtonHidden: {
        type: Boolean,
        value: false,
        sync: true,
      },

      /** Hides the Cancel button of the action bar. */
      cancelButtonHidden: {
        type: Boolean,
        value: false,
        sync: true,
      },

      /**
       * The time selector shown in the popup: `columns` (default, sliding
       * digital-clock columns) or `clock` (an analog clock face with one
       * view per time part).
       */
      timeView: {
        type: String,
        value: 'columns',
        sync: true,
      },

      /**
       * When true, selecting a value on the analog clock does not
       * automatically advance to the next view (hours to minutes to
       * seconds); the user switches views from the readout instead.
       * Only applies when `timeView` is `clock`.
       */
      autoAdvanceDisabled: {
        type: Boolean,
        value: false,
        sync: true,
      },

      /**
       * Delay in milliseconds before the analog clock auto-advances to the
       * next view after a selection, giving the selection time to register
       * visually. `0` advances immediately. Only applies when `timeView` is
       * `clock` and auto-advance is enabled.
       */
      autoAdvanceDelay: {
        type: Number,
        value: 300,
        sync: true,
      },

      /**
       * When true, the fullscreen (mobile) popup stacks the calendar above
       * the time selector instead of the default Date/Time tabbed layout
       * (one section at a time, with the formatted value above the tabs).
       */
      mobileTabsDisabled: {
        type: Boolean,
        value: false,
        sync: true,
      },

      /** @protected */
      _fullscreen: {
        type: Boolean,
        value: false,
        sync: true,
      },

      /** @protected */
      _stagedParts: {
        type: Object,
        value: null,
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

  /**
   * Keep the base styles when Lumo modules are injected (see
   * lumo-adaptation.ts): Lumo's field modules were written to replace
   * Vaadin's own components' base styles wholesale, but this component's
   * base styles carry structure Lumo knows nothing about. The adaptation
   * module compensates for the overlaps (icon masks vs. font glyphs).
   * @protected
   * @override
   */
  static get lumoInjector() {
    return { is: this.is, includeBaseStyles: true };
  }

  static get styles() {
    return [
      inputFieldShared,
      css`
        /* Wider default than the shared 12em: a date-time value (e.g.
           "15.07.2026 03:37") doesn't fit a single-field width. Apps
           setting --vaadin-field-default-width still control it. */
        [part='input-field'] {
          width: var(--vaadin-field-default-width, 14em);
        }

        /* Icon rendering: with a Lumo theme active, injected Lumo modules
           (see lumo-adaptation.ts) draw these buttons as font glyphs. A set
           --lumo-icons-* glyph string is an invalid <image>/<background>,
           which resets these properties (IACVT), clearing the base SVG
           mask in the glyph's favor. Without Lumo the fallbacks apply. */
        [part$='button']::before {
          background: var(--lumo-icons-calendar, currentColor);
        }

        [part~='toggle-button']::before {
          mask-image: var(--lumo-icons-calendar, var(--_vaadin-icon-calendar));
        }

        [part~='clear-button']::before {
          mask-image: var(--lumo-icons-cross, var(--_vaadin-icon-cross));
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
        ?fullscreen="${this._fullscreen}"
        .withBackdrop="${this._fullscreen}"
        no-vertical-overlap
        theme="${ifDefined((this as any)._theme)}"
        @opened-changed="${this.__onOverlayOpenedChanged}"
        @mousedown="${(e: Event) => e.preventDefault()}"
      >
        <dtcp-overlay-content
          id="overlayContent"
          .fullscreen="${this._fullscreen}"
          .mobileTabs="${!this.mobileTabsDisabled}"
          .headerText="${this.__overlayHeaderText()}"
          .selectedDate="${this.__selectedDate()}"
          .timeValue="${this.__timeValue()}"
          .timeConfig="${this._timeConfig}"
          .i18n="${{ ...DEFAULT_I18N, ...this.i18n }}"
          .minDate="${this.__minMaxDate(this.min)}"
          .maxDate="${this.__minMaxDate(this.max)}"
          .isDateDisabled="${this.isDateDisabled}"
          .steps="${{ hours: this.hourStep, minutes: this.minuteStep, seconds: this.secondStep }}"
          .referenceTime="${this.__referenceTime()}"
          .showActions="${!this.autoApply}"
          .okButtonHidden="${this.okButtonHidden}"
          .cancelButtonHidden="${this.cancelButtonHidden}"
          .timeView="${this.timeView}"
          .autoAdvanceDisabled="${this.autoAdvanceDisabled}"
          .autoAdvanceDelay="${this.autoAdvanceDelay}"
          .initialPosition="${this.__initialPositionDate()}"
          .showWeekNumbers="${this.showWeekNumbers}"
          @date-selected="${this.__onDateSelected}"
          @time-selected="${this.__onTimeSelected}"
          @apply-action="${this.__onApplyAction}"
          @cancel-action="${this.__onCancelAction}"
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
    // Clicks on this field must not count as outside clicks for the overlay
    (overlay as any).owner = this;
    // When the popup closes while focus is inside it (keyboard navigation),
    // move focus back to the input.
    (overlay as any).restoreFocusOnClose = true;
    (overlay as any).restoreFocusNode = this.inputElement;
    // The overlay teleports to <body> when open, so focus leaving it does
    // not pass through this element; track it on the overlay itself.
    overlay.addEventListener('focusout', (event: FocusEvent) => {
      const related = event.relatedTarget as Node | null;
      if (this.opened && related && !overlay.contains(related) && !this.contains(related)) {
        this.close();
        (this as any)._setFocused(false);
      }
    });

    // Children with slot="action-bar" are re-parented into the overlay
    // content while the popup is open: a forwarding <slot> chain would
    // break when the overlay teleports itself to <body>. They return to
    // this element's light DOM on close, so document-level queries keep
    // finding them. Late additions while open are adopted by the observer.
    new MutationObserver(() => this.__adoptActionBarContent()).observe(this, { childList: true });

    // Popup semantics for assistive technology
    this.inputElement.setAttribute('role', 'combobox');
    this.inputElement.setAttribute('aria-haspopup', 'dialog');
    this.inputElement.setAttribute('aria-expanded', 'false');
    (this.$.overlayContent as HTMLElement).setAttribute('role', 'dialog');

    this.addController(
      new (MediaQueryController as any)(FULLSCREEN_MEDIA_QUERY, (matches: boolean) => {
        this._fullscreen = matches;
      }),
    );
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
   * current format, required is satisfied, the value is inside min/max, and
   * the value's date is not disabled. Records which constraint failed so
   * that `validate()` can show the matching i18n error message.
   *
   * @return {boolean}
   */
  checkValidity(): boolean {
    this.__violation = this.__checkViolation();
    return this.__violation === null;
  }

  /** @private */
  __checkViolation(): 'badInput' | 'required' | 'min' | 'max' | 'dateDisabled' | null {
    const text = (this as any)._inputElementValue as string | undefined;
    if (text && !parseDateTime(this.__tokens, text, this.__meridiems())) {
      return 'badInput';
    }
    if (this.required && !this.value) {
      return 'required';
    }
    if (this.value) {
      const parts = parseIsoDateTime(this.value);
      if (parts) {
        const iso = toIsoDateTime(parts);
        const minParts = this.min ? parseIsoDateTime(this.min) : null;
        if (minParts && iso < toIsoDateTime(minParts)) {
          return 'min';
        }
        const maxParts = this.max ? parseIsoDateTime(this.max) : null;
        if (maxParts && iso > toIsoDateTime(maxParts)) {
          return 'max';
        }
      }
      if (this.__isValueDateDisabled(this.value)) {
        return 'dateDisabled';
      }
    }
    return null;
  }

  /**
   * Override a method from `ValidateMixin`: after validating, show the
   * i18n error message matching the failed constraint, falling back to the
   * generic `errorMessage` when no specific message is configured.
   * @override
   */
  validate(): boolean {
    const result = super.validate();
    this.__applyConstraintErrorMessage();
    return result;
  }

  /** @private */
  __applyConstraintErrorMessage() {
    // Remember the user-set generic message while no i18n message is shown
    if (!this.__i18nErrorActive) {
      this.__userErrorMessage = (this as any).errorMessage ?? '';
    }
    const i18n = { ...DEFAULT_I18N, ...this.i18n };
    const specific = this.__violation ? i18n[`${this.__violation}ErrorMessage`] : '';
    if (specific) {
      (this as any).errorMessage = specific;
      this.__i18nErrorActive = true;
    } else if (this.__i18nErrorActive) {
      (this as any).errorMessage = this.__userErrorMessage;
      this.__i18nErrorActive = false;
    }
  }

  /** @private */
  __isValueDateDisabled(value: string): boolean {
    if (typeof this.isDateDisabled !== 'function') {
      return false;
    }
    const parts = parseIsoDateTime(value);
    if (!parts) {
      return false;
    }
    // The callback receives a 0-based month, like the calendar internals
    return this.isDateDisabled({ day: parts.day, month: parts.month - 1, year: parts.year });
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
    (this as any)._inputElementValue = parts ? formatDateTime(this.__tokens, parts, this.__meridiems()) : '';
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
   * Override a method from `KeyboardMixin`: open the popup on arrow keys,
   * and move focus into the popup on ArrowDown when it is already open.
   * @protected
   * @override
   */
  _onKeyDown(event: KeyboardEvent) {
    super._onKeyDown(event);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.opened) {
        this.open();
      } else if (event.key === 'ArrowDown') {
        const content = this.$.overlayContent as DtcpOverlayContent;
        if (this._timeConfig.hasDate) {
          content.focusDateCell();
        } else if (this._timeConfig.hasTime) {
          content.focusTimeColumns();
        }
      }
    }
  }

  /**
   * Override a method from `FocusMixin`: moving focus into the popup
   * (keyboard navigation in the calendar, clicks on popup buttons) must
   * not blur the field. While the popup is open, only focus landing on a
   * real element outside both the field and the popup counts as leaving:
   * `null`/`document.body` happens transiently when a focused popup
   * element is re-rendered away (e.g. selecting a year closes the year
   * grid), and in Vaadin 25 the overlay lives in this element's shadow
   * root, so a focus move into it retargets to this element itself.
   *
   * Focus leaving the document entirely (an iframe, browser UI) also
   * reports `relatedTarget: null`, indistinguishable from the transient
   * case here — so that case is resolved asynchronously: if the document
   * has genuinely lost focus a moment later, the typed text is committed
   * and the popup closed, like any other blur.
   * @protected
   * @override
   */
  _shouldRemoveFocus(event: FocusEvent): boolean {
    const related = event.relatedTarget as Node | null;
    if (!this.opened) {
      return true;
    }
    if (related === null || related === document.body) {
      setTimeout(() => {
        if (this.opened && this.hasAttribute('focused') && !document.hasFocus()) {
          this._setFocused(false);
        }
      });
      return false;
    }
    return !this.contains(related) && !(this.$ && this.$.overlay.contains(related));
  }

  /** @private */
  __formatChanged(format: string) {
    this.__tokens = parsePattern(format || DEFAULT_FORMAT);
    this._timeConfig = deriveTimeConfig(this.__tokens);
    // Re-render the displayed text with the new format
    if (this.inputElement) {
      this._forwardInputValue(this.value);
      this.__constraintsChanged();
    }
  }

  /**
   * Revalidates when a constraint (min/max/isDateDisabled/format) changes,
   * so an invalid field can recover when a constraint is relaxed and a
   * valid one is re-checked against a tightened constraint.
   * @private
   */
  __constraintsChanged() {
    if (this.inputElement && (this.invalid || this.value)) {
      this.__requestValidation();
    }
  }

  /** @private */
  __i18nChanged() {
    // AM/PM strings may have changed; re-render the displayed text
    if (this.inputElement) {
      this._forwardInputValue(this.value);
    }
  }

  /** The effective AM/PM marker strings from the i18n object. @private */
  __meridiems(): { am: string; pm: string } {
    const i18n = { ...DEFAULT_I18N, ...this.i18n };
    return { am: i18n.am, pm: i18n.pm };
  }

  /** @private */
  __openedChanged(opened: boolean, oldOpened?: boolean) {
    if (opened && (this.disabled || this.readonly)) {
      // Guard direct property/attribute writes, like open() does
      this.opened = false;
      return;
    }
    this.inputElement?.setAttribute('aria-expanded', String(opened));
    this.__pickedParts.clear();
    if (opened) {
      requestAnimationFrame(() => {
        const content = this.$.overlayContent as DtcpOverlayContent;
        content.initialize();
        // The overlay was positioned before the content had its final size:
        // the position mixin only measures its own (viewport-clamped) box, so
        // tell it the real space the content needs and re-evaluate, letting it
        // flip above the field near the bottom of the viewport.
        requestAnimationFrame(() => {
          const overlay = this.$.overlay as any;
          if (!this._fullscreen) {
            overlay.requiredVerticalSpace = content.offsetHeight;
            overlay._updatePosition();
          }
        });
      });
    } else if (oldOpened) {
      // Closing without OK discards any staged (not applied) selection
      this._stagedParts = null;
      this.__requestValidation();
    }
    this.__adoptActionBarContent();
  }

  /**
   * Moves `slot="action-bar"` children into the overlay content while the
   * popup is open (slots cannot forward into the teleported overlay) and
   * back into this element's light DOM when it closes.
   * @private
   */
  __adoptActionBarContent() {
    const content = this.$ && (this.$.overlayContent as HTMLElement);
    if (!content) {
      return;
    }
    if (this.opened) {
      [...this.children]
        .filter((child) => child.getAttribute('slot') === 'action-bar')
        .forEach((child) => content.appendChild(child));
    } else {
      [...content.children]
        .filter((child) => child.getAttribute('slot') === 'action-bar')
        .forEach((child) => this.appendChild(child));
    }
  }

  /**
   * Runs validation while honoring the manual-validation mode when the
   * installed `ValidateMixin` supports it (Vaadin 24.5+).
   * @private
   */
  __requestValidation() {
    const requestValidation = (this as any)._requestValidation;
    if (typeof requestValidation === 'function') {
      requestValidation.call(this);
    } else {
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
  __onInputContainerClick(event: Event) {
    // The clear button lives in the same container; clearing must not open
    if (this.$ && event.composedPath().includes(this.$.clearButton)) {
      return;
    }
    if (!this.autoOpenDisabled) {
      this.open();
    }
  }

  /** @private */
  __currentParts(): DateTimeParts | null {
    if (this._stagedParts) {
      return this._stagedParts;
    }
    return this.value ? parseIsoDateTime(this.value) : null;
  }

  /**
   * The parts used for the not-yet-selected date/time components:
   * the initial position when set, otherwise "now" (with zeroed time
   * for the time part, matching a fresh date selection).
   * @private
   */
  __referenceParts(): DateTimeParts {
    const initial = this.__initialPositionParts();
    if (initial) {
      return initial;
    }
    const now = dateToParts(new Date());
    return { ...now, hours: 0, minutes: 0, seconds: 0 };
  }

  /** @private */
  __initialPositionParts(): DateTimeParts | null {
    if (!this.initialPosition) {
      return null;
    }
    const iso = /^\d{4}-\d{2}-\d{2}$/u.test(this.initialPosition)
      ? `${this.initialPosition}T00:00:00`
      : this.initialPosition;
    return parseIsoDateTime(iso);
  }

  /** @private */
  __initialPositionDate(): Date | null {
    const parts = this.__initialPositionParts();
    return parts ? partsToDate(parts) : null;
  }

  /** @private */
  __referenceTime(): TimeValue {
    const reference = this.__referenceParts();
    return { hours: reference.hours, minutes: reference.minutes, seconds: reference.seconds };
  }

  /** @private */
  __onDateSelected(event: CustomEvent<{ date: Date }>) {
    const date = event.detail.date;
    const current = this.__currentParts();
    const reference = this.__referenceParts();
    const parts: DateTimeParts = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hours: current ? current.hours : reference.hours,
      minutes: current ? current.minutes : reference.minutes,
      seconds: current ? current.seconds : reference.seconds,
    };
    this.__applyParts(parts);
    if (this.autoApply && !this._timeConfig.hasTime) {
      // Plain date pattern: behave like a date picker and close on selection
      this.close();
      return;
    }
    this.__trackPickedPart('date');
  }

  /** @private */
  __onTimeSelected(event: CustomEvent<TimeValue & { changedPart?: string; stepped?: boolean }>) {
    const time = event.detail;
    const base = this.__currentParts() ?? this.__referenceParts();
    const parts: DateTimeParts = {
      year: base.year,
      month: base.month,
      day: base.day,
      hours: time.hours,
      minutes: time.minutes,
      seconds: time.seconds,
    };
    this.__applyParts(parts);
    // Arrow-key stepping (`stepped`) adjusts the value without counting as a
    // pick: closing on the first keystroke would make values beyond one step
    // unreachable by keyboard
    if (time.changedPart && !time.stepped) {
      this.__trackPickedPart(time.changedPart);
    }
  }

  /**
   * Records an explicitly picked part and, with `closeOnComplete` in
   * auto-apply mode, closes the popup once every part the format offers
   * (the date and each visible time part, including AM/PM in 12-hour
   * formats) has been picked since the popup opened.
   * @private
   */
  __trackPickedPart(part: string) {
    this.__pickedParts.add(part);
    if (!this.closeOnComplete || !this.autoApply || !this.opened) {
      return;
    }
    const config = this._timeConfig;
    const required = [
      config.hasDate ? 'date' : null,
      config.showHours ? 'hours' : null,
      config.showMinutes ? 'minutes' : null,
      config.showSeconds ? 'seconds' : null,
      config.showMeridiem ? 'meridiem' : null,
    ].filter((p): p is string => p !== null);
    if (required.every((p) => this.__pickedParts.has(p))) {
      this.close();
    }
  }

  /** @private */
  __applyParts(parts: DateTimeParts) {
    if (this.autoApply) {
      this.__commitParts(parts);
    } else {
      this._stagedParts = parts;
    }
  }

  /** @private */
  __onApplyAction() {
    if (this._stagedParts) {
      this.__commitParts(this._stagedParts);
      this._stagedParts = null;
    }
    this.close();
  }

  /** @private */
  __onCancelAction() {
    this._stagedParts = null;
    this.close();
  }

  /** @private */
  __commitParts(parts: DateTimeParts) {
    const iso = toIsoDateTime(parts);
    if (iso !== this.value) {
      this.value = iso;
      this.dispatchEvent(new CustomEvent('change', { bubbles: true }));
    }
    this.__requestValidation();
  }

  /** @private */
  __commitInputValue() {
    const text = (((this as any)._inputElementValue as string) || '').trim();
    const oldValue = this.value;

    if (!text) {
      this.value = '';
    } else {
      const parts = parseDateTime(this.__tokens, text, this.__meridiems());
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
    this.__requestValidation();
  }

  /**
   * The text shown above the fullscreen Date/Time tabs: the value being
   * chosen (staged or committed), formatted with the field's format;
   * the format pattern itself while nothing is selected yet.
   * @private
   */
  __overlayHeaderText(): string {
    const parts = this.__currentParts();
    return parts ? formatDateTime(this.__tokens, parts, this.__meridiems()) : this.format;
  }

  /** @private */
  __selectedDate(): Date | null {
    const parts = this.__currentParts();
    return parts ? partsToDate(parts) : null;
  }

  /** @private */
  __timeValue(): TimeValue | null {
    const parts = this.__currentParts();
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

}

defineCustomElement(DateTimeComboPicker);

export { DateTimeComboPicker };
