#[cfg(windows)]
fn main() {
    use std::env;
    use std::fs::File;
    use std::io::BufWriter;
    use std::path::{Path, PathBuf};

    #[path = "icon.rs"]
    mod icon;

    use image::ImageFormat;
    use icon::load_icon_bitmap;

    println!("cargo:rerun-if-env-changed=ELIT_DESKTOP_EXE_ICON");
    println!("cargo:rerun-if-env-changed=WAPK_EXE_ICON");

    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".to_string()));

    let mut icon_path = env::var("ELIT_DESKTOP_EXE_ICON")
        .ok()
        .or_else(|| env::var("WAPK_EXE_ICON").ok())
        .map(PathBuf::from);

    if icon_path.is_none() {
        let ico = manifest_dir.join("icon.ico");
        let png = manifest_dir.join("icon.png");
        let svg = manifest_dir.join("icon.svg");
        if ico.exists() {
            icon_path = Some(ico);
        } else if png.exists() {
            icon_path = Some(png);
        } else if svg.exists() {
            icon_path = Some(svg);
        }
    }

    let Some(icon_path) = icon_path else {
        return;
    };

    println!("cargo:rerun-if-changed={}", icon_path.display());

    let resource_icon = match icon_path.extension().and_then(|s| s.to_str()).map(|s| s.to_ascii_lowercase()) {
        Some(ext) if ext == "ico" => Some(icon_path.clone()),
        Some(ext) if ext == "png" || ext == "svg" => {
            let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap_or_else(|_| ".".to_string()));
            let out_ico = out_dir.join("wapk-auto-icon.ico");
            if let Err(err) = convert_icon_to_ico(&icon_path, &out_ico) {
                println!("cargo:warning=Failed to convert icon to ICO: {err}");
                None
            } else {
                Some(out_ico)
            }
        }
        _ => {
            println!(
                "cargo:warning=Unsupported icon format for ELIT_DESKTOP_EXE_ICON: {}",
                icon_path.display()
            );
            None
        }
    };

    if let Some(icon_file) = resource_icon {
        let mut res = winres::WindowsResource::new();
        res.set_icon(icon_file.to_string_lossy().as_ref());
        if let Err(err) = res.compile() {
            println!("cargo:warning=Failed to embed exe icon resource: {err}");
        }
    }

    fn convert_icon_to_ico(input_icon: &Path, output_ico: &Path) -> Result<(), String> {
        let rgba = load_icon_bitmap(input_icon)?.into_dynamic_image()?;
        let file = File::create(output_ico).map_err(|e| format!("create ICO failed: {e}"))?;
        let mut writer = BufWriter::new(file);
        rgba.write_to(&mut writer, ImageFormat::Ico)
            .map_err(|e| format!("write ICO failed: {e}"))?;
        Ok(())
    }
}

#[cfg(not(windows))]
fn main() {}
