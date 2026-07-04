const builder = require("electron-builder");

builder.build({
  config: {
    appId: "com.buktiin.app",
    productName: "Buktiin",
    directories: {
      output: "dist_new"
    },
    extraResources: [
      {
        from: "../backend/dist",
        to: "backend/dist"
      },
      {
        from: "../backend/node_modules",
        to: "backend/node_modules"
      },
      {
        from: "../backend/package.json",
        to: "backend/package.json"
      },
      {
        from: "../backend/.env",
        to: "backend/.env"
      },
      {
        from: "../app/dist",
        to: "frontend"
      }
    ],
    win: {
      target: "nsis",
      icon: "build/icon.png",
      sign: async () => {
        console.log("Custom sign hook: Bypassed signtool!");
        return;
      }
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      perMachine: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true
    }
  }
}).then(() => {
  console.log("Build OK!");
}).catch((error) => {
  console.error("Build Failed!", error);
  process.exit(1);
});
