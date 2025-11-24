import { MOBILE_DEFAULT_IMAGES } from "./constants";

/**
 * Get the appropriate background image based on screen size
 * @param desktopImageUrl - The custom uploaded image URL (for desktop/tablet)
 * @param mobileImageIndex - The index of the mobile default image (0-9)
 * @param isMobile - Whether the current device is mobile
 * @returns The appropriate image URL to display
 */
export function getBackgroundImage(
  desktopImageUrl: string | null | undefined,
  mobileImageIndex: number | null | undefined,
  isMobile: boolean
): string | null {
  // If on mobile and we have a mobile image index, use the mobile default
  if (isMobile && mobileImageIndex !== null && mobileImageIndex !== undefined) {
    return MOBILE_DEFAULT_IMAGES[mobileImageIndex] || null;
  }
  
  // Otherwise use the desktop image (or null if none)
  return desktopImageUrl || null;
}
