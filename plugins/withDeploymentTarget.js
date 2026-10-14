/**
 * Expo config plugin to enforce a minimum iOS deployment target across all CocoaPods targets
 * and resource bundles (preventing "Simulator deployment target is set to 13.4, but range is 15.0+" errors).
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withDeploymentTarget(config, { deploymentTarget = "15.1" } = {}) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      if (!fs.existsSync(podfilePath)) {
        return cfg;
      }

      let content = fs.readFileSync(podfilePath, "utf-8");

      if (content.includes("Enforce minimum iOS deployment target")) {
        return cfg;
      }

      const hookCode = `
    # Enforce minimum iOS deployment target across all pod targets and resource bundles
    projects = [installer.pods_project]
    projects.concat(installer.generated_projects) if installer.respond_to?(:generated_projects)
    projects.compact.uniq.each do |project|
      project.targets.each do |target|
        target.build_configurations.each do |config|
          if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].nil? || config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${deploymentTarget}
            config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'
          end
        end
      end
    end`;

      // Insert inside the existing post_install block before the closing 'end'
      content = content.replace(
        /(post_install do \|installer\|[\s\S]*?)(\n  end\s*\nend)/,
        `$1${hookCode}$2`
      );

      fs.writeFileSync(podfilePath, content);
      return cfg;
    },
  ]);
}

module.exports = withDeploymentTarget;
