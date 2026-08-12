package org.vaadin.addons.datetimecombopicker;

import com.vaadin.flow.component.page.AppShellConfigurator;

/**
 * Demo app shell. Its presence stops Flow from auto-loading the Aura theme
 * (which happens whenever no {@code AppShellConfigurator} is defined), so
 * the demo's theme switcher fully owns which theme stylesheet is active —
 * "Base" really renders the base styles, and "Lumo" is not layered on top
 * of an implicit Aura.
 */
public class DemoShell implements AppShellConfigurator {
}
