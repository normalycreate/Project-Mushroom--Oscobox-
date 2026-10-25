/**
 * Vercel Speed Insights initialization
 * This file initializes Vercel Speed Insights for tracking web vitals
 */

import { injectSpeedInsights } from "./node_modules/@vercel/speed-insights/dist/index.mjs";

// Initialize Speed Insights
// This will automatically track web vitals and send them to Vercel
injectSpeedInsights({
	debug: false, // Set to true for debugging in development
});
