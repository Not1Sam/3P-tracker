import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';
import { logger } from '@/utils/logger';

const VERSION_ENDPOINT = process.env.EXPO_PUBLIC_VERSION_URL ?? '';

export interface VersionInfo {
  version: string;
  buildNumber: number;
  downloadUrl: string;
  releaseNotes: string;
}

/**
 * Check for app updates by comparing local build number against remote endpoint.
 * Returns VersionInfo if a newer version is available, null otherwise.
 * Silently returns null on any network/parse error.
 */
export async function checkForUpdate(): Promise<VersionInfo | null> {
  // Skip if endpoint is not configured
  if (!VERSION_ENDPOINT || VERSION_ENDPOINT.includes('your-homelab.com')) {
    logger.ui('Update check skipped — no update server configured');
    return null;
  }

  logger.ui('Checking for app updates');
  try {
    const response = await fetch(VERSION_ENDPOINT);
    if (!response.ok) {
      logger.ui('Update check failed', { status: response.status });
      return null;
    }

    const remote: VersionInfo = await response.json();

    // Validate required fields
    if (
      typeof remote.version !== 'string' ||
      typeof remote.buildNumber !== 'number' ||
      typeof remote.downloadUrl !== 'string' ||
      typeof remote.releaseNotes !== 'string'
    ) {
      logger.ui('Invalid version info format from server');
      return null;
    }

    const localBuild = parseInt(Application.nativeBuildVersion ?? '0', 10);
    logger.ui('Version info fetched', { remote: remote.version, remoteBuild: remote.buildNumber, localBuild });

    if (remote.buildNumber > localBuild) {
      logger.uiAction('Update available', { remote: remote.version, localBuild });
      return remote;
    }

    logger.ui('App is up to date');
    return null;
  } catch (e) {
    // Network error or invalid JSON — silently skip
    logger.ui('Update check skipped due to error', { error: e instanceof Error ? e.message : 'Unknown error' });
    return null;
  }
}

/**
 * Open the download URL for an available update in the system browser.
 */
export async function promptUpdate(info: VersionInfo): Promise<void> {
  logger.uiAction('Opening update download page', { url: info.downloadUrl });
  await WebBrowser.openBrowserAsync(info.downloadUrl);
}
