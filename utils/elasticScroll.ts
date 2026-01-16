/**
 * Elastic Scroll Utility
 * 
 * Provides macOS-style rubber-band overscroll effect for scrollable containers.
 * Based on elastic-scroll-polyfill library.
 */

import { elasticScroll } from 'elastic-scroll-polyfill';

export interface ElasticScrollConfig {
  intensity?: number;
  duration?: number;
  easing?: string;
  appleDevicesOnly?: boolean;
}

/**
 * Initialize elastic scroll on elements with data-elastic attribute
 * Call this once in your app initialization
 */
export const initElasticScroll = (config?: ElasticScrollConfig) => {
  elasticScroll({
    intensity: config?.intensity ?? 0.4,
    duration: config?.duration ?? 400,
    easing: config?.easing ?? 'easeOutQuint',
    appleDevicesOnly: config?.appleDevicesOnly ?? false, // Enable on all devices
  });
};

/**
 * React hook for elastic scroll
 * Add data-elastic attribute to elements you want to have elastic scroll
 */
export const useElasticScroll = (config?: ElasticScrollConfig) => {
  React.useEffect(() => {
    initElasticScroll(config);
  }, []);
};

// For React imports
import React from 'react';

