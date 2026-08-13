import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import * as Linking from "expo-linking";

interface DownloadOptions {
  url: string;
  /** Base name without extension; a timestamp is appended to avoid collisions. */
  fileName?: string;
  mimeType?: string;
}

export interface DownloadResult {
  /** Local URI of the file that was saved. */
  uri: string;
  /** True when the file was saved to the device automatically. */
  saved: boolean;
  /**
   * Human-readable location where the file was saved, e.g.
   * "/storage/emulated/0/DCIM/animatememories-…mp4" on Android or
   * "Your Photos library" on iOS. Null when nothing was saved.
   */
  path: string | null;
  /** True when a fallback (share sheet / browser) handled the download. */
  fallbackUsed: boolean;
}

function sanitizeFileName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || "animatememories";
}

/**
 * Downloads a remote file (video or image) and saves it directly to the
 * device's media library — Android: internal storage (DCIM/Movies via
 * MediaStore), iOS: the Photos library. The save is fully automatic with no
 * share sheet. On Android 10+ the MediaStore insert needs no permission, so
 * the download lands silently; on older Android / iOS a one-time permission
 * prompt is shown and then saves are silent from then on.
 *
 * The native share sheet is only used as a last resort when the automatic
 * save is refused (permission denied on older devices).
 */
export async function downloadToDevice({
  url,
  fileName,
  mimeType,
}: DownloadOptions): Promise<DownloadResult> {
  // Web has no filesystem — let the browser handle the download natively.
  if (Platform.OS === "web") {
    await Linking.openURL(url);
    return { uri: url, saved: false, path: null, fallbackUsed: true };
  }

  const isVideo =
    mimeType === "video/mp4" || /\.mp4($|\?)/i.test(url) || /video/i.test(url);
  const ext = isVideo ? "mp4" : "jpg";
  const finalMime = mimeType || (isVideo ? "video/mp4" : "image/jpeg");
  const name = `${sanitizeFileName(fileName || "animatememories")}-${Date.now()}.${ext}`;

  const destination = new File(Paths.cache, name);
  await File.downloadFileAsync(url, destination);

  const saveToLibrary = async (): Promise<string | null> => {
    // createAssetAsync copies the file into the device media library and
    // returns the asset with its real location (a file:// path on Android).
    const asset = await MediaLibrary.createAssetAsync(destination.uri);
    if (Platform.OS === "android") {
      return asset.uri.replace(/^file:\/\//, "");
    }
    return "Your Photos library";
  };

  let saved = false;
  let savedPath: string | null = null;
  try {
    // Works without a permission prompt on Android 10+ (MediaStore insert).
    savedPath = await saveToLibrary();
    saved = true;
  } catch (error) {
    // Older Android / iOS need the write permission — ask for it once.
    console.warn("Automatic save failed, requesting media permission:", error);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true, [
        "photo",
        "video",
      ]);
      if (permission.granted) {
        savedPath = await saveToLibrary();
        saved = true;
      }
    } catch (saveError) {
      console.warn("MediaLibrary save failed after permission granted:", saveError);
    }
  }

  let fallbackUsed = false;
  if (!saved) {
    // Last resort: open the native share sheet so the user can still pick a
    // destination manually.
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(destination.uri, {
        mimeType: finalMime,
        dialogTitle: isVideo ? "Save video" : "Save image",
        UTI: isVideo ? "public.mpeg-4" : "public.jpeg",
      });
      fallbackUsed = true;
    } else if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      fallbackUsed = true;
    }
  }

  return { uri: destination.uri, saved, path: savedPath, fallbackUsed };
}
