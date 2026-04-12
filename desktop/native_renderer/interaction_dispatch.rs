use eframe::egui;
use serde_json::{Map, Value};

use super::utilities::{is_external_destination, normalize_jsonish_value, resolve_interaction, resolve_route_from_payload, write_interaction_output};
use super::{DesktopInteraction, DesktopNativeApp, NativeElementNode};

impl DesktopNativeApp {
    pub(super) fn record_interaction(&mut self, interaction: DesktopInteraction) {
        let interaction_json = serde_json::to_string(&interaction).unwrap_or_else(|_| String::from("{}"));

        if self.interaction_output.stdout {
            println!("ELIT_NATIVE_INTERACTION {interaction_json}");
        }

        if let Err(error) = write_interaction_output(self.interaction_output.file.as_deref(), &interaction_json) {
            eprintln!("failed to write desktop native interaction output: {error}");
        }

        self.last_interaction = Some(interaction);
    }

    pub(super) fn dispatch_interaction(&mut self, ctx: &egui::Context, interaction: DesktopInteraction) {
        self.record_interaction(interaction.clone());

        match interaction.action.as_deref() {
            Some("desktop:quit") => {
                ctx.send_viewport_cmd(egui::ViewportCommand::Close);
                return;
            }
            Some("desktop:ping") => {
                ctx.send_viewport_cmd(egui::ViewportCommand::Title(format!("{} - IPC OK", self.base_title)));
                return;
            }
            Some("desktop:back") => {
                self.navigation.go_back();
                self.apply_navigation_title(ctx);
                return;
            }
            Some("desktop:forward") => {
                self.navigation.go_forward();
                self.apply_navigation_title(ctx);
                return;
            }
            Some("desktop:clear-route") => {
                self.navigation.clear();
                self.apply_navigation_title(ctx);
                return;
            }
            _ => {}
        }

        let internal_route = interaction
            .route
            .as_deref()
            .filter(|route| !is_external_destination(route))
            .map(str::to_string)
            .or_else(|| {
                (interaction.action.as_deref() == Some("desktop:navigate"))
                    .then(|| resolve_route_from_payload(interaction.payload.as_ref()))
                    .flatten()
            });

        if let Some(route) = internal_route {
            if self.navigation.navigate_to(route) {
                self.apply_navigation_title(ctx);
            }
            return;
        }

        if let Some(route) = interaction.route.as_deref() {
            if is_external_destination(route) {
                let _ = webbrowser::open(route);
            }
        }
    }

    pub(super) fn dispatch_press_event(&mut self, ctx: &egui::Context, node: &NativeElementNode) {
        let mut payload = Map::new();
        payload.insert(String::from("event"), Value::String(String::from("press")));
        payload.insert(String::from("sourceTag"), Value::String(node.source_tag.clone()));
        if let Some(detail) = node.props.get("nativePayload") {
            payload.insert(String::from("detail"), normalize_jsonish_value(detail.clone()));
        }

        if let Some(interaction) = resolve_interaction(node, Some(String::from("elit.event.press")), Some(Value::Object(payload))) {
            self.dispatch_interaction(ctx, interaction);
        }
    }
}