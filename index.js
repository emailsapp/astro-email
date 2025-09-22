import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import * as vite from "vite";
import child_process from "node:child_process";
import archiver from "archiver";

/**
 * @param {object} options
 * @param {string | ((name: string) => string)} options.filename - The filename to use for the output files. Use `[name]` to insert the page name.
 * @returns {import('astro').AstroIntegration}
 */
export default function email(options) {
  return {
    name: "email",
    hooks: {
      "astro:config:setup": ({
        command,
        updateConfig,
        injectRoute,
        addRenderer,
        addDevToolbarApp,
      }) => {
        addRenderer({
          name: "astro-email/react",
          serverEntrypoint: "@astrojs/react/server.js",
        });

        updateConfig({
          vite: {
            plugins: [
              react(),
              optionsPlugin(false), // required for @astrojs/react/server.js to work.
            ],
            build: {
              assetsInlineLimit: 1024 * 20, // inline all assets
            },
          },
          compressHTML: false,
          build: {
            format: "file",
          },
        });

        injectRoute({
          pattern: "/",
          entrypoint: "astro-email/index.astro",
        });

        addDevToolbarApp("astro-email/toolbar.js");
      },
      "astro:build:done": async ({ dir, pages }) => {
        if (options.filename) {
          for (const page of pages) {
            const pathname = page.pathname || "index";
            const basename = pathname.split(".")[0];

            if (!pathname) continue;

            const name =
              typeof options.filename === "string"
                ? options.filename.replace("[name]", basename)
                : options.filename(basename);

            fs.renameSync(
              path.resolve(dir.pathname, `${pathname}.html`),
              path.resolve(dir.pathname, name),
            );
          }
        }

        await archiveAssets();
      },
      "astro:server:setup": ({ server }) => {
        server.ws.on("astro-dev-toolbar:astro-email:toggled", (data) => {
          if (data.state === true) {
            child_process.exec("astro build");
          }
        });
      },
    },
  };
}

/** @type {(xperimentalReactChildren?: boolean) => vite.Plugin} */
function optionsPlugin(experimentalReactChildren) {
  const virtualModule = "astro:react:opts";
  const virtualModuleId = `\0${virtualModule}`;
  return {
    name: "astro-email/react:opts",
    resolveId(id) {
      if (id === virtualModule) {
        return virtualModuleId;
      }
    },
    load(id) {
      if (id === virtualModuleId) {
        return {
          code: `export default {
						experimentalReactChildren: ${JSON.stringify(experimentalReactChildren)}
					}`,
        };
      }
    },
  };
}

async function archiveAssets() {
  // Generate assets zip at build time
  const distPath = path.resolve("dist");

  async function createAssetsZip() {
    if (!fs.existsSync(distPath)) {
      console.log("No dist directory found, skipping assets zip creation");
      return null;
    }

    const tmpZipPath = path.resolve("assets.zip");

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(tmpZipPath);
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      output.on("close", () => {
        console.log(`Assets zip created: ${archive.pointer()} total bytes`);

        // Move assets.zip to dist/
        const finalZipPath = path.resolve(distPath, "assets.zip");
        fs.renameSync(tmpZipPath, finalZipPath);
        console.log(`Assets zip moved to: ${finalZipPath}`);

        resolve(tmpZipPath);
      });

      archive.on("error", (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(distPath, false);
      archive.finalize();
    });
  }

  return await createAssetsZip();
}
