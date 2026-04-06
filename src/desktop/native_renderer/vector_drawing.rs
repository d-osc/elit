use eframe::egui::{self, Align2, Color32, Pos2, Rect, Sense, StrokeKind, Vec2};
use serde_json::{Map, Value};

use super::utilities::{cubic_bezier_point, parse_points_value, visible_color};
use super::{
    DesktopNativeApp, NativeDesktopCanvasSpec, NativeDesktopColor, NativeDesktopPathCommand,
    NativeDesktopVectorShape, NativeDesktopVectorSpec, NativeDesktopVectorViewport,
    NativeElementNode, NativeNode,
};

impl DesktopNativeApp {
    pub(super) fn render_vector_spec(&self, ui: &mut egui::Ui, node: &NativeElementNode, spec: &NativeDesktopVectorSpec) {
        let fallback = Vec2::new(spec.intrinsic_width.max(24.0), spec.intrinsic_height.max(24.0));
        let size = self.resolve_display_size(node, fallback);
        let (response, painter) = ui.allocate_painter(size, Sense::hover());
        let rect = response.rect;

        if let Some(fill) = self.resolve_background_color(node) {
            painter.rect_filled(rect, 0.0, fill);
        }

        for shape in &spec.shapes {
            self.draw_vector_spec_shape(&painter, rect, &spec.viewport, shape);
        }
    }

    pub(super) fn render_canvas_spec(&self, ui: &mut egui::Ui, node: &NativeElementNode, spec: &NativeDesktopCanvasSpec) {
        let vector_spec = spec.as_vector_spec();
        let fallback = Vec2::new(vector_spec.intrinsic_width.max(1.0), vector_spec.intrinsic_height.max(1.0));
        let size = self.resolve_display_size(node, fallback);
        let (response, painter) = ui.allocate_painter(size, Sense::hover());
        let rect = response.rect;

        painter.rect_stroke(rect, 0.0, egui::Stroke::new(1.0, Color32::from_gray(70)), StrokeKind::Inside);

        for shape in &vector_spec.shapes {
            self.draw_vector_spec_shape(&painter, rect, &vector_spec.viewport, shape);
        }

        if vector_spec.shapes.is_empty() {
            painter.text(
                rect.center(),
                Align2::CENTER_CENTER,
                "Canvas",
                egui::FontId::proportional(14.0),
                Color32::from_gray(180),
            );
        }
    }

    fn viewport_tuple(viewport: &NativeDesktopVectorViewport) -> (f32, f32, f32, f32) {
        (viewport.min_x, viewport.min_y, viewport.width, viewport.height)
    }

    fn stroke_or_none(color: Option<&NativeDesktopColor>, stroke_width: Option<f32>) -> egui::Stroke {
        visible_color(color)
            .map(|stroke_color| egui::Stroke::new(stroke_width.unwrap_or(1.0).max(1.0), stroke_color))
            .unwrap_or(egui::Stroke::NONE)
    }

    fn sample_path_subpaths(
        &self,
        commands: &[NativeDesktopPathCommand],
        rect: Rect,
        viewport: &NativeDesktopVectorViewport,
    ) -> Vec<(Vec<Pos2>, bool)> {
        let mut subpaths: Vec<(Vec<Pos2>, bool)> = Vec::new();
        let mut current_points: Vec<Pos2> = Vec::new();
        let mut current_raw_point: Option<(f32, f32)> = None;

        for command in commands {
            match command {
                NativeDesktopPathCommand::MoveTo { x, y } => {
                    if current_points.len() >= 2 {
                        subpaths.push((std::mem::take(&mut current_points), false));
                    }

                    current_points.push(self.map_point_to_rect(Pos2::new(*x, *y), rect, Self::viewport_tuple(viewport)));
                    current_raw_point = Some((*x, *y));
                }
                NativeDesktopPathCommand::LineTo { x, y } => {
                    current_points.push(self.map_point_to_rect(Pos2::new(*x, *y), rect, Self::viewport_tuple(viewport)));
                    current_raw_point = Some((*x, *y));
                }
                NativeDesktopPathCommand::CubicTo {
                    control1_x,
                    control1_y,
                    control2_x,
                    control2_y,
                    x,
                    y,
                } => {
                    let Some((start_x, start_y)) = current_raw_point else {
                        continue;
                    };

                    let start = self.map_point_to_rect(Pos2::new(start_x, start_y), rect, Self::viewport_tuple(viewport));
                    let control1 = self.map_point_to_rect(Pos2::new(*control1_x, *control1_y), rect, Self::viewport_tuple(viewport));
                    let control2 = self.map_point_to_rect(Pos2::new(*control2_x, *control2_y), rect, Self::viewport_tuple(viewport));
                    let end = self.map_point_to_rect(Pos2::new(*x, *y), rect, Self::viewport_tuple(viewport));

                    for step in 1..=16 {
                        let t = step as f32 / 16.0;
                        current_points.push(cubic_bezier_point(start, control1, control2, end, t));
                    }

                    current_raw_point = Some((*x, *y));
                }
                NativeDesktopPathCommand::Close => {
                    if current_points.len() >= 2 {
                        subpaths.push((std::mem::take(&mut current_points), true));
                    }
                    current_raw_point = None;
                }
            }
        }

        if current_points.len() >= 2 {
            subpaths.push((current_points, false));
        }

        subpaths
    }

    fn draw_sampled_subpaths(
        &self,
        painter: &egui::Painter,
        subpaths: &[(Vec<Pos2>, bool)],
        fill: Option<Color32>,
        stroke: egui::Stroke,
    ) {
        for (points, closed) in subpaths {
            if points.len() < 2 {
                continue;
            }

            if *closed {
                if let Some(fill) = fill {
                    painter.add(egui::Shape::convex_polygon(points.clone(), fill, stroke));
                    continue;
                }

                if stroke != egui::Stroke::NONE {
                    let mut closed_points = points.clone();
                    if let Some(first) = points.first() {
                        closed_points.push(*first);
                    }
                    painter.add(egui::Shape::line(closed_points, stroke));
                }
                continue;
            }

            if stroke != egui::Stroke::NONE {
                painter.add(egui::Shape::line(points.clone(), stroke));
            }
        }
    }

    pub(super) fn draw_vector_spec_shape(
        &self,
        painter: &egui::Painter,
        rect: Rect,
        viewport: &NativeDesktopVectorViewport,
        shape: &NativeDesktopVectorShape,
    ) {
        match shape {
            NativeDesktopVectorShape::Circle {
                cx,
                cy,
                r,
                fill,
                stroke,
                stroke_width,
            } => {
                let center = self.map_point_to_rect(Pos2::new(*cx, *cy), rect, Self::viewport_tuple(viewport));
                let radius = *r * (rect.width() / viewport.width.max(1.0)).min(rect.height() / viewport.height.max(1.0));
                if let Some(fill) = visible_color(fill.as_ref()) {
                    painter.circle_filled(center, radius, fill);
                }
                let stroke = Self::stroke_or_none(stroke.as_ref(), *stroke_width);
                if stroke != egui::Stroke::NONE {
                    painter.circle_stroke(center, radius, stroke);
                }
            }
            NativeDesktopVectorShape::Rect {
                x,
                y,
                width,
                height,
                rx,
                ry,
                fill,
                stroke,
                stroke_width,
            } => {
                let min = self.map_point_to_rect(Pos2::new(*x, *y), rect, Self::viewport_tuple(viewport));
                let max = self.map_point_to_rect(Pos2::new(*x + *width, *y + *height), rect, Self::viewport_tuple(viewport));
                let shape_rect = Rect::from_min_max(min, max);
                let corner_radius = rx
                    .or(*ry)
                    .unwrap_or(0.0)
                    .max(0.0)
                    * (rect.width() / viewport.width.max(1.0)).min(rect.height() / viewport.height.max(1.0));
                if let Some(fill) = visible_color(fill.as_ref()) {
                    painter.rect_filled(shape_rect, corner_radius, fill);
                }
                let stroke = Self::stroke_or_none(stroke.as_ref(), *stroke_width);
                if stroke != egui::Stroke::NONE {
                    painter.rect_stroke(shape_rect, corner_radius, stroke, StrokeKind::Inside);
                }
            }
            NativeDesktopVectorShape::Ellipse {
                cx,
                cy,
                rx,
                ry,
                fill,
                stroke,
                stroke_width,
            } => {
                let mut points = Vec::new();
                for step in 0..32 {
                    let angle = (step as f32 / 32.0) * std::f32::consts::TAU;
                    points.push(Pos2::new(*cx + *rx * angle.cos(), *cy + *ry * angle.sin()));
                }
                let scaled = self.scale_points_to_rect(points, rect, Self::viewport_tuple(viewport));
                self.paint_polyline(
                    painter,
                    scaled,
                    Self::stroke_or_none(stroke.as_ref(), *stroke_width),
                    true,
                    visible_color(fill.as_ref()),
                );
            }
            NativeDesktopVectorShape::Path {
                commands,
                fill,
                stroke,
                stroke_width,
            } => {
                let subpaths = self.sample_path_subpaths(commands, rect, viewport);
                self.draw_sampled_subpaths(
                    painter,
                    &subpaths,
                    visible_color(fill.as_ref()),
                    Self::stroke_or_none(stroke.as_ref(), *stroke_width),
                );
            }
        }
    }

    fn paint_polyline(&self, painter: &egui::Painter, points: Vec<Pos2>, stroke: egui::Stroke, closed: bool, fill: Option<Color32>) {
        if points.len() < 2 {
            return;
        }

        if closed {
            if let Some(fill) = fill {
                painter.add(egui::Shape::convex_polygon(points.clone(), fill, stroke));
                return;
            }

            let mut closed_points = points.clone();
            if let Some(first) = points.first() {
                closed_points.push(*first);
            }
            painter.add(egui::Shape::line(closed_points, stroke));
            return;
        }

        painter.add(egui::Shape::line(points, stroke));
    }

    fn scale_points_to_rect(&self, points: Vec<Pos2>, rect: Rect, view_box: (f32, f32, f32, f32)) -> Vec<Pos2> {
        points
            .into_iter()
            .map(|point| self.map_point_to_rect(point, rect, view_box))
            .collect()
    }

    fn map_point_to_rect(&self, point: Pos2, rect: Rect, view_box: (f32, f32, f32, f32)) -> Pos2 {
        let (min_x, min_y, width, height) = view_box;
        let scale_x = if width.abs() < f32::EPSILON { 1.0 } else { rect.width() / width };
        let scale_y = if height.abs() < f32::EPSILON { 1.0 } else { rect.height() / height };
        Pos2::new(
            rect.left() + (point.x - min_x) * scale_x,
            rect.top() + (point.y - min_y) * scale_y,
        )
    }

    pub(super) fn draw_vector_node(
        &self,
        painter: &egui::Painter,
        rect: Rect,
        node: &NativeElementNode,
        view_box: (f32, f32, f32, f32),
        unsupported: &mut usize,
    ) {
        let fill = Self::parse_css_color(node.props.get("fill")).unwrap_or(Color32::TRANSPARENT);
        let stroke_color = Self::parse_css_color(node.props.get("stroke")).unwrap_or(Color32::TRANSPARENT);
        let stroke_width = Self::parse_css_number(node.props.get("strokeWidth"))
            .or_else(|| Self::parse_css_number(node.props.get("lineWidth")))
            .unwrap_or(1.0);
        let stroke = egui::Stroke::new(stroke_width.max(1.0), stroke_color);

        match node.source_tag.as_str() {
            "svg" | "g" => {
                for child in &node.children {
                    if let NativeNode::Element(element_node) = child {
                        self.draw_vector_node(painter, rect, element_node, view_box, unsupported);
                    }
                }
            }
            "circle" => {
                let cx = self.resolve_prop_number(node, "cx").unwrap_or(0.0);
                let cy = self.resolve_prop_number(node, "cy").unwrap_or(0.0);
                let r = self.resolve_prop_number(node, "r").unwrap_or(0.0);
                let center = self.map_point_to_rect(Pos2::new(cx, cy), rect, view_box);
                let radius = r * (rect.width() / view_box.2.max(1.0)).min(rect.height() / view_box.3.max(1.0));
                if fill != Color32::TRANSPARENT {
                    painter.circle_filled(center, radius, fill);
                }
                if stroke.color != Color32::TRANSPARENT {
                    painter.circle_stroke(center, radius, stroke);
                }
            }
            "rect" => {
                let x = self.resolve_prop_number(node, "x").unwrap_or(0.0);
                let y = self.resolve_prop_number(node, "y").unwrap_or(0.0);
                let width = self.resolve_prop_number(node, "width").unwrap_or(0.0);
                let height = self.resolve_prop_number(node, "height").unwrap_or(0.0);
                let min = self.map_point_to_rect(Pos2::new(x, y), rect, view_box);
                let max = self.map_point_to_rect(Pos2::new(x + width, y + height), rect, view_box);
                let shape_rect = Rect::from_min_max(min, max);
                if fill != Color32::TRANSPARENT {
                    painter.rect_filled(shape_rect, 0.0, fill);
                }
                if stroke.color != Color32::TRANSPARENT {
                    painter.rect_stroke(shape_rect, 0.0, stroke, StrokeKind::Inside);
                }
            }
            "line" => {
                let x1 = self.resolve_prop_number(node, "x1").unwrap_or(0.0);
                let y1 = self.resolve_prop_number(node, "y1").unwrap_or(0.0);
                let x2 = self.resolve_prop_number(node, "x2").unwrap_or(0.0);
                let y2 = self.resolve_prop_number(node, "y2").unwrap_or(0.0);
                painter.line_segment(
                    [
                        self.map_point_to_rect(Pos2::new(x1, y1), rect, view_box),
                        self.map_point_to_rect(Pos2::new(x2, y2), rect, view_box),
                    ],
                    stroke,
                );
            }
            "polyline" => {
                let points = node.props.get("points").map(parse_points_value).unwrap_or_default();
                let scaled = self.scale_points_to_rect(points, rect, view_box);
                self.paint_polyline(painter, scaled, stroke, false, None);
            }
            "polygon" => {
                let points = node.props.get("points").map(parse_points_value).unwrap_or_default();
                let scaled = self.scale_points_to_rect(points, rect, view_box);
                self.paint_polyline(
                    painter,
                    scaled,
                    stroke,
                    true,
                    (fill != Color32::TRANSPARENT).then_some(fill),
                );
            }
            "ellipse" => {
                let cx = self.resolve_prop_number(node, "cx").unwrap_or(0.0);
                let cy = self.resolve_prop_number(node, "cy").unwrap_or(0.0);
                let rx = self.resolve_prop_number(node, "rx").unwrap_or(0.0);
                let ry = self.resolve_prop_number(node, "ry").unwrap_or(0.0);
                let mut points = Vec::new();
                for step in 0..32 {
                    let angle = (step as f32 / 32.0) * std::f32::consts::TAU;
                    points.push(Pos2::new(cx + rx * angle.cos(), cy + ry * angle.sin()));
                }
                let scaled = self.scale_points_to_rect(points, rect, view_box);
                self.paint_polyline(
                    painter,
                    scaled,
                    stroke,
                    true,
                    (fill != Color32::TRANSPARENT).then_some(fill),
                );
            }
            "text" | "tspan" => {
                let x = self.resolve_prop_number(node, "x").unwrap_or(view_box.0);
                let y = self.resolve_prop_number(node, "y").unwrap_or(view_box.1 + 16.0);
                let point = self.map_point_to_rect(Pos2::new(x, y), rect, view_box);
                let text = self.collect_text_content(&NativeNode::Element(node.clone()));
                painter.text(
                    point,
                    Align2::LEFT_TOP,
                    text,
                    egui::FontId::proportional(14.0),
                    if fill != Color32::TRANSPARENT { fill } else { Color32::from_gray(230) },
                );
            }
            _ => {
                *unsupported += 1;
            }
        }
    }

    pub(super) fn draw_canvas_operation(&self, painter: &egui::Painter, rect: Rect, canvas_size: Vec2, operation: &Map<String, Value>) {
        let kind = operation.get("kind").and_then(Value::as_str).unwrap_or_default();
        let fill = Self::parse_css_color(operation.get("fill")).unwrap_or(Color32::TRANSPARENT);
        let stroke_color = Self::parse_css_color(operation.get("stroke")).unwrap_or(Color32::TRANSPARENT);
        let stroke_width = Self::parse_css_number(operation.get("strokeWidth"))
            .or_else(|| Self::parse_css_number(operation.get("lineWidth")))
            .unwrap_or(1.0);
        let stroke = egui::Stroke::new(stroke_width.max(1.0), stroke_color);
        let scale_x = rect.width() / canvas_size.x.max(1.0);
        let scale_y = rect.height() / canvas_size.y.max(1.0);
        let map_point = |x: f32, y: f32| Pos2::new(rect.left() + x * scale_x, rect.top() + y * scale_y);

        match kind {
            "rect" => {
                let x = Self::parse_css_number(operation.get("x")).unwrap_or(0.0);
                let y = Self::parse_css_number(operation.get("y")).unwrap_or(0.0);
                let width = Self::parse_css_number(operation.get("width")).unwrap_or(0.0);
                let height = Self::parse_css_number(operation.get("height")).unwrap_or(0.0);
                let shape_rect = Rect::from_min_max(map_point(x, y), map_point(x + width, y + height));
                if fill != Color32::TRANSPARENT {
                    painter.rect_filled(shape_rect, 0.0, fill);
                }
                if stroke.color != Color32::TRANSPARENT {
                    painter.rect_stroke(shape_rect, 0.0, stroke, StrokeKind::Inside);
                }
            }
            "circle" => {
                let cx = Self::parse_css_number(operation.get("cx")).unwrap_or(0.0);
                let cy = Self::parse_css_number(operation.get("cy")).unwrap_or(0.0);
                let radius = Self::parse_css_number(operation.get("r")).unwrap_or(0.0) * scale_x.min(scale_y);
                let center = map_point(cx, cy);
                if fill != Color32::TRANSPARENT {
                    painter.circle_filled(center, radius, fill);
                }
                if stroke.color != Color32::TRANSPARENT {
                    painter.circle_stroke(center, radius, stroke);
                }
            }
            "ellipse" => {
                let cx = Self::parse_css_number(operation.get("cx")).unwrap_or(0.0);
                let cy = Self::parse_css_number(operation.get("cy")).unwrap_or(0.0);
                let rx = Self::parse_css_number(operation.get("rx")).unwrap_or(0.0);
                let ry = Self::parse_css_number(operation.get("ry")).unwrap_or(0.0);
                let mut points = Vec::new();
                for step in 0..32 {
                    let angle = (step as f32 / 32.0) * std::f32::consts::TAU;
                    points.push(map_point(cx + rx * angle.cos(), cy + ry * angle.sin()));
                }
                self.paint_polyline(
                    painter,
                    points,
                    stroke,
                    true,
                    (fill != Color32::TRANSPARENT).then_some(fill),
                );
            }
            "line" => {
                let x1 = Self::parse_css_number(operation.get("x1")).unwrap_or(0.0);
                let y1 = Self::parse_css_number(operation.get("y1")).unwrap_or(0.0);
                let x2 = Self::parse_css_number(operation.get("x2")).unwrap_or(0.0);
                let y2 = Self::parse_css_number(operation.get("y2")).unwrap_or(0.0);
                painter.line_segment([map_point(x1, y1), map_point(x2, y2)], stroke);
            }
            "polyline" => {
                let points = operation.get("points").map(parse_points_value).unwrap_or_default();
                let scaled = points.into_iter().map(|point| map_point(point.x, point.y)).collect();
                self.paint_polyline(painter, scaled, stroke, false, None);
            }
            "polygon" => {
                let points = operation.get("points").map(parse_points_value).unwrap_or_default();
                let scaled = points.into_iter().map(|point| map_point(point.x, point.y)).collect();
                self.paint_polyline(
                    painter,
                    scaled,
                    stroke,
                    true,
                    (fill != Color32::TRANSPARENT).then_some(fill),
                );
            }
            _ => {}
        }
    }
}