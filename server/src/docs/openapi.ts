export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Mizan (ሚዛን) Sales & Billing Analytics API',
    version: '1.0.0',
    description:
      'Production-grade multi-tenant sales and billing analytics SaaS for Ethiopian businesses, supermarkets, and SaaS platforms. Featuring exact santim money math, automated 15% VAT invoicing, Chapa payments, and high-throughput POS ingestion.',
    contact: {
      name: 'Mizan Engineering',
      url: 'https://mizan-saas.vercel.app',
      email: 'iam.professor.adnan@gmail.com',
    },
  },
  servers: [
    {
      url: 'https://mizan-api-3lif.onrender.com',
      description: 'Render Production Cloud API',
    },
    {
      url: 'http://localhost:4000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Standard user access token obtained from /api/v1/auth/login or /api/v1/auth/demo',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Scoped API key in format: Bearer mzn_live_...',
      },
    },
  },
  paths: {
    '/healthz': {
      get: {
        summary: 'Service Health Check',
        description: 'Returns real-time status of MongoDB Atlas and Upstash Redis connections.',
        responses: {
          200: { description: 'All systems operational' },
          503: { description: 'One or more database connections unhealthy' },
        },
      },
    },
    '/api/v1/auth/demo': {
      post: {
        summary: '1-Click Demo Login',
        description: 'Instantly authenticates as an active Ethiopian demo retail merchant without credentials.',
        responses: {
          200: { description: 'Authenticated successfully with demo tokens and organization' },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Register New Business',
        description: 'Creates a new organization, tenant database partition, and 14-day Business trial.',
        responses: {
          201: { description: 'Account registered and trial provisioned' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'User Sign In',
        description: 'Authenticates with email and password with optional TOTP MFA.',
        responses: {
          200: { description: 'JWT tokens returned' },
        },
      },
    },
    '/ingest/v1/events': {
      post: {
        summary: 'High-Volume POS Batch Event Ingestion',
        security: [{ ApiKeyAuth: [] }],
        description:
          'Batch ingestion endpoint for POS terminals and cash registers. Processes up to 100 sales per request with CRC32 verification and deduplication.',
        responses: {
          202: { description: 'Batch accepted and queued for real-time rollup processing' },
        },
      },
    },
    '/api/v1/orgs/{orgId}/simulate-sales': {
      post: {
        summary: 'Simulate Live POS Sales',
        security: [{ BearerAuth: [] }],
        description: 'Simulates between 1 to 50 Ethiopian retail sales across branches (Telebirr, CBE Birr, Cash).',
        parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Sales simulated and live analytics updated' },
        },
      },
    },
    '/api/v1/orgs/{orgId}/billing/invoices/{invoiceId}/pdf': {
      get: {
        summary: 'Download Official ERCA 15% VAT PDF Invoice',
        security: [{ BearerAuth: [] }],
        description: 'Generates and streams an authentic, tax-compliant PDF invoice with Ethiopian TIN numbers and QR representation.',
        parameters: [
          { name: 'orgId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'invoiceId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'application/pdf streamed' },
        },
      },
    },
    '/api/v1/share/{token}': {
      get: {
        summary: 'Public Read-Only Analytics Dashboard',
        description: 'Resolves sanitized 30-day analytics metrics without tenant PII (try token: "demo").',
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Aggregated public metrics returned' },
        },
      },
    },
  },
};

export function getSwaggerHtml(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Mizan (ሚዛን) - Interactive API Reference</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      <style>
        body { margin: 0; background: #0f172a; }
        .swagger-ui { background: #0f172a; color: #f8fafc; }
        .topbar { display: none !important; }
        .swagger-ui .info .title { color: #34d399; }
        .swagger-ui .info p, .swagger-ui .info li { color: #94a3b8; }
        .swagger-ui .scheme-container { background: #1e293b; border-bottom: 1px solid #334155; }
        .swagger-ui .opblock { border-radius: 10px; background: #1e293b; border: 1px solid #334155; }
        .swagger-ui .opblock .opblock-summary { border-radius: 10px; }
        .swagger-ui .opblock .opblock-summary-method { border-radius: 6px; font-weight: 800; }
        .swagger-ui .btn.execute { background: #10b981; color: #022c22; font-weight: bold; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            spec: ${JSON.stringify(openApiSpec)},
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: "BaseLayout"
          });
        };
      </script>
    </body>
    </html>
  `;
}
