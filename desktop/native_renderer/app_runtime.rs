use eframe::egui;
use serde_json::Value;

use super::{DesktopNativeApp, NativeElementNode, NativeNode};

impl DesktopNativeApp {
    pub(super) fn resolve_prop_number(&self, node: &NativeElementNode, key: &str) -> Option<f32> {
        Self::parse_css_number(node.props.get(key))
    }

    pub(super) fn resolve_prop_string<'a>(&self, node: &'a NativeElementNode, key: &str) -> Option<&'a str> {
        node.props.get(key).and_then(Value::as_str).map(str::trim).filter(|value| !value.is_empty())
    }

    pub(super) fn resolve_label(&self, node: &NativeElementNode) -> Option<String> {
        ["aria-label", "label", "title", "name", "alt"]
            .iter()
            .find_map(|key| self.resolve_prop_string(node, key).map(str::to_string))
            .or_else(|| {
                let text = self.collect_text_content(&NativeNode::Element(node.clone()));
                let trimmed = text.trim();
                (!trimmed.is_empty()).then_some(trimmed.to_string())
            })
    }

    pub(super) fn is_disabled(&self, node: &NativeElementNode) -> bool {
        super::parse_native_bool(node.props.get("disabled")) || super::parse_native_bool(node.props.get("aria-disabled"))
    }

    pub(super) fn is_read_only(&self, node: &NativeElementNode) -> bool {
        super::parse_native_bool(node.props.get("readOnly")) || super::parse_native_bool(node.props.get("readonly"))
    }

    pub(super) fn has_focusable_tab_index(&self, node: &NativeElementNode) -> bool {
        node.props
            .get("tabIndex")
            .or_else(|| node.props.get("tabindex"))
            .and_then(|value| match value {
                Value::Number(number) => number.as_i64(),
                Value::String(text) => text.trim().parse::<i64>().ok(),
                _ => None,
            })
            .map(|value| value >= 0)
            .unwrap_or(false)
    }

    pub(super) fn render_node(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeNode, path: &str) {
        match node {
            NativeNode::Text(text_node) => {
                ui.label(self.resolve_text_node_value(text_node));
            }
            NativeNode::Element(element_node) => match element_node.component.as_str() {
                "Text" => self.render_text_element(ui, element_node),
                "Button" => self.render_button(ui, ctx, element_node),
                "Link" => self.render_link(ui, ctx, element_node),
                "TextInput" => self.render_text_input(ui, ctx, element_node, path),
                "Toggle" => self.render_toggle(ui, ctx, element_node, path),
                "Slider" => self.render_slider(ui, ctx, element_node, path),
                "Picker" => self.render_picker(ui, ctx, element_node, path),
                "Option" => self.render_text_element(ui, element_node),
                "Divider" => self.render_divider(ui),
                "Progress" => self.render_progress(ui, element_node),
                "Image" => self.render_image(ui, ctx, element_node),
                "WebView" => self.render_web_view(ui, element_node, path),
                "Media" => self.render_media(ui, ctx, element_node, path),
                "Canvas" => self.render_canvas(ui, element_node),
                "Vector" => self.render_vector(ui, element_node),
                "Math" => self.render_math(ui, element_node),
                "Table" => self.render_table(ui, ctx, element_node, path),
                "Row" => self.render_row(ui, ctx, element_node, path),
                "Cell" => self.render_cell(ui, ctx, element_node, path),
                "ListItem" => self.render_list_item(ui, ctx, element_node, path),
                "List" => self.render_list(ui, ctx, element_node, path),
                "Screen" | "View" => self.render_container(ui, ctx, element_node, path),
                _ => self.render_surface_placeholder(ui, &element_node.component, "Desktop native fallback surface"),
            },
        }
    }

    fn render_navigation_bar(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        if self.navigation.current_route().is_none() && !self.navigation.can_go_forward() {
            return;
        }

        ui.horizontal(|ui| {
            if ui.add_enabled(self.navigation.can_go_back(), egui::Button::new("Back")).clicked() {
                self.navigation.go_back();
                self.apply_navigation_title(ctx);
            }

            if ui.add_enabled(self.navigation.can_go_forward(), egui::Button::new("Forward")).clicked() {
                self.navigation.go_forward();
                self.apply_navigation_title(ctx);
            }

            if ui.add_enabled(self.navigation.current_route().is_some(), egui::Button::new("Reset")).clicked() {
                self.navigation.clear();
                self.apply_navigation_title(ctx);
            }

            ui.small(self.navigation.current_route().unwrap_or("/"));
        });
        ui.separator();
    }

    fn render_last_interaction_summary(&self, ui: &mut egui::Ui) {
        if let Some(interaction) = &self.last_interaction {
            ui.separator();
            ui.small(format!("Last interaction: {}", interaction.summary()));
        }
    }
}

impl eframe::App for DesktopNativeApp {
    fn update(&mut self, ctx: &egui::Context, frame: &mut eframe::Frame) {
        let roots = self.payload.tree.roots.clone();
        self.viewport_size = ctx.screen_rect().size();
        self.ensure_fonts_loaded(ctx);
        self.emit_ready_interaction();

        egui::CentralPanel::default().show(ctx, |ui| {
            egui::ScrollArea::vertical().auto_shrink([false, false]).show(ui, |ui| {
                self.render_navigation_bar(ui, ctx);

                for (index, root) in roots.iter().enumerate() {
                    self.render_node(ui, ctx, root, &format!("root-{index}"));
                }

                self.render_last_interaction_summary(ui);
            });
        });

        self.reconcile_embedded_surfaces(frame);

        if self.pending_auto_close {
            self.pending_auto_close = false;
            ctx.send_viewport_cmd(egui::ViewportCommand::Close);
        }
    }
}