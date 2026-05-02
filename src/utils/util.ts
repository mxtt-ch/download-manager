// ============================================================
// 格式化工具函数集合
// ============================================================

/**
 * 将字节数格式化为可读字符串（B/KB/MB/GB/TB）
 * 
 * @param bytes - 字节数
 * @returns 格式化字符串，例如 "10.5 MB" 或 "--"（当值为 0 时）
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return "--";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

/**
 * 将字节数格式化为磁盘空间字符串（带小数位控制）
 * 
 * @param bytes - 字节数
 * @param decimals - 小数位数，默认 1
 * @returns 格式化字符串，例如 "10.5 MB" 或 "0 B"（当值 <= 0 时）
 */
export function formatDiskSize(bytes: number, decimals = 1): string {
    if (bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(decimals)} ${sizes[i]}`;
}

/**
 * 格式化下载速度（字节/秒 → 带单位的速度字符串）
 * 
 * @param bytesPerSec - 字节/秒
 * @returns 格式化字符串，例如 "10.5 MB/s" 或 "--"
 */
export function formatSpeed(bytesPerSec: number): string {
    return formatBytes(bytesPerSec) + "/s";
}

/**
 * 格式化下载速度为 MB/s（仅数值）
 * 
 * @param bytesPerSec - 字节/秒
 * @returns 格式化字符串，例如 "10.5" 或 "0.0"
 */
export function formatDownSpeed(bytesPerSec: number): string {
    if (bytesPerSec <= 0) return "0.0";
    const mb = bytesPerSec / (1024 * 1024);
    return mb.toFixed(1);
}

/**
 * 格式化上传速度为 KB/s（仅数值）
 * 
 * @param bytesPerSec - 字节/秒
 * @returns 格式化字符串，例如 "512" 或 "0"
 */
export function formatUpSpeed(bytesPerSec: number): string {
    if (bytesPerSec <= 0) return "0";
    const kb = bytesPerSec / 1024;
    return kb.toFixed(0);
}

/**
 * 格式化速度为可读的 MB/s 或 KB/s（智能切换单位）
 * 
 * @param bytesPerSec - 字节/秒
 * @returns 格式化字符串，例如 "10.5 MB/s" 或 "512 KB/s"
 */
export function formatSpeedSmart(bytesPerSec: number): string {
    const mb = bytesPerSec / (1024 * 1024);
    if (mb >= 1) {
        return `${mb.toFixed(1)} MB/s`;
    }
    const kb = bytesPerSec / 1024;
    return `${kb.toFixed(0)} KB/s`;
}

/**
 * 格式化剩余时间（秒 → 中文时间字符串）
 * 
 * @param seconds - 秒数
 * @returns 格式化字符串，例如 "2分30秒"、"1小时5分" 或 "--"
 */
export function formatEta(seconds: number): string {
    if (!isFinite(seconds) || seconds <= 0) return "--";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return mins > 0 ? `${hrs}小时${mins}分` : `${hrs}小时`;
    }
    if (mins > 0) {
        return secs > 0 ? `${mins}分${secs}秒` : `${mins}分`;
    }
    return `${secs}秒`;
}

/**
 * 将时间戳格式化为中文日期字符串
 * 
 * @param timestamp - 时间戳（毫秒）
 * @returns 格式化字符串，例如 "2024/1/1 12:00:00" 或 "--"
 */
export function formatDate(timestamp?: number): string {
    if (!timestamp) return "--";
    return new Date(timestamp).toLocaleString("zh-CN");
}

/**
 * 根据文件名后缀返回对应的文件类型分类
 * 
 * @param filename - 文件名
 * @returns 文件类型分类：video | archive | code | image | audio | document | executable | unknown
 */
export function getFileType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";

    const typeMap: Record<string, string> = {
        // 视频
        mp4: "video", mkv: "video", avi: "video", mov: "video",
        webm: "video", flv: "video", wmv: "video",
        // 压缩包
        zip: "archive", rar: "archive", "7z": "archive",
        tar: "archive", gz: "archive", bz2: "archive",
        xz: "archive", zst: "archive",
        // 代码
        js: "code", ts: "code", tsx: "code", jsx: "code",
        py: "code", rs: "code", go: "code", java: "code",
        html: "code", css: "code", json: "code", xml: "code",
        yaml: "code", yml: "code", toml: "code",
        // 图片
        png: "image", jpg: "image", jpeg: "image", gif: "image",
        svg: "image", webp: "image", bmp: "image", ico: "image",
        // 音频
        mp3: "audio", wav: "audio", flac: "audio", aac: "audio",
        ogg: "audio", wma: "audio",
        // 文档
        pdf: "document", doc: "document", docx: "document", xls: "document",
        xlsx: "document", ppt: "document", pptx: "document", txt: "document",
        epub: "document", mobi: "document",
        // 可执行文件
        exe: "executable", msi: "executable", iso: "executable",
        dmg: "executable", app: "executable",
    };

    return typeMap[ext] ?? "unknown";
}

/**
 * 验证 URL 格式是否有效
 * 
 * @param url - URL 字符串
 * @returns 是否为有效的 HTTP/HTTPS URL
 */
export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * 从 URL 中提取文件名
 * 
 * @param url - URL 字符串
 * @returns 文件名，如果无法提取则返回空字符串
 */
export function extractFilenameFromUrl(url: string): string {
    try {
        const parsed = new URL(url);
        const pathname = parsed.pathname;
        const filename = pathname.split("/").pop();
        return filename && filename.includes(".") ? filename : "";
    } catch {
        return "";
    }
}

/**
 * 防抖函数
 * 
 * @param func - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * 节流函数
 * 
 * @param func - 要节流的函数
 * @param limit - 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
