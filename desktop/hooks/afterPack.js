const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

module.exports = async function(context) {
  console.log("Running afterPack hook to copy backend node_modules...");
  const resourcesDir = path.join(context.appOutDir, 'resources', 'backend', 'node_modules');
  const sourceDir = path.join(context.packager.projectDir, '..', 'backend', 'node_modules');

  if (fs.existsSync(sourceDir)) {
    console.log(`Copying from ${sourceDir} to ${resourcesDir}`);
    // Use robocopy or xcopy on Windows
    if (process.platform === 'win32') {
      spawnSync('xcopy', ['/E', '/I', '/Y', sourceDir, resourcesDir], { stdio: 'inherit' });
    } else {
      spawnSync('cp', ['-R', sourceDir, resourcesDir], { stdio: 'inherit' });
    }
    console.log("Copy complete.");
  } else {
    console.warn("Backend node_modules not found!");
  }
};
