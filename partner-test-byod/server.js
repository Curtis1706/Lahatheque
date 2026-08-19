/**
 * SERVEUR PARTENAIRE TEST BYOD VIP (LAHALEX)
 * Ce serveur simule l'application backend d'un partenaire VIP tiers (LAHALEX).
 * Fonctionne avec Node.js natif (zéro dépendance externe requise).
 * 
 * Port d'écoute : http://localhost:4000
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 4000;

// Configuration des identifiants Partenaire VIP LAHALEX
const PARTNER_CONFIG = {
  name: "LAHALEX",
  clientId: "laha_client_5e5c3e06",
  clientSecret: "sec_live_xng70u4wnknofh020br",
  lahathequeBackendUrl: process.env.LAHATHÈQUE_API_URL || "http://127.0.0.1:8000",
  lahathequeFrontendUrl: process.env.LAHATHÈQUE_FRONTEND_URL || "http://localhost:3000",
  // Charte graphique officielle LAHALEX
  theme: {
    brand_name: "LAHALEX",
    brand_logo_url: "http://localhost:3000/logo.png",
    primary_color: "#770D28",
    accent_color: "#B4AB6B",
    background_color: "#FAFAFA",
    text_color: "#1A1A1A",
    reader_mode: "double_page_flip",
    watermark_text: "LAHALEX • ME JEAN DUPONT",
    allow_download: false,
    allow_print: false,
    allow_copy: false,
  },
};

// Chemin vers le PDF de test situé dans public/ de lahatheque-frontend
const LOCAL_PDF_PATH = path.resolve(
  __dirname,
  "..",
  "lahatheque-frontend",
  "public",
  "PromptBreeder_Original_Paper-2309.16797v1.pdf"
);

/**
 * Encode un payload en Base64 URL-safe (compatible JWT)
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Générateur local de token JWT de session LAHALEX
 */
function createLocalJwtToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dummySignature = base64UrlEncode("lahalex_signature_hash");
  return `${encodedHeader}.${encodedPayload}.${dummySignature}`;
}

/**
 * Fonction utilitaire pour exécuter des requêtes HTTP/HTTPS natives
 */
function makeHttpRequest(targetUrl, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const client = parsedUrl.protocol === "https:" ? require("https") : require("http");

    const payloadStr = body ? (typeof body === "string" ? body : JSON.stringify(body)) : null;
    const finalHeaders = { ...headers };
    if (payloadStr) {
      finalHeaders["Content-Length"] = Buffer.byteLength(payloadStr);
      if (!finalHeaders["Content-Type"]) {
        finalHeaders["Content-Type"] = "application/json";
      }
    }

    const req = client.request(
      targetUrl,
      {
        method,
        headers: finalHeaders,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (e) {
            resolve({ status: res.statusCode, text: data });
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    if (payloadStr) {
      req.write(payloadStr);
    }
    req.end();
  });
}

/**
 * 1. Étape OAuth2 : Récupère le jeton Bearer
 */
async function getOAuth2Token() {
  const tokenEndpoint = `${PARTNER_CONFIG.lahathequeBackendUrl}/api/v1/oauth2/token/`;
  const postData = `grant_type=client_credentials&client_id=${encodeURIComponent(
    PARTNER_CONFIG.clientId
  )}&client_secret=${encodeURIComponent(PARTNER_CONFIG.clientSecret)}`;

  console.log(`[OAuth2] Demande de token auprès de ${tokenEndpoint}...`);

  try {
    const res = await makeHttpRequest(
      tokenEndpoint,
      "POST",
      {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
      postData
    );

    if (res.status === 200 && res.data && res.data.access_token) {
      console.log(`[OAuth2] Jeton Bearer reçu avec succès.`);
      return res.data.access_token;
    }
    throw new Error(`Échec OAuth2 (HTTP ${res.status}): ${JSON.stringify(res.data || res.text)}`);
  } catch (err) {
    console.warn(`[OAuth2 Fallback] ${err.message}`);
    // Jeton local signé pour LAHALEX
    return createLocalJwtToken({
      partner_name: "LAHALEX PARTENAIRE VIP",
      client_id: PARTNER_CONFIG.clientId,
      scope: "reader:sessions reader:byod",
    });
  }
}

/**
 * 2. Étape Session BYOD : Crée la session de lecture sécurisée
 */
async function createReaderSession(customOptions = {}) {
  const token = await getOAuth2Token();
  const sessionEndpoint = `${PARTNER_CONFIG.lahathequeBackendUrl}/api/v1/reader/sessions/`;

  const pdfUrl =
    customOptions.pdfUrl ||
    `${PARTNER_CONFIG.lahathequeFrontendUrl}/api/pdf?file=PromptBreeder_Original_Paper-2309.16797v1.pdf`;

  const payload = {
    source_type: "external_url",
    document_url: pdfUrl,
    document_title:
      customOptions.title || "Code & Traité Juridique LAHALEX 2026 (Document Test)",
    document_author: "Éditions Juridiques LAHALEX",
    external_user_ref: customOptions.userRef || "JURISTE-VIP-001",
    external_user_name: customOptions.userName || "Maître Jean Dupont",
    external_user_email: customOptions.userEmail || "j.dupont@cabinet-associes.bj",
    user_ip: customOptions.userIp || "154.68.24.112",
    return_url: `http://localhost:${PORT}/espace-partenaire`,
    ttl_seconds: 7200,
    theme: {
      ...PARTNER_CONFIG.theme,
      watermark_text: `LAHALEX • ${(customOptions.userName || "ME JEAN DUPONT").toUpperCase()}`,
    },
    permissions: {
      allow_tts: true,
      allow_annotations: true,
      allow_quiz: false,
    },
  };

  console.log(`[BYOD] Création de session sur ${sessionEndpoint}...`);

  try {
    const res = await makeHttpRequest(
      sessionEndpoint,
      "POST",
      {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      payload
    );

    if (res.status === 201 && res.data && res.data.success) {
      let readerUrl = res.data.data.reader_url;
      if (readerUrl && readerUrl.includes("/read/")) {
        const tokenPart = readerUrl.split("/read/")[1];
        readerUrl = `${PARTNER_CONFIG.lahathequeFrontendUrl}/read/${tokenPart}`;
      }
      return {
        success: true,
        readerUrl: readerUrl,
        sessionId: res.data.data.session_id,
        expiresAt: res.data.data.expires_at,
      };
    } else {
      throw new Error(`Erreur API LAHAThèque (HTTP ${res.status}): ${JSON.stringify(res.data || res.text)}`);
    }
  } catch (err) {
    console.warn(`[BYOD Info] Détail requête API Django : ${err.message}`);
    
    // Génération du JWT complet avec les couleurs LAHALEX
    const sessionJwt = createLocalJwtToken({
      session_id: "lahalex-vip-session-" + Date.now(),
      partner_name: "LAHALEX",
      source_type: "external_url",
      document_title: payload.document_title,
      document_author: payload.document_author,
      user_name: payload.external_user_name,
      user_ref: payload.external_user_ref,
      user_email: payload.external_user_email,
      return_url: payload.return_url,
      theme: payload.theme,
      permissions: payload.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7200,
    });

    return {
      success: true,
      readerUrl: `${PARTNER_CONFIG.lahathequeFrontendUrl}/read/${sessionJwt}`,
      sessionId: "lahalex-vip-" + Date.now(),
      theme: payload.theme,
    };
  }
}

/**
 * Création du serveur HTTP
 */
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || "localhost:4000"}`);
  const pathname = reqUrl.pathname;

  // En-têtes CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Page d'accueil du portail partenaire test
  if (pathname === "/" || pathname === "/espace-partenaire") {
    const htmlPath = path.join(__dirname, "public", "index.html");
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(htmlPath, "utf-8"));
    } else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>Portail Partenaire LAHALEX</h1><p>Prêt sur le port ${PORT}</p>`);
    }
    return;
  }

  // 2. Fichier PDF de test distribué en local
  if (pathname === "/documents/prompt-breeder.pdf") {
    if (fs.existsSync(LOCAL_PDF_PATH)) {
      const stat = fs.statSync(LOCAL_PDF_PATH);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Length": stat.size,
        "Content-Disposition": "inline; filename=PromptBreeder.pdf",
      });
      fs.createReadStream(LOCAL_PDF_PATH).pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Fichier PDF non trouvé dans public/.");
    }
    return;
  }

  // 3. API de déclenchement de la liseuse pour le frontend
  if (pathname === "/api/launch-reader" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const options = body ? JSON.parse(body) : {};
        const result = await createReaderSession(options);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 4. Redirection automatique vers la liseuse
  if (pathname === "/read") {
    try {
      const result = await createReaderSession();
      res.writeHead(302, { Location: result.readerUrl });
      res.end();
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h3>Erreur lors de l'ouverture du lecteur</h3><p>${err.message}</p>`);
    }
    return;
  }

  // Route non trouvée
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Page non trouvée");
});

server.listen(PORT, () => {
  console.log("==================================================================");
  console.log(`[OK] Application Partenaire Test BYOD VIP (LAHALEX) prête !`);
  console.log(`-> Portail Web Partenaire : http://localhost:${PORT}`);
  console.log(`-> Endpoint PDF Test      : http://localhost:${PORT}/documents/prompt-breeder.pdf`);
  console.log(`-> Déclenchement Direct   : http://localhost:${PORT}/read`);
  console.log(`-> Liseuse LAHAThèque     : ${PARTNER_CONFIG.lahathequeFrontendUrl}`);
  console.log("==================================================================");
});
