use std::path::Path;

use image::{DynamicImage, RgbaImage};

const DEFAULT_ICON_SIDE: u32 = 256;

pub struct IconBitmap {
    rgba: Vec<u8>,
    width: u32,
    height: u32,
}

impl IconBitmap {
    #[allow(dead_code)]
    pub fn into_rgba(self) -> (Vec<u8>, u32, u32) {
        (self.rgba, self.width, self.height)
    }

    #[allow(dead_code)]
    pub fn into_dynamic_image(self) -> Result<DynamicImage, String> {
        let Some(image) = RgbaImage::from_raw(self.width, self.height, self.rgba) else {
            return Err(String::from("icon decode produced an invalid RGBA buffer"));
        };
        Ok(DynamicImage::ImageRgba8(image))
    }
}

pub fn load_icon_bitmap(path: &Path) -> Result<IconBitmap, String> {
    match icon_extension(path).as_deref() {
        Some("svg") => load_svg_icon_bitmap(path),
        _ => load_raster_icon_bitmap(path),
    }
}

fn icon_extension(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_ascii_lowercase())
}

fn load_raster_icon_bitmap(path: &Path) -> Result<IconBitmap, String> {
    let image = image::open(path)
        .map_err(|err| format!("decode icon failed for {}: {err}", path.display()))?;
    bitmap_from_dynamic_image(image)
}

fn load_svg_icon_bitmap(path: &Path) -> Result<IconBitmap, String> {
    use resvg::{tiny_skia, usvg};

    let svg = std::fs::read(path)
        .map_err(|err| format!("read SVG failed for {}: {err}", path.display()))?;
    let options = usvg::Options::default();
    let tree = usvg::Tree::from_data(&svg, &options)
        .map_err(|err| format!("parse SVG failed for {}: {err}", path.display()))?;

    let size = tree.size();
    let width = size.width().ceil().max(1.0) as u32;
    let height = size.height().ceil().max(1.0) as u32;
    let side = width.max(height).max(DEFAULT_ICON_SIDE);

    let mut pixmap = tiny_skia::Pixmap::new(side, side)
        .ok_or_else(|| format!("allocate SVG pixmap failed for {}", path.display()))?;

    let scale = (side as f32 / width as f32).min(side as f32 / height as f32);
    let scaled_width = width as f32 * scale;
    let scaled_height = height as f32 * scale;
    let translate_x = ((side as f32 - scaled_width) / 2.0).max(0.0);
    let translate_y = ((side as f32 - scaled_height) / 2.0).max(0.0);
    let transform = tiny_skia::Transform::from_translate(translate_x, translate_y)
        .post_scale(scale, scale);

    resvg::render(&tree, transform, &mut pixmap.as_mut());

    Ok(IconBitmap {
        rgba: pixmap.take(),
        width: side,
        height: side,
    })
}

fn bitmap_from_dynamic_image(image: DynamicImage) -> Result<IconBitmap, String> {
    let squared = to_square_rgba(image);
    let width = squared.width();
    let height = squared.height();

    Ok(IconBitmap {
        rgba: squared.into_raw(),
        width,
        height,
    })
}

fn to_square_rgba(image: DynamicImage) -> RgbaImage {
    let rgba = image.to_rgba8();
    let (width, height) = rgba.dimensions();
    if width == height {
        return rgba;
    }

    let side = width.max(height);
    let mut square = RgbaImage::new(side, side);
    let x = (side - width) / 2;
    let y = (side - height) / 2;
    image::imageops::overlay(&mut square, &rgba, i64::from(x), i64::from(y));
    square
}