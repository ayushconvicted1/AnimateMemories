/**
 * Expo config plugin for Meta (Facebook) App Events on iOS + Android.
 *
 * react-native-fbsdk-next does not ship its own Expo plugin, and Expo does not
 * auto-apply Facebook's native keys. This plugin injects the required
 * Info.plist keys (iOS) and AndroidManifest meta-data (Android) so the Meta SDK
 * initializes and App Events are attributed to your Meta app.
 *
 * Configure it in app.json:
 *   [
 *     "./plugins/withFacebookAppEvents",
 *     {
 *       "facebookAppId": "123456789012345",
 *       "facebookClientToken": "abc123",
 *       "facebookDisplayName": "AnimateMemories"
 *     }
 *   ]
 *
 * @type {import('@expo/config-plugins').ConfigPlugin<{facebookAppId: string, facebookClientToken?: string, facebookDisplayName?: string}>}
 */
const {
  withAndroidManifest,
  withInfoPlist,
} = require("@expo/config-plugins");

const META_APP_ID = "com.facebook.sdk.ApplicationId";
const META_CLIENT_TOKEN = "com.facebook.sdk.ClientToken";
const META_AUTO_LOG = "com.facebook.sdk.AutoLogAppEventsEnabled";
const META_ADVERTISER_COLLECTION = "com.facebook.sdk.AdvertiserIDCollectionEnabled";

function withFacebookAppEvents(
  config,
  { facebookAppId, facebookClientToken, facebookDisplayName } = {}
) {
  if (!facebookAppId) {
    throw new Error(
      'withFacebookAppEvents: missing "facebookAppId" in the app.json plugin config.'
    );
  }

  // iOS — these keys are read by the FBSDKCoreKit from Info.plist.
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.FacebookAppID = facebookAppId;
    cfg.modResults.FacebookDisplayName = facebookDisplayName || "AnimateMemories";
    if (facebookClientToken) {
      cfg.modResults.FacebookClientToken = facebookClientToken;
    }
    cfg.modResults.FacebookAutoLogAppEventsEnabled = true;
    cfg.modResults.FacebookAdvertiserIDCollectionEnabled = true;
    return cfg;
  });

  // Android — the FB SDK reads these meta-data values and auto-initializes.
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest?.application?.[0];
    if (!app) {
      throw new Error("withFacebookAppEvents: could not locate <application> in AndroidManifest.");
    }

    app["meta-data"] = app["meta-data"] || [];
    const metaData = app["meta-data"];

    const push = (name, value) => {
      const exists = metaData.some(
        (m) => m.$?.["android:name"] === name
      );
      if (!exists) {
        metaData.push({
          $: { "android:name": name, "android:value": String(value) },
        });
      }
    };

    push(META_APP_ID, facebookAppId);
    if (facebookClientToken) push(META_CLIENT_TOKEN, facebookClientToken);
    push(META_AUTO_LOG, true);
    push(META_ADVERTISER_COLLECTION, true);

    return cfg;
  });

  return config;
}

module.exports = withFacebookAppEvents;
