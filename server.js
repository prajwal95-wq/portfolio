// Zero-dependency static file server for the vanilla portfolio site.
const http = require("http")
const fs = require("fs")
const path = require("path")

const PORT = process.env.PORT || 3000
const ROOT = __dirname

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname)
    let filePath = path.join(ROOT, urlPath)

    // Prevent path traversal outside ROOT.
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403)
      return res.end("Forbidden")
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isDirectory()) {
        filePath = path.join(filePath, "index.html")
      }

      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", ...SECURITY_HEADERS })
          return res.end("<h1>404 — Not Found</h1>")
        }
        const ext = path.extname(filePath).toLowerCase()
        res.writeHead(200, {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": "no-cache",
          ...SECURITY_HEADERS,
        })
        res.end(data)
      })
    })
  } catch (e) {
    res.writeHead(500)
    res.end("Server error")
  }
})

server.listen(PORT, () => {
  console.log(`[v0] Static server running at http://localhost:${PORT}`)
})
