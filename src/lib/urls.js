/**
 * Utility functions for URL handling
 */

/**
 * Get the base URL for the application
 * @returns {string} The base URL
 */
export const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
};

/**
 * Generate a payment success URL
 * @param {Object} params - URL parameters
 * @param {string} params.sessionId - Stripe session ID
 * @param {string} params.amount - Payment amount
 * @returns {string} The success URL
 */
export const getPaymentSuccessUrl = ({ sessionId, amount }) => {
    const baseUrl = getBaseUrl();
    const url = new URL('/payment-success', baseUrl);
    if (sessionId) url.searchParams.set('session_id', sessionId);
    if (amount) url.searchParams.set('amount', amount);
    return url.toString();
};

/**
 * Generate a payment cancel URL
 * @returns {string} The cancel URL
 */
export const getPaymentCancelUrl = () => {
    const baseUrl = getBaseUrl();
    return new URL('/payment-cancelled', baseUrl).toString();
};

/**
 * Generate an auth callback URL
 * @param {Object} params - URL parameters
 * @param {string} params.next - Next URL to redirect to after auth
 * @returns {string} The callback URL
 */
export const getAuthCallbackUrl = ({ next }) => {
    const baseUrl = getBaseUrl();
    const url = new URL('/auth/callback', baseUrl);
    if (next) url.searchParams.set('next', next);
    return url.toString();
}; 