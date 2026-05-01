use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant};
use tokio::time::sleep;

/// 令牌桶限速器
/// 使用令牌桶算法控制下载速率，所有并发线程共享同一限速器实例
pub struct RateLimiter {
    tokens_per_sec: AtomicU64,
    burst_size: u64,
    available: AtomicU64,
    last_refill: parking_lot::Mutex<Instant>,
}

impl RateLimiter {
    /// 创建限速器
    /// - `bytes_per_sec`: 每秒允许通过的字节数，0 表示不限速
    pub fn new(bytes_per_sec: u64) -> Self {
        Self {
            tokens_per_sec: AtomicU64::new(bytes_per_sec),
            burst_size: bytes_per_sec.max(65536),
            available: AtomicU64::new(bytes_per_sec.max(65536)),
            last_refill: parking_lot::Mutex::new(Instant::now()),
        }
    }

    /// 不限速的限速器（始终允许通过）
    pub fn unlimited() -> Self {
        Self::new(u64::MAX)
    }

    /// 消耗指定数量的令牌，如果不够则等待
    pub async fn acquire(&self, bytes: u64) {
        // 不限速时直接返回
        if self.tokens_per_sec.load(Ordering::Relaxed) == u64::MAX {
            return;
        }

        loop {
            self.refill();

            let available = self.available.load(Ordering::Relaxed);
            if available >= bytes {
                if self
                    .available
                    .compare_exchange(
                        available,
                        available - bytes,
                        Ordering::SeqCst,
                        Ordering::Relaxed,
                    )
                    .is_ok()
                {
                    return;
                }
            } else {
                // 计算需要等待的时间（毫秒）
                let need = bytes - available;
                let rate = self.tokens_per_sec.load(Ordering::Relaxed).max(1);
                let wait_ms = (need as f64 / rate as f64 * 1000.0) as u64;
                sleep(Duration::from_millis(wait_ms.max(10))).await;
            }
        }
    }

    /// 补充令牌：根据流逝时间计算新增令牌数
    fn refill(&self) {
        let mut last = self.last_refill.lock();
        let now = Instant::now();
        let elapsed = now.duration_since(*last);
        *last = now;

        let rate = self.tokens_per_sec.load(Ordering::Relaxed);
        if rate == u64::MAX {
            return;
        }

        let new_tokens = (elapsed.as_secs_f64() * rate as f64) as u64;
        if new_tokens > 0 {
            let current = self.available.load(Ordering::Relaxed);
            let next = (current + new_tokens).min(self.burst_size);
            self.available.store(next, Ordering::Relaxed);
        }
    }

    /// 动态更新限速值
    pub fn set_rate(&self, bytes_per_sec: u64) {
        self.tokens_per_sec.store(bytes_per_sec, Ordering::SeqCst);
    }
}
