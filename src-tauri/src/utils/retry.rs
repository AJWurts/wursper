//! Retry utilities for network operations with exponential backoff.
//!
//! Provides retry functionality for transient failures like network timeouts,
//! rate limits, and temporary server errors.

use std::future::Future;
use std::time::Duration;

/// Configuration for retry behavior
#[derive(Clone, Copy)]
pub struct RetryConfig {
    /// Maximum number of retry attempts (not including the initial attempt)
    pub max_retries: u32,
    /// Initial delay between retries
    pub initial_delay: Duration,
    /// Maximum delay between retries
    pub max_delay: Duration,
    /// Multiplier for exponential backoff (e.g., 2.0 doubles each time)
    pub backoff_multiplier: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_retries: 3,
            initial_delay: Duration::from_secs(1),
            max_delay: Duration::from_secs(10),
            backoff_multiplier: 2.0,
        }
    }
}

impl RetryConfig {
    /// Create a config optimized for STT provider calls
    pub fn for_stt_providers() -> Self {
        Self {
            max_retries: 3,
            initial_delay: Duration::from_millis(500),
            max_delay: Duration::from_secs(5),
            backoff_multiplier: 2.0,
        }
    }

    /// Create a config for quick retries (rate limit handling)
    pub fn quick() -> Self {
        Self {
            max_retries: 2,
            initial_delay: Duration::from_millis(200),
            max_delay: Duration::from_secs(2),
            backoff_multiplier: 2.0,
        }
    }
}

/// Determines if an error is retryable based on the error message
pub fn is_retryable_error(error: &str) -> bool {
    let error_lower = error.to_lowercase();

    // Network errors
    if error_lower.contains("timeout")
        || error_lower.contains("timed out")
        || error_lower.contains("connection")
        || error_lower.contains("network")
        || error_lower.contains("dns")
        || error_lower.contains("failed to send request")
    {
        return true;
    }

    // HTTP status codes that are retryable
    if error_lower.contains("429") // Rate limit
        || error_lower.contains("502") // Bad gateway
        || error_lower.contains("503") // Service unavailable
        || error_lower.contains("504") // Gateway timeout
        || error_lower.contains("rate limit")
        || error_lower.contains("too many requests")
        || error_lower.contains("service unavailable")
    {
        return true;
    }

    // Temporary errors
    if error_lower.contains("temporary")
        || error_lower.contains("overloaded")
        || error_lower.contains("try again")
    {
        return true;
    }

    false
}

/// Execute an async operation with retry logic
///
/// # Arguments
/// * `config` - Retry configuration
/// * `operation` - Async function to retry
///
/// # Returns
/// The result of the operation, or the last error after all retries exhausted
pub async fn with_retry<F, Fut, T>(config: RetryConfig, operation: F) -> Result<T, String>
where
    F: Fn() -> Fut,
    Fut: Future<Output = Result<T, String>>,
{
    let mut last_error = String::new();
    let mut delay = config.initial_delay;

    for attempt in 0..=config.max_retries {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                last_error = e.clone();

                // Check if this is the last attempt
                if attempt == config.max_retries {
                    break;
                }

                // Check if error is retryable
                if !is_retryable_error(&e) {
                    log::debug!("Error is not retryable, failing immediately: {}", e);
                    return Err(e);
                }

                log::warn!(
                    "Retryable error on attempt {}/{}: {}. Retrying in {:?}...",
                    attempt + 1,
                    config.max_retries + 1,
                    e,
                    delay
                );

                tokio::time::sleep(delay).await;

                // Calculate next delay with exponential backoff
                delay = Duration::from_secs_f64(
                    (delay.as_secs_f64() * config.backoff_multiplier)
                        .min(config.max_delay.as_secs_f64()),
                );
            }
        }
    }

    Err(format!(
        "Operation failed after {} attempts. Last error: {}",
        config.max_retries + 1,
        last_error
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};
    use std::sync::Arc;

    #[test]
    fn test_is_retryable_error() {
        // Should retry
        assert!(is_retryable_error("Request timeout"));
        assert!(is_retryable_error("Connection refused"));
        assert!(is_retryable_error("status 503: Service unavailable"));
        assert!(is_retryable_error("429 Too Many Requests"));
        assert!(is_retryable_error("Failed to send request: network error"));

        // Should not retry
        assert!(!is_retryable_error("API key invalid"));
        assert!(!is_retryable_error("400 Bad Request"));
        assert!(!is_retryable_error("401 Unauthorized"));
        assert!(!is_retryable_error("File not found"));
    }

    #[tokio::test]
    async fn test_with_retry_success_first_try() {
        let result = with_retry(RetryConfig::default(), || async {
            Ok::<_, String>("success".to_string())
        })
        .await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "success");
    }

    #[tokio::test]
    async fn test_with_retry_success_after_retries() {
        let attempt_count = Arc::new(AtomicU32::new(0));
        let count = Arc::clone(&attempt_count);

        let config = RetryConfig {
            max_retries: 3,
            initial_delay: Duration::from_millis(10),
            max_delay: Duration::from_millis(100),
            backoff_multiplier: 2.0,
        };

        let result = with_retry(config, || {
            let c = Arc::clone(&count);
            async move {
                let attempt = c.fetch_add(1, Ordering::SeqCst);
                if attempt < 2 {
                    Err("Connection timeout".to_string())
                } else {
                    Ok("success".to_string())
                }
            }
        })
        .await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "success");
        assert_eq!(attempt_count.load(Ordering::SeqCst), 3);
    }

    #[tokio::test]
    async fn test_with_retry_non_retryable_error() {
        let attempt_count = Arc::new(AtomicU32::new(0));
        let count = Arc::clone(&attempt_count);

        let result = with_retry(RetryConfig::default(), || {
            let c = Arc::clone(&count);
            async move {
                c.fetch_add(1, Ordering::SeqCst);
                Err::<String, _>("401 Unauthorized: Invalid API key".to_string())
            }
        })
        .await;

        assert!(result.is_err());
        // Should only attempt once for non-retryable errors
        assert_eq!(attempt_count.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn test_with_retry_exhausted() {
        let attempt_count = Arc::new(AtomicU32::new(0));
        let count = Arc::clone(&attempt_count);

        let config = RetryConfig {
            max_retries: 2,
            initial_delay: Duration::from_millis(10),
            max_delay: Duration::from_millis(100),
            backoff_multiplier: 2.0,
        };

        let result = with_retry(config, || {
            let c = Arc::clone(&count);
            async move {
                c.fetch_add(1, Ordering::SeqCst);
                Err::<String, _>("Network timeout".to_string())
            }
        })
        .await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("failed after 3 attempts"));
        assert_eq!(attempt_count.load(Ordering::SeqCst), 3);
    }
}
