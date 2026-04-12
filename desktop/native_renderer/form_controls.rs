use eframe::egui::{self, Ui};
use serde_json::Value;

use super::app_models::{DesktopControlEventData, PickerOptionData};
use super::utilities::{
    build_event_payload, control_event_action, format_number, parse_native_bool,
    resolve_control_event_input_type, resolve_interaction, should_dispatch_control_event,
    value_as_string,
};
use super::{DesktopNativeApp, DesktopStateValue, NativeElementNode, NativeNode};

impl DesktopNativeApp {
    fn dispatch_control_events(
        &mut self,
        ctx: &egui::Context,
        node: &NativeElementNode,
        event_data: DesktopControlEventData,
    ) {
        let input_type = resolve_control_event_input_type(node);

        for event_name in ["input", "change"] {
            if !should_dispatch_control_event(node, event_name) {
                continue;
            }

            let payload = build_event_payload(node, event_name, input_type.clone(), &event_data);
            if let Some(interaction) = resolve_interaction(node, Some(control_event_action(node, event_name)), Some(payload)) {
                self.dispatch_interaction(ctx, interaction);
            }
        }
    }

    pub(super) fn render_text_input(&mut self, ui: &mut Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let binding = self.get_binding_reference(node);
        let disabled = self.is_disabled(node);
        let read_only = self.is_read_only(node);
        let input_type = resolve_control_event_input_type(node).unwrap_or_else(|| String::from("text"));
        let placeholder = self.resolve_prop_string(node, "placeholder").unwrap_or_default();
        let mut value = if let Some(binding) = &binding {
            self.state_values
                .get(&binding.id)
                .map(DesktopStateValue::as_text_input_value)
                .unwrap_or_else(|| node.props.get("value").and_then(value_as_string).unwrap_or_default())
        } else {
            self.local_text_inputs
                .get(path)
                .cloned()
                .or_else(|| node.props.get("value").and_then(value_as_string))
                .unwrap_or_default()
        };

        let available_width = ui.available_width().max(1.0);
        let mut base_state = self.base_pseudo_state(node);
        base_state.placeholder_shown = !placeholder.is_empty() && value.trim().is_empty();
        let state_styles = self.resolve_widget_state_styles(node, base_state);
        let inactive_style = state_styles.inactive.as_ref();
        let padding = Self::resolve_box_edges(inactive_style, "padding").filter(|padding| !padding.is_zero());
        let desired_width = self.resolve_widget_width_from_style(inactive_style, available_width);
        let (font_id, _, _) = self.resolve_text_font_id(ui, inactive_style);
        let resolved_font_size = font_id
            .as_ref()
            .map(|font_id| font_id.size)
            .unwrap_or_else(|| egui::TextStyle::Body.resolve(ui.style().as_ref()).size);
        let desired_rows = if node.source_tag == "textarea" {
            inactive_style
                .and_then(|style| {
                    let line_height = Self::resolve_text_line_height(
                        Some(style),
                        resolved_font_size,
                        self.css_measure_context(Some(resolved_font_size)),
                    )
                    .unwrap_or(resolved_font_size * 1.35);
                    let target_height = self
                        .parse_css_number_with_viewport(style.get("height"))
                        .or_else(|| self.parse_css_number_with_viewport(style.get("minHeight")))?;
                    let inner_vertical = padding.map(|padding| padding.top + padding.bottom).unwrap_or(0.0);
                    Some(((target_height - inner_vertical).max(line_height) / line_height).round().max(1.0) as usize)
                })
                .unwrap_or(4)
        } else {
            1
        };
        let text_color = Self::resolve_text_color_from_style(if disabled {
            state_styles.disabled.as_ref().or(inactive_style)
        } else {
            inactive_style
        });

        let response = ui
            .scope(|ui| {
                self.apply_widget_state_visuals(
                    ui,
                    inactive_style,
                    state_styles.hovered.as_ref(),
                    state_styles.active.as_ref(),
                    state_styles.focus.as_ref(),
                    state_styles.disabled.as_ref(),
                );

                let mut text_edit = if node.source_tag == "textarea" {
                    egui::TextEdit::multiline(&mut value).desired_rows(desired_rows)
                } else {
                    egui::TextEdit::singleline(&mut value)
                };

                if let Some(padding) = padding {
                    text_edit = text_edit.margin(padding.to_margin());
                }
                if let Some(font_id) = font_id.clone() {
                    text_edit = text_edit.font(font_id);
                }
                if let Some(text_color) = text_color {
                    text_edit = text_edit.text_color_opt(Some(text_color));
                }
                if let Some(desired_width) = desired_width {
                    text_edit = text_edit.desired_width(desired_width);
                }
                if !placeholder.is_empty() {
                    text_edit = text_edit.hint_text(placeholder);
                }
                if input_type == "password" {
                    text_edit = text_edit.password(true);
                }
                if read_only {
                    text_edit = text_edit.interactive(false);
                }

                if disabled {
                    ui.add_enabled(false, text_edit)
                } else {
                    ui.add(text_edit)
                }
            })
            .inner;

        if response.changed() {
            if let Some(binding) = binding {
                let next_value = match binding.value_type.as_str() {
                    "number" => value
                        .parse::<f64>()
                        .map(DesktopStateValue::Number)
                        .unwrap_or_else(|_| DesktopStateValue::Number(0.0)),
                    "boolean" => DesktopStateValue::Boolean(parse_native_bool(Some(&Value::String(value.clone())))),
                    "string-array" => DesktopStateValue::StringArray(
                        value
                            .split(',')
                            .map(str::trim)
                            .filter(|entry| !entry.is_empty())
                            .map(str::to_string)
                            .collect(),
                    ),
                    _ => DesktopStateValue::String(value.clone()),
                };
                self.state_values.insert(binding.id, next_value);
            } else {
                self.local_text_inputs.insert(path.to_string(), value.clone());
            }

            self.dispatch_control_events(
                ctx,
                node,
                DesktopControlEventData {
                    value: Some(value),
                    ..Default::default()
                },
            );
        }
    }

    pub(super) fn render_toggle(&mut self, ui: &mut Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let binding = self.get_binding_reference(node);
        let disabled = self.is_disabled(node);
        let mut checked = if let Some(binding) = &binding {
            self.state_values
                .get(&binding.id)
                .map(DesktopStateValue::as_bool)
                .unwrap_or_else(|| parse_native_bool(node.props.get("checked")))
        } else {
            self.local_toggles
                .get(path)
                .copied()
                .unwrap_or_else(|| parse_native_bool(node.props.get("checked")))
        };
        let label = self.resolve_label(node).unwrap_or_default();
        let mut base_state = self.base_pseudo_state(node);
        base_state.checked = checked;
        let state_styles = self.resolve_widget_state_styles(node, base_state);
        let inactive_style = state_styles.inactive.as_ref();
        let min_size = self.resolve_widget_min_size(inactive_style);
        let response = ui
            .scope(|ui| {
                self.apply_widget_state_visuals(
                    ui,
                    inactive_style,
                    state_styles.hovered.as_ref(),
                    state_styles.active.as_ref(),
                    state_styles.focus.as_ref(),
                    state_styles.disabled.as_ref(),
                );

                if min_size.x > 0.0 {
                    ui.spacing_mut().icon_width = min_size.x;
                    ui.spacing_mut().icon_width_inner = (min_size.x * (8.0 / 14.0)).clamp(4.0, min_size.x.max(4.0));
                    ui.spacing_mut().interact_size.x = ui.spacing().interact_size.x.max(min_size.x);
                }
                if min_size.y > 0.0 {
                    ui.spacing_mut().interact_size.y = ui.spacing().interact_size.y.max(min_size.y);
                }

                ui.add_enabled(!disabled, egui::Checkbox::new(&mut checked, label.clone()))
            })
            .inner;

        if response.changed() {
            if let Some(binding) = binding {
                self.state_values.insert(binding.id, DesktopStateValue::Boolean(checked));
            } else {
                self.local_toggles.insert(path.to_string(), checked);
            }

            self.dispatch_control_events(
                ctx,
                node,
                DesktopControlEventData {
                    checked: Some(checked),
                    ..Default::default()
                },
            );
        }
    }

    pub(super) fn render_slider(&mut self, ui: &mut Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let binding = self.get_binding_reference(node);
        let disabled = self.is_disabled(node);
        let min = node.props.get("min").and_then(Value::as_f64).unwrap_or(0.0);
        let max = node.props.get("max").and_then(Value::as_f64).unwrap_or(100.0);
        let step = node.props.get("step").and_then(Value::as_f64).filter(|value| *value > 0.0);
        let mut value = if let Some(binding) = &binding {
            match self.state_values.get(&binding.id) {
                Some(DesktopStateValue::Number(number)) => *number,
                Some(DesktopStateValue::String(text)) => text.parse::<f64>().unwrap_or(min),
                _ => node.props.get("value").and_then(Value::as_f64).unwrap_or(min),
            }
        } else {
            self.local_slider_values
                .get(path)
                .copied()
                .or_else(|| node.props.get("value").and_then(Value::as_f64))
                .unwrap_or(min)
        };
        let state_styles = self.resolve_widget_state_styles(node, self.base_pseudo_state(node));
        let inactive_style = state_styles.inactive.as_ref();
        let desired_width = self.resolve_widget_width_from_style(inactive_style, ui.available_width().max(1.0));
        let min_size = self.resolve_widget_min_size(inactive_style);
        let response = ui
            .scope(|ui| {
                self.apply_widget_state_visuals(
                    ui,
                    inactive_style,
                    state_styles.hovered.as_ref(),
                    state_styles.active.as_ref(),
                    state_styles.focus.as_ref(),
                    state_styles.disabled.as_ref(),
                );

                if let Some(desired_width) = desired_width {
                    ui.spacing_mut().slider_width = desired_width;
                }
                if min_size.y > 0.0 {
                    ui.spacing_mut().interact_size.y = ui.spacing().interact_size.y.max(min_size.y);
                }

                let mut slider = egui::Slider::new(&mut value, min..=max);
                if let Some(step) = step {
                    slider = slider.step_by(step);
                }
                if let Some(label) = self.resolve_label(node) {
                    slider = slider.text(label);
                }

                ui.add_enabled(!disabled, slider)
            })
            .inner;

        if response.changed() {
            if let Some(binding) = binding {
                let next_value = match binding.value_type.as_str() {
                    "string" => DesktopStateValue::String(format_number(value)),
                    _ => DesktopStateValue::Number(value),
                };
                self.state_values.insert(binding.id, next_value);
            } else {
                self.local_slider_values.insert(path.to_string(), value);
            }

            self.dispatch_control_events(
                ctx,
                node,
                DesktopControlEventData {
                    value: Some(format_number(value)),
                    ..Default::default()
                },
            );
        }
    }

    pub(super) fn collect_picker_options(&self, node: &NativeElementNode) -> Vec<PickerOptionData> {
        node.children
            .iter()
            .filter_map(|child| match child {
                NativeNode::Element(element_node) if element_node.component == "Option" => Some(PickerOptionData {
                    label: self.collect_text_content(child).trim().to_string(),
                    value: element_node
                        .props
                        .get("value")
                        .and_then(value_as_string)
                        .unwrap_or_else(|| self.collect_text_content(child).trim().to_string()),
                    disabled: parse_native_bool(element_node.props.get("disabled")),
                    selected: parse_native_bool(element_node.props.get("selected")),
                }),
                _ => None,
            })
            .collect()
    }

    pub(super) fn render_picker(&mut self, ui: &mut Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let binding = self.get_binding_reference(node);
        let disabled = self.is_disabled(node);
        let options = self.collect_picker_options(node);
        let multiple = parse_native_bool(node.props.get("multiple"));

        if multiple {
            let mut values = if let Some(binding) = &binding {
                match self.state_values.get(&binding.id) {
                    Some(DesktopStateValue::StringArray(values)) => values.clone(),
                    Some(DesktopStateValue::String(value)) => vec![value.clone()],
                    _ => Vec::new(),
                }
            } else {
                self.local_multi_picker_values
                    .get(path)
                    .cloned()
                    .unwrap_or_else(|| {
                        options
                            .iter()
                            .filter(|option| option.selected)
                            .map(|option| option.value.clone())
                            .collect()
                    })
            };

            let mut changed = false;
            let mut base_state = self.base_pseudo_state(node);
            base_state.selected = !values.is_empty();
            let state_styles = self.resolve_widget_state_styles(node, base_state);
            let inactive_style = state_styles.inactive.as_ref();
            let min_size = self.resolve_widget_min_size(inactive_style);
            ui.scope(|ui| {
                self.apply_widget_state_visuals(
                    ui,
                    inactive_style,
                    state_styles.hovered.as_ref(),
                    state_styles.active.as_ref(),
                    state_styles.focus.as_ref(),
                    state_styles.disabled.as_ref(),
                );

                if min_size.x > 0.0 {
                    ui.spacing_mut().icon_width = min_size.x;
                    ui.spacing_mut().icon_width_inner = (min_size.x * (8.0 / 14.0)).clamp(4.0, min_size.x.max(4.0));
                    ui.spacing_mut().interact_size.x = ui.spacing().interact_size.x.max(min_size.x);
                }
                if min_size.y > 0.0 {
                    ui.spacing_mut().interact_size.y = ui.spacing().interact_size.y.max(min_size.y);
                }

                ui.vertical(|ui| {
                    for option in &options {
                        let mut checked = values.iter().any(|value| value == &option.value);
                        let response = ui.add_enabled(!disabled && !option.disabled, egui::Checkbox::new(&mut checked, &option.label));
                        if response.changed() {
                            changed = true;
                            if checked {
                                if !values.iter().any(|value| value == &option.value) {
                                    values.push(option.value.clone());
                                }
                            } else {
                                values.retain(|value| value != &option.value);
                            }
                        }
                    }
                });
            });

            if changed {
                values.sort();
                if let Some(binding) = binding {
                    self.state_values.insert(binding.id, DesktopStateValue::StringArray(values.clone()));
                } else {
                    self.local_multi_picker_values.insert(path.to_string(), values.clone());
                }

                self.dispatch_control_events(
                    ctx,
                    node,
                    DesktopControlEventData {
                        values: Some(values),
                        ..Default::default()
                    },
                );
            }

            return;
        }

        let mut selected_value = if let Some(binding) = &binding {
            match self.state_values.get(&binding.id) {
                Some(DesktopStateValue::String(value)) => value.clone(),
                Some(DesktopStateValue::Number(value)) => format_number(*value),
                _ => String::new(),
            }
        } else {
            self.local_picker_values
                .get(path)
                .cloned()
                .or_else(|| node.props.get("value").and_then(value_as_string))
                .or_else(|| options.iter().find(|option| option.selected).map(|option| option.value.clone()))
                .unwrap_or_default()
        };

        let selected_label = options
            .iter()
            .find(|option| option.value == selected_value)
            .map(|option| option.label.clone())
            .unwrap_or_else(|| {
                if selected_value.is_empty() {
                    String::from("Select")
                } else {
                    selected_value.clone()
                }
            });
        let previous_value = selected_value.clone();
        let mut base_state = self.base_pseudo_state(node);
        base_state.selected = !selected_value.is_empty();
        let state_styles = self.resolve_widget_state_styles(node, base_state);
        let inactive_style = state_styles.inactive.as_ref();
        let desired_width = self.resolve_widget_width_from_style(inactive_style, ui.available_width().max(1.0));
        let min_size = self.resolve_widget_min_size(inactive_style);

        ui.scope(|ui| {
            self.apply_widget_state_visuals(
                ui,
                inactive_style,
                state_styles.hovered.as_ref(),
                state_styles.active.as_ref(),
                state_styles.focus.as_ref(),
                state_styles.disabled.as_ref(),
            );

            if let Some(desired_width) = desired_width {
                ui.spacing_mut().interact_size.x = ui.spacing().interact_size.x.max(desired_width);
            }
            if min_size.y > 0.0 {
                ui.spacing_mut().interact_size.y = ui.spacing().interact_size.y.max(min_size.y);
            }

            ui.add_enabled_ui(!disabled, |ui| {
                let mut combo_box = egui::ComboBox::from_id_salt(path).selected_text(
                    self.resolve_text_style_from_style(
                        ui,
                        if disabled {
                            state_styles.disabled.as_ref().or(inactive_style)
                        } else {
                            inactive_style
                        },
                        selected_label.clone(),
                        false,
                    ),
                );

                if let Some(desired_width) = desired_width {
                    combo_box = combo_box.width(desired_width);
                }

                combo_box.show_ui(ui, |ui| {
                    for option in &options {
                        ui.add_enabled_ui(!option.disabled, |ui| {
                            ui.selectable_value(&mut selected_value, option.value.clone(), &option.label);
                        });
                    }
                });
            });
        });

        if selected_value != previous_value {
            if let Some(binding) = binding {
                let next_value = match binding.value_type.as_str() {
                    "number" => DesktopStateValue::Number(selected_value.parse::<f64>().unwrap_or_default()),
                    _ => DesktopStateValue::String(selected_value.clone()),
                };
                self.state_values.insert(binding.id, next_value);
            } else {
                self.local_picker_values.insert(path.to_string(), selected_value.clone());
            }

            self.dispatch_control_events(
                ctx,
                node,
                DesktopControlEventData {
                    value: Some(selected_value),
                    ..Default::default()
                },
            );
        }
    }
}