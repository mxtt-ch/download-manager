pub mod models;
pub mod db;
pub mod config;
pub mod core;
pub mod commands;

use db::DbState;
use config::AppState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 获取应用数据目录
            let app_dir = app.path().app_data_dir()
                .expect("无法获取应用数据目录");
            std::fs::create_dir_all(&app_dir)
                .expect("无法创建应用数据目录");

            // 初始化数据库
            let db_path = app_dir.join("download_manager.db");
            let conn = db::init_db(db_path.to_str().unwrap())
                .expect("数据库初始化失败");
            app.manage(DbState {
                conn: Mutex::new(conn),
            });

            // 加载配置
            let config = config::load_config(&app_dir);
            app.manage(AppState {
                config: Mutex::new(config),
                app_dir: Mutex::new(app_dir),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::tasks::get_tasks,
            commands::tasks::get_task_detail,
            commands::tasks::create_task,
            commands::tasks::pause_task,
            commands::tasks::resume_task,
            commands::tasks::delete_task,
            commands::tasks::retry_task,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::get_categories,
            commands::settings::upsert_category,
            commands::settings::delete_category,
            commands::site::get_sites,
            commands::site::add_site,
            commands::site::update_site,
            commands::site::delete_site,
            commands::queues::get_queues,
            commands::queues::create_queue,
            commands::queues::delete_queue,
            commands::system::get_disk_space,
        ])
        .run(tauri::generate_context!())
        .expect("启动应用失败");
}
