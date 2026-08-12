import {
  spawn,
  spawnSync
} from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename =
  fileURLToPath(import.meta.url);
const __dirname =
  path.dirname(__filename);
const rootDir =
  path.resolve(__dirname, "..");

const baseUrl =
  process.env.E2E_BASE_URL ??
  "http://127.0.0.1:4173";

const routes = [
  {
    path: "/",
    heading: /all types/i
  },
  {
    path: "/items",
    heading: /item database/i
  },
  {
    path: "/item/poke-ball",
    heading: /poké ball/i
  },
  {
    path: "/item/paralyze-heal",
    heading: /paralyze heal/i
  },
  {
    path: "/item/pp-up",
    heading: /pp up/i
  },
  {
    path: "/pokemon/pikachu",
    heading: /pikachu/i
  },
  {
    path: "/pokemon/turtonator",
    heading: /turtonator/i
  },
  {
    path: "/pokemon/natu",
    heading: /natu/i
  },
  {
    path: "/pokemon/776",
    heading: /turtonator/i,
    expectedPath: "/pokemon/turtonator"
  },
  {
    path: "/pokemon/177",
    heading: /natu/i,
    expectedPath: "/pokemon/natu"
  },
  {
    path: "/pokemon/25",
    heading: /pikachu/i,
    expectedPath: "/pokemon/pikachu"
  },
  {
    path: "/pokemon/1",
    heading: /bulbasaur/i,
    expectedPath: "/pokemon/bulbasaur"
  },
  {
    path: "/move/thunderbolt",
    heading: /thunderbolt/i
  },
  {
    path: "/ability/overgrow",
    heading: /overgrow/i
  },
  {
    path: "/type/fire",
    heading: /fire/i
  },
  {
    path: "/locations",
    heading: /locations/i
  },
  {
    path: "/location/kanto-route-2",
    heading: /route 2/i
  },
  {
    path: "/location/hoenn-route-123",
    heading: /route 123/i
  },
  {
    path: "/topics",
    heading: /topics/i
  }
];

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

async function canReachServer() {
  try {
    const response =
      await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30000) {
    if (await canReachServer()) {
      return;
    }

    await sleep(500);
  }

  throw new Error(
    `Timed out waiting for ${baseUrl}`
  );
}

function startViteIfNeeded() {
  if (process.env.E2E_BASE_URL) {
    return null;
  }

  const command =
    process.platform === "win32"
      ? process.env.ComSpec ?? "cmd.exe"
      : "npm";
  const args =
    process.platform === "win32"
      ? [
          "/d",
          "/s",
          "/c",
          "npm run dev -- --host 127.0.0.1 --port 4173"
        ]
      : [
          "run",
          "dev",
          "--",
          "--host",
          "127.0.0.1",
          "--port",
          "4173"
        ];

  const server = spawn(
    command,
    args,
    {
      cwd: rootDir,
      stdio: [
        "ignore",
        "pipe",
        "pipe"
      ]
    }
  );

  return server;
}

function stopServer(server) {
  if (!server) return;

  if (process.platform === "win32") {
    spawnSync(
      "taskkill",
      [
        "/pid",
        String(server.pid),
        "/T",
        "/F"
      ],
      {
        stdio: "ignore"
      }
    );
    return;
  }

  server.kill("SIGTERM");
}

function isIgnoredConsoleError(message) {
  return (
    message.includes(
      "Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED"
    ) ||
    message.includes(
      "Encountered two children with the same key"
    )
  );
}

async function run() {
  const server =
    startViteIfNeeded();
  let browser;

  try {
    await waitForServer();

    browser =
      await chromium.launch();

    const page =
      await browser.newPage();
    const browserErrors = [];

    page.on("console", message => {
      if (
        message.type() === "error" &&
        !isIgnoredConsoleError(
          message.text()
        )
      ) {
        browserErrors.push(
          message.text()
        );
      }
    });

    page.on("pageerror", error => {
      browserErrors.push(
        error.message
      );
    });

    async function verifyGlobalSearch() {
      const searchInput =
        page.locator(
          'input[type="search"]'
        );

      await searchInput.fill(
        "fire stone"
      );

      const resultsPanel =
        page.locator(
          'input[type="search"] + div'
        );

      await resultsPanel
        .getByText(/fire stone/i)
        .waitFor({
          timeout: 10000
        });

      const resultText =
        await resultsPanel.innerText();

      if (
        !/fire stone/i.test(resultText)
      ) {
        throw new Error(
          `Global search did not show Fire Stone. Got ${resultText.slice(0, 160)}`
        );
      }

      await searchInput.fill("");
    }

    for (const route of routes) {
      const url =
        new URL(
          route.path,
          baseUrl
        ).toString();

      await page.goto(url, {
        waitUntil: "domcontentloaded"
      });

      if (route.expectedPath) {
        await page.waitForURL(
          new URL(
            route.expectedPath,
            baseUrl
          ).toString(),
          {
            timeout: 5000
          }
        );
      }

      const bodyText =
        await page
          .locator("body")
          .innerText();

      if (
        !route.heading.test(bodyText)
      ) {
        throw new Error(
          `${route.path}: expected heading/text ${route.heading}, got ${bodyText.slice(0, 160)}`
        );
      }

      if (
        bodyText.includes("Item not found") ||
        bodyText.includes("Pokemon not found") ||
        bodyText.includes("Move not found") ||
        bodyText.includes("Ability not found") ||
        bodyText.includes("Location not found")
      ) {
        throw new Error(
          `${route.path}: rendered a not-found state.`
        );
      }

      if (
        route.path ===
        "/pokemon/pikachu"
      ) {
        await verifyGlobalSearch();
      }
    }

    for (const invalidPath of [
      "/pokemon/999999",
      "/pokemon/not-a-real-pokemon"
    ]) {
      await page.goto(
        new URL(
          invalidPath,
          baseUrl
        ).toString(),
        {
          waitUntil: "domcontentloaded"
        }
      );

      const bodyText =
        await page
          .locator("body")
          .innerText();

      if (
        !/pokemon not found/i.test(bodyText)
      ) {
        throw new Error(
          `${invalidPath}: expected Pokemon Not Found page, got ${bodyText.slice(0, 160)}`
        );
      }
    }

    if (browserErrors.length > 0) {
      throw new Error(
        `Browser console errors:\n${browserErrors.join("\n")}`
      );
    }

    console.log(
      `E2E smoke test passed for ${routes.length} routes and 2 invalid Pokemon routes.`
    );
  } finally {
    await browser?.close();
    stopServer(server);
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
