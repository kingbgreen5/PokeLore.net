import {
  createArticlePaths,
  deleteArticle,
  listArticles,
  readArticle,
  saveArticle
} from "./articleFileService.js";
import {
  listArticleImages,
  saveArticleImage
} from "./articleImageService.js";

const apiPrefix = "/api/article-studio";

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );
  res.end(JSON.stringify(data));
}

function readRequestJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;

      if (body.length > 12 * 1024 * 1024) {
        reject(
          Object.assign(
            new Error("Request body is too large."),
            {
              statusCode: 413
            }
          )
        );
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(
          Object.assign(
            new Error("Request body must be valid JSON."),
            {
              statusCode: 400
            }
          )
        );
      }
    });

    req.on("error", reject);
  });
}

function routeMatch(req) {
  const url = new URL(
    req.url,
    "http://localhost"
  );

  if (!url.pathname.startsWith(apiPrefix)) {
    return null;
  }

  const suffix = url.pathname.slice(
    apiPrefix.length
  );
  const parts = suffix
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  return {
    url,
    parts
  };
}

async function handleArticleStudioRequest({
  req,
  res,
  paths
}) {
  const match = routeMatch(req);

  if (!match) {
    return false;
  }

  try {
    const {
      parts
    } = match;

    if (
      req.method === "GET" &&
      parts.length === 1 &&
      parts[0] === "articles"
    ) {
      sendJson(res, 200, {
        articles: await listArticles(paths)
      });
      return true;
    }

    if (
      req.method === "GET" &&
      parts.length === 2 &&
      parts[0] === "articles"
    ) {
      sendJson(res, 200, {
        article: await readArticle(paths, parts[1])
      });
      return true;
    }

    if (
      req.method === "POST" &&
      parts.length === 1 &&
      parts[0] === "articles"
    ) {
      const body = await readRequestJson(req);
      sendJson(res, 201, {
        article: await saveArticle(paths, body.article, {
          allowOverwrite: false
        })
      });
      return true;
    }

    if (
      req.method === "GET" &&
      parts.length === 2 &&
      parts[0] === "images"
    ) {
      sendJson(res, 200, {
        images: await listArticleImages(paths, parts[1])
      });
      return true;
    }

    if (
      req.method === "PUT" &&
      parts.length === 2 &&
      parts[0] === "articles"
    ) {
      const body = await readRequestJson(req);
      sendJson(res, 200, {
        article: await saveArticle(paths, body.article, {
          expectedSlug: parts[1],
          allowOverwrite: true
        })
      });
      return true;
    }

    if (
      req.method === "DELETE" &&
      parts.length === 2 &&
      parts[0] === "articles"
    ) {
      sendJson(res, 200, {
        article: await deleteArticle(paths, parts[1])
      });
      return true;
    }

    if (
      req.method === "POST" &&
      parts.length === 1 &&
      parts[0] === "images"
    ) {
      const body = await readRequestJson(req);
      sendJson(res, 201, {
        image: await saveArticleImage(paths, body)
      });
      return true;
    }

    sendJson(res, 404, {
      error: "Article Studio route not found."
    });
    return true;
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, {
      error: error.message,
      validation: error.validation
    });
    return true;
  }
}

export function articleStudioVitePlugin() {
  return {
    name: "article-studio-dev-api",
    configureServer(server) {
      if (process.env.NODE_ENV === "production") {
        return;
      }

      const paths = createArticlePaths(
        server.config.root
      );

      server.middlewares.use((req, res, next) => {
        handleArticleStudioRequest({
          req,
          res,
          paths
        }).then(handled => {
          if (!handled) {
            next();
          }
        });
      });
    }
  };
}
