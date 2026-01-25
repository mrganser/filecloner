module.exports = {
  packagerConfig: {
    asar: true,
    icon: './src/assets/icons/icon',
    appBundleId: 'com.mrganser.filecloner',
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: { options: { icon: './src/assets/icons/icon.png' } },
      platforms: ['linux'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          { entry: 'electron/main.ts', config: 'vite.main.config.mjs' },
          { entry: 'electron/preload.ts', config: 'vite.preload.config.mjs' },
        ],
        renderer: [
          { name: 'main_window', config: 'vite.renderer.config.mjs' },
        ],
      },
    },
  ],
};
