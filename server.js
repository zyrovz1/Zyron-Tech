const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(CONTACTS_FILE)) {
  fs.writeFileSync(CONTACTS_FILE, "[]", "utf8");
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function send(res, status, data, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 15000) {
        reject(new Error("Mensagem muito grande."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleContact(req, res) {
  try {
    const raw = await readBody(req);
    const data = JSON.parse(raw);

    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const company = String(data.company || "").trim();
    const service = String(data.service || "").trim();
    const message = String(data.message || "").trim();

    if (name.length < 2 || name.length > 100) {
      return send(res, 400, JSON.stringify({
        success: false,
        message: "Informe um nome válido."
      }));
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
      return send(res, 400, JSON.stringify({
        success: false,
        message: "Informe um e-mail válido."
      }));
    }

    if (message.length < 10 || message.length > 5000) {
      return send(res, 400, JSON.stringify({
        success: false,
        message: "A descrição deve ter entre 10 e 5000 caracteres."
      }));
    }

    const contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, "utf8"));

    contacts.push({
      id: Date.now().toString(),
      name,
      email,
      company: company.slice(0, 120),
      service: service.slice(0, 120),
      message,
      receivedAt: new Date().toISOString(),
      status: "novo"
    });

    fs.writeFileSync(
      CONTACTS_FILE,
      JSON.stringify(contacts, null, 2),
      "utf8"
    );

    return send(res, 201, JSON.stringify({
      success: true,
      message: "Mensagem recebida. Entraremos em contato."
    }));
  } catch (error) {
    return send(res, 400, JSON.stringify({
      success: false,
      message: "Não foi possível processar sua mensagem."
    }));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "POST" && url.pathname === "/api/contact") {
    return handleContact(req, res);
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, JSON.stringify({
      success: false,
      message: "Método não permitido."
    }));
  }

  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/") pathname = "/index.html";

  const filePath = path.resolve(PUBLIC_DIR, "." + pathname);

  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    return send(res, 403, "Acesso negado.", "text/plain; charset=utf-8");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      const notFound = path.join(PUBLIC_DIR, "404.html");

      return fs.readFile(notFound, (notFoundError, page) => {
        if (notFoundError) {
          return send(res, 404, "Página não encontrada.", "text/plain; charset=utf-8");
        }

        send(res, 404, page, "text/html; charset=utf-8");
      });
    }

    const type = MIME_TYPES[path.extname(filePath).toLowerCase()]
      || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": type,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    });

    if (req.method === "HEAD") return res.end();
    res.end(content);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("----------------------------------");
  console.log("          ZYRON TECH");
  console.log("----------------------------------");
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log("Status: online");
});
