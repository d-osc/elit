use std::path::PathBuf;

use eframe::egui::Rect;
use serde::Serialize;
use serde_json::Value;
#[cfg(target_os = "windows")]
use wry::WebView;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub(crate) struct DesktopInteraction {
    pub(crate) action: Option<String>,
    pub(crate) route: Option<String>,
    pub(crate) payload: Option<Value>,
}

impl DesktopInteraction {
    pub(crate) fn is_empty(&self) -> bool {
        self.action.is_none() && self.route.is_none() && self.payload.is_none()
    }

    pub(crate) fn summary(&self) -> String {
        let mut parts = Vec::new();
        if let Some(action) = &self.action {
            parts.push(format!("action={action}"));
        }
        if let Some(route) = &self.route {
            parts.push(format!("route={route}"));
        }
        if let Some(payload) = &self.payload {
            parts.push(format!("payload={payload}"));
        }

        if parts.is_empty() {
            String::from("idle")
        } else {
            parts.join(" | ")
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct DesktopControlEventData {
    pub(crate) value: Option<String>,
    pub(crate) values: Option<Vec<String>>,
    pub(crate) checked: Option<bool>,
}

#[derive(Debug, Clone, PartialEq)]
pub(crate) struct PickerOptionData {
    pub(crate) label: String,
    pub(crate) value: String,
    pub(crate) disabled: bool,
    pub(crate) selected: bool,
}

#[derive(Debug, Clone, Default)]
pub(crate) struct ResolvedDesktopInteractionOutput {
    pub(crate) file: Option<PathBuf>,
    pub(crate) stdout: bool,
    pub(crate) emit_ready: bool,
}

#[derive(Debug, Clone, Default)]
pub(crate) struct DesktopNavigationState {
    pub(crate) history: Vec<String>,
    pub(crate) index: Option<usize>,
}

impl DesktopNavigationState {
    pub(crate) fn current_route(&self) -> Option<&str> {
        self.index.and_then(|index| self.history.get(index)).map(String::as_str)
    }

    pub(crate) fn can_go_back(&self) -> bool {
        self.index.is_some()
    }

    pub(crate) fn can_go_forward(&self) -> bool {
        match self.index {
            Some(index) => index + 1 < self.history.len(),
            None => !self.history.is_empty(),
        }
    }

    pub(crate) fn navigate_to(&mut self, route: impl Into<String>) -> bool {
        let route = route.into().trim().to_string();
        if route.is_empty() {
            return false;
        }

        if let Some(index) = self.index {
            if index + 1 < self.history.len() {
                self.history.truncate(index + 1);
            }
        } else {
            self.history.clear();
        }

        self.history.push(route);
        self.index = Some(self.history.len() - 1);
        true
    }

    pub(crate) fn go_back(&mut self) -> bool {
        match self.index {
            Some(index) if index > 0 => {
                self.index = Some(index - 1);
                true
            }
            Some(_) => {
                self.index = None;
                true
            }
            None => false,
        }
    }

    pub(crate) fn go_forward(&mut self) -> bool {
        match self.index {
            Some(index) if index + 1 < self.history.len() => {
                self.index = Some(index + 1);
                true
            }
            None if !self.history.is_empty() => {
                self.index = Some(0);
                true
            }
            _ => false,
        }
    }

    pub(crate) fn clear(&mut self) {
        self.index = None;
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum DesktopSurfaceWindowKind {
    WebView,
    Video,
    Audio,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum DesktopEmbeddedSurfaceVisibility {
    Hidden,
    Clipped,
    Visible,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) enum DesktopEmbeddedSurfaceContent {
    Url(String),
    Html(String),
}

#[derive(Clone, Debug)]
pub(crate) struct DesktopEmbeddedSurfaceRequest {
    pub(crate) kind: DesktopSurfaceWindowKind,
    pub(crate) title: String,
    pub(crate) rect: Rect,
    pub(crate) content: DesktopEmbeddedSurfaceContent,
    pub(crate) focus_requested: bool,
}

#[cfg(target_os = "windows")]
pub(crate) struct DesktopEmbeddedSurface {
    pub(crate) kind: DesktopSurfaceWindowKind,
    pub(crate) content: DesktopEmbeddedSurfaceContent,
    pub(crate) webview: WebView,
}