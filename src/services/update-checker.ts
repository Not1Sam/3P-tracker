import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';

const VERSION_ENDPOINT = 'https://your-homelab.com/version.json';

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
  try {
    const response = await fetch(VERSION_ENDPOINT);
    if (!response.ok) {
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
      return null;
    }

    const localBuild = parseInt(Application.nativeBuildVersion ?? '0', 10);

    if (remote.buildNumber > localBuild) {
      return remote;
    }

    return null;
  } catch {
    // Network error or invalid JSON — silently skip
    return null;
  }
}

/**
 * Open the download URL for an available update in the system browser.
 */
export async function promptUpdate(info: VersionInfo): Promise<void> {
  await WebBrowser.openBrowserAsync(info.downloadUrl);
}
