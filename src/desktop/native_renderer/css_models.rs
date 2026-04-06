use std::sync::Arc;

use eframe::egui::{self, Color32, CornerRadius, Margin};
use serde_json::{Map, Value};

#[derive(Clone, Copy, Default)]
pub(crate) struct DesktopPseudoState {
    pub(crate) enabled: bool,
    pub(crate) disabled: bool,
    pub(crate) hovered: bool,
    pub(crate) active: bool,
    pub(crate) focused: bool,
    pub(crate) focus_within: bool,
    pub(crate) checked: bool,
    pub(crate) selected: bool,
    pub(crate) read_only: bool,
    pub(crate) read_write: bool,
    pub(crate) placeholder_shown: bool,
    pub(crate) invalid: bool,
    pub(crate) valid: bool,
}

#[derive(Clone, Copy, Default)]
pub(crate) struct DesktopBoxEdges {
    pub(crate) top: f32,
    pub(crate) right: f32,
    pub(crate) bottom: f32,
    pub(crate) left: f32,
}

#[derive(Clone, Copy, Default)]
pub(crate) struct DesktopGridTrackSpec {
    pub(crate) fixed_width: Option<f32>,
    pub(crate) min_width: f32,
    pub(crate) flex_weight: f32,
}

#[derive(Clone, Default)]
pub(crate) struct DesktopGridLayoutSpec {
    pub(crate) column_widths: Vec<f32>,
}

#[derive(Clone, Default)]
pub(crate) struct DesktopWidgetStateStyles {
    pub(crate) inactive: Option<Map<String, Value>>,
    pub(crate) hovered: Option<Map<String, Value>>,
    pub(crate) active: Option<Map<String, Value>>,
    pub(crate) focus: Option<Map<String, Value>>,
    pub(crate) disabled: Option<Map<String, Value>>,
}

impl DesktopBoxEdges {
    pub(crate) fn is_zero(self) -> bool {
        self.top.abs() < f32::EPSILON
            && self.right.abs() < f32::EPSILON
            && self.bottom.abs() < f32::EPSILON
            && self.left.abs() < f32::EPSILON
    }

    pub(crate) fn to_margin(self) -> Margin {
        Margin {
            left: round_margin_value(self.left),
            right: round_margin_value(self.right),
            top: round_margin_value(self.top),
            bottom: round_margin_value(self.bottom),
        }
    }

    pub(crate) fn average_horizontal(self) -> f32 {
        ((self.left + self.right) / 2.0).max(0.0)
    }

    pub(crate) fn average_vertical(self) -> f32 {
        ((self.top + self.bottom) / 2.0).max(0.0)
    }
}

#[derive(Clone, Copy, Default)]
pub(crate) struct DesktopCornerRadii {
    pub(crate) top_left: f32,
    pub(crate) top_right: f32,
    pub(crate) bottom_right: f32,
    pub(crate) bottom_left: f32,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub(crate) enum DesktopFontVariant {
    Regular,
    Bold,
    Italic,
    BoldItalic,
}

impl DesktopFontVariant {
    pub(crate) fn suffix(self) -> &'static str {
        match self {
            Self::Regular => "regular",
            Self::Bold => "bold",
            Self::Italic => "italic",
            Self::BoldItalic => "bold-italic",
        }
    }
}

#[derive(Clone, Default)]
pub(crate) struct DesktopFontFaces {
    pub(crate) regular: Option<Arc<str>>,
    pub(crate) bold: Option<Arc<str>>,
    pub(crate) italic: Option<Arc<str>>,
    pub(crate) bold_italic: Option<Arc<str>>,
}

impl DesktopFontFaces {
    pub(crate) fn set(&mut self, variant: DesktopFontVariant, family_name: Arc<str>) {
        match variant {
            DesktopFontVariant::Regular => self.regular = Some(family_name),
            DesktopFontVariant::Bold => self.bold = Some(family_name),
            DesktopFontVariant::Italic => self.italic = Some(family_name),
            DesktopFontVariant::BoldItalic => self.bold_italic = Some(family_name),
        }
    }

    pub(crate) fn has_any(&self) -> bool {
        self.regular.is_some() || self.bold.is_some() || self.italic.is_some() || self.bold_italic.is_some()
    }

    pub(crate) fn resolve_font_family(&self, want_bold: bool, want_italic: bool) -> Option<(egui::FontFamily, bool, bool)> {
        let resolved = if want_bold && want_italic {
            self.bold_italic
                .as_ref()
                .map(|family| (family.clone(), true, true))
                .or_else(|| self.bold.as_ref().map(|family| (family.clone(), true, false)))
                .or_else(|| self.italic.as_ref().map(|family| (family.clone(), false, true)))
                .or_else(|| self.regular.as_ref().map(|family| (family.clone(), false, false)))
        } else if want_bold {
            self.bold
                .as_ref()
                .map(|family| (family.clone(), true, false))
                .or_else(|| self.regular.as_ref().map(|family| (family.clone(), false, false)))
        } else if want_italic {
            self.italic
                .as_ref()
                .map(|family| (family.clone(), false, true))
                .or_else(|| self.regular.as_ref().map(|family| (family.clone(), false, false)))
        } else {
            self.regular
                .as_ref()
                .map(|family| (family.clone(), false, false))
                .or_else(|| self.bold.as_ref().map(|family| (family.clone(), true, false)))
                .or_else(|| self.italic.as_ref().map(|family| (family.clone(), false, true)))
                .or_else(|| self.bold_italic.as_ref().map(|family| (family.clone(), true, true)))
        }?;

        Some((egui::FontFamily::Name(resolved.0), resolved.1, resolved.2))
    }
}

impl DesktopCornerRadii {
    pub(crate) fn to_corner_radius(self) -> CornerRadius {
        CornerRadius {
            nw: round_corner_value(self.top_left),
            ne: round_corner_value(self.top_right),
            se: round_corner_value(self.bottom_right),
            sw: round_corner_value(self.bottom_left),
        }
    }
}

pub(crate) fn round_margin_value(value: f32) -> i8 {
    value.round().clamp(i8::MIN as f32, i8::MAX as f32) as i8
}

pub(crate) fn round_corner_value(value: f32) -> u8 {
    value.round().clamp(0.0, u8::MAX as f32) as u8
}

#[derive(Clone, Copy)]
pub(crate) struct CssMeasureContext {
    pub(crate) basis: Option<f32>,
    pub(crate) viewport_width: Option<f32>,
    pub(crate) viewport_height: Option<f32>,
}

impl CssMeasureContext {
    pub(crate) fn from_basis(basis: Option<f32>) -> Self {
        Self {
            basis,
            viewport_width: basis,
            viewport_height: basis,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub(crate) struct DesktopGradientStop {
    pub(crate) position: f32,
    pub(crate) color: Color32,
}

#[derive(Clone, Debug, PartialEq)]
pub(crate) struct DesktopLinearGradient {
    pub(crate) angle_deg: f32,
    pub(crate) stops: Vec<DesktopGradientStop>,
}

#[derive(Clone, Debug, PartialEq)]
pub(crate) struct DesktopRadialGradient {
    pub(crate) stops: Vec<DesktopGradientStop>,
    /// horizontal center as fraction of bounding box width (0.0 = left, 0.5 = center, 1.0 = right)
    pub(crate) center_x: f32,
    /// vertical center as fraction of bounding box height (0.0 = top, 0.5 = center, 1.0 = bottom)
    pub(crate) center_y: f32,
}

#[derive(Clone, Debug, Default)]
pub(crate) struct DesktopCssFilter {
    pub(crate) brightness: f32,
    pub(crate) contrast: f32,
    pub(crate) grayscale: f32,
    pub(crate) invert: f32,
    pub(crate) sepia: f32,
    pub(crate) saturate: f32,
    pub(crate) hue_rotate_deg: f32,
    pub(crate) blur: f32,
}

impl DesktopCssFilter {
    pub(crate) fn new() -> Self {
        Self {
            brightness: 1.0,
            contrast: 1.0,
            grayscale: 0.0,
            invert: 0.0,
            sepia: 0.0,
            saturate: 1.0,
            hue_rotate_deg: 0.0,
            blur: 0.0,
        }
    }

    #[allow(dead_code)]
    pub(crate) fn has_color_effect(&self) -> bool {
        (self.brightness - 1.0).abs() > 0.001
            || (self.contrast - 1.0).abs() > 0.001
            || self.grayscale > 0.001
            || self.invert > 0.001
            || self.sepia > 0.001
            || (self.saturate - 1.0).abs() > 0.001
            || self.hue_rotate_deg.abs() > 0.5
    }

    pub(crate) fn apply(&self, color: Color32) -> Color32 {
        let r = color.r() as f32 / 255.0;
        let g = color.g() as f32 / 255.0;
        let b = color.b() as f32 / 255.0;
        let a = color.a() as f32 / 255.0;

        let (mut r, mut g, mut b) = (r * self.brightness, g * self.brightness, b * self.brightness);

        let contrast = self.contrast;
        r = (r - 0.5) * contrast + 0.5;
        g = (g - 0.5) * contrast + 0.5;
        b = (b - 0.5) * contrast + 0.5;

        let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r += (luminance - r) * self.grayscale;
        g += (luminance - g) * self.grayscale;
        b += (luminance - b) * self.grayscale;

        let sepia = self.sepia;
        let sr = r * (0.393 + 0.607 * (1.0 - sepia))
            + g * (0.769 - 0.769 * (1.0 - sepia))
            + b * (0.189 - 0.189 * (1.0 - sepia));
        let sg = r * (0.349 - 0.349 * (1.0 - sepia))
            + g * (0.686 + 0.314 * (1.0 - sepia))
            + b * (0.168 - 0.168 * (1.0 - sepia));
        let sb = r * (0.272 - 0.272 * (1.0 - sepia))
            + g * (0.534 - 0.534 * (1.0 - sepia))
            + b * (0.131 + 0.869 * (1.0 - sepia));
        r = sr;
        g = sg;
        b = sb;

        let saturated_luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = saturated_luminance + (r - saturated_luminance) * self.saturate;
        g = saturated_luminance + (g - saturated_luminance) * self.saturate;
        b = saturated_luminance + (b - saturated_luminance) * self.saturate;

        r += (1.0 - 2.0 * r) * self.invert;
        g += (1.0 - 2.0 * g) * self.invert;
        b += (1.0 - 2.0 * b) * self.invert;

        if self.hue_rotate_deg.abs() > 0.5 {
            let radians = self.hue_rotate_deg.to_radians();
            let cos_a = radians.cos();
            let sin_a = radians.sin();
            let rotated_r = r * (0.213 + cos_a * 0.787 - sin_a * 0.213)
                + g * (0.715 - cos_a * 0.715 - sin_a * 0.715)
                + b * (0.072 - cos_a * 0.072 + sin_a * 0.928);
            let rotated_g = r * (0.213 - cos_a * 0.213 + sin_a * 0.143)
                + g * (0.715 + cos_a * 0.285 + sin_a * 0.140)
                + b * (0.072 - cos_a * 0.072 - sin_a * 0.283);
            let rotated_b = r * (0.213 - cos_a * 0.213 - sin_a * 0.787)
                + g * (0.715 - cos_a * 0.715 + sin_a * 0.715)
                + b * (0.072 + cos_a * 0.928 + sin_a * 0.072);
            r = rotated_r;
            g = rotated_g;
            b = rotated_b;
        }

        let to_u8 = |value: f32| (value.clamp(0.0, 1.0) * 255.0).round() as u8;
        Color32::from_rgba_unmultiplied(to_u8(r), to_u8(g), to_u8(b), (a * 255.0).round() as u8)
    }
}

#[derive(Clone, Debug, Default)]
pub(crate) struct DesktopCssTransform {
    pub(crate) translate_x: f32,
    pub(crate) translate_y: f32,
    pub(crate) scale_x: f32,
    pub(crate) scale_y: f32,
    pub(crate) rotate_deg: f32,
}

impl DesktopCssTransform {
    pub(crate) fn identity() -> Self {
        Self {
            translate_x: 0.0,
            translate_y: 0.0,
            scale_x: 1.0,
            scale_y: 1.0,
            rotate_deg: 0.0,
        }
    }

    #[allow(dead_code)]
    pub(crate) fn has_any(&self) -> bool {
        self.translate_x.abs() > f32::EPSILON
            || self.translate_y.abs() > f32::EPSILON
            || (self.scale_x - 1.0).abs() > 0.001
            || (self.scale_y - 1.0).abs() > 0.001
            || self.rotate_deg.abs() > 0.01
    }
}

#[derive(Clone, Debug)]
pub(crate) struct DesktopTextShadow {
    pub(crate) offset_x: f32,
    pub(crate) offset_y: f32,
    #[allow(dead_code)]
    pub(crate) blur_radius: f32,
    pub(crate) color: Color32,
}

#[derive(Default, Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) struct DesktopOverflowBehavior {
    pub(crate) horizontal_scroll: bool,
    pub(crate) vertical_scroll: bool,
    pub(crate) horizontal_clip: bool,
    pub(crate) vertical_clip: bool,
}

impl DesktopOverflowBehavior {
    pub(crate) fn has_scroll(self) -> bool {
        self.horizontal_scroll || self.vertical_scroll
    }

    pub(crate) fn has_clip(self) -> bool {
        self.horizontal_clip || self.vertical_clip
    }
}