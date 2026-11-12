/**
 * @file clientblock.js
 * @description Implements CORS header setting and origin validation to block unauthorized client access.
 * @architecture Middleware used globally to restrict API access only to allowed origins and handle preflight requests.
 */

/**
 * @desc    Parses the origin and sets appropriate CORS headers if the origin is allowed
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @returns {boolean} True if origin is allowed, false otherwise
 */
export const setCorsHeaders = (req, res) => {
  if (!res || res.headersSent) return false;
  if (res.locals && res.locals.corsApplied) return res.locals.corsAllowed;

  const rawOrigin = req.headers.origin || req.headers.referer || "";
  let origin;

  try {
    const url = new URL(rawOrigin);
    origin = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;
  } catch {
    origin = "";
  }

  // Allow list: strictly check origin
  const allowedOrigins = [
    /^http:\/\/localhost:5173$/,
    /^https:\/\/([a-zA-Z0-9-]+\.)*metaskills\.site$/,
    /^https:\/\/([a-zA-Z0-9-]+\.)*hf\.space$/,
    /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/,
  ];

  if (process.env.FRONTEND_URL) {
    // Add the exact FRONTEND_URL to the allow list
    try {
      const feUrl = new URL(process.env.FRONTEND_URL);
      const feOrigin = `${feUrl.protocol}//${feUrl.hostname}${feUrl.port ? `:${feUrl.port}` : ""}`;
      allowedOrigins.push(
        new RegExp(`^${feOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
      );
    } catch {
      // ignore invalid URL
    }
  }

  if (process.env.CORS_ORIGIN) {
    const customOrigins = process.env.CORS_ORIGIN.split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    for (const item of customOrigins) {
      if (item === "*") {
        allowedOrigins.push(/.*/);
        continue;
      }
      try {
        const itemUrl = new URL(
          item.includes("://") ? item : `https://${item}`,
        );
        const itemOrigin = `${itemUrl.protocol}//${itemUrl.hostname}${itemUrl.port ? `:${itemUrl.port}` : ""}`;
        allowedOrigins.push(
          new RegExp(`^${itemOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
        );
      } catch {
        allowedOrigins.push(
          new RegExp(`^${item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
        );
      }
    }
  }

  const isAllowed = allowedOrigins.some((regex) => regex.test(origin));

  // CORS headers for all responses
  // Reflect origin with credentials ONLY when origin is explicitly allowed
  if (isAllowed && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-Idempotency-Key, Accept, Origin, x-xsrf-token",
  );
  res.setHeader("Access-Control-Max-Age", "600");
  res.setHeader("Vary", "Origin");

  if (res.locals) {
    res.locals.corsApplied = true;
    res.locals.corsAllowed = isAllowed;
  }

  return isAllowed;
};

/**
 * @desc    Middleware that blocks API requests from disallowed origins, returning 403 or an HTML warning page
 */
export default function clientblock(req, res, next) {
  const isAllowed = setCorsHeaders(req, res);

  // Preflight handler
  if (req.method === "OPTIONS") {
    return res.status(200).send("OK");
  }

  // Block disallowed origins (direct requests)
  if (!isAllowed) {
    // If it's a browser request (has Accept: text/html), show the pretty page
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.status(403).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Restricted</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
    body {
      margin: 0;
      padding: 0;
      font-family: 'Quicksand', sans-serif;
      background: linear-gradient(135deg, #fff5f7 0%, #fff0ec 100%);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 25px 1px #cacaca5e, 0 0 20px -4px #e4e4e487;
      text-align: center;
      max-width: 400px;
      width: 90%;
    }
    h1 {
      background: linear-gradient(90deg, #ff538d, #ff7b51);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 28px;
      margin: 0 0 15px 0;
      font-weight: 700;
    }
    p {
      color: #4a4a4a;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
      font-weight: 500;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(45deg, #e91e63, #ff5722);
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 10px;
      font-weight: 700;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 6px 20px rgba(233, 30, 99, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Access Restricted</h1>
    <p>Direct access to backend routes is restricted.<br>Please visit our main application.</p>
    <a href="https://metaskills.site" class="btn">Go to Metaskills</a>
  </div>
</body>
</html>
    `);
    }
    // For API requests, return JSON
    return res.status(403).json({
      success: false,
      message: "Access Restricted: Origin not allowed",
    });
  }

  next();
}
