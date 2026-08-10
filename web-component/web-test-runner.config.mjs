import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'test/**/*.test.ts',
  nodeResolve: true,
  // Vaadin 25 provides the global Lumo tokens (custom properties, icon
  // font) as plain CSS loaded by the application; emulate that here
  testRunnerHtml: (testFramework) => `
    <html>
      <head>
        <link rel="stylesheet" href="/node_modules/@vaadin/vaadin-lumo-styles/dist/lumo.css" />
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
  plugins: [esbuildPlugin({ ts: true, target: 'es2022' })],
  browsers: [playwrightLauncher({ product: 'chromium' })],
  testFramework: {
    config: {
      timeout: 5000,
    },
  },
};
