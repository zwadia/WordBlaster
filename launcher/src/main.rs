use std::env;
use std::path::PathBuf;
use std::process::{Command, Stdio};

fn main() {
    let exe_path = match env::current_exe() {
        Ok(path) => path,
        Err(error) => {
            eprintln!("Could not find launcher path: {error}");
            std::process::exit(1);
        }
    };

    let base_dir = match exe_path.parent() {
        Some(dir) => dir.to_path_buf(),
        None => {
            eprintln!("Could not resolve launcher directory");
            std::process::exit(1);
        }
    };

    let script_path: PathBuf = base_dir.join("launch-wordblaster.sh");

    if !script_path.exists() {
        eprintln!("Launcher script not found: {}", script_path.display());
        std::process::exit(1);
    }

    let status = Command::new("bash")
        .arg(script_path)
        .current_dir(base_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();

    match status {
        Ok(status) if status.success() => {}
        Ok(status) => {
            eprintln!("Launcher exited with status: {status}");
            std::process::exit(1);
        }
        Err(error) => {
            eprintln!("Could not start WordBlaster: {error}");
            std::process::exit(1);
        }
    }
}
