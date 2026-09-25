/**
 * Express Full-Stack Server
 * Provides backend proxy routes (/api/*) for payment operations,
 * webhook processing, and mounts Vite middlewares in dev mode on port 3000.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  createPayment,
  verifyPayment,
  handleWebhookNotification,
  getPaymentMethods,
  getAllPaymentsAdmin,
  simulateWebhook,
} from './src/services/payment/paymentService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

  // JSON Body Parser & CORS
  app.use(express.json());
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // -------------------------------------------------------------
  // PAYMENT API ROUTES (/api/payments/*)
  // -------------------------------------------------------------

  // 1. Get Payment Methods
  app.get('/api/payments/methods', async (_req, res) => {
    try {
      const methods = await getPaymentMethods();
      res.json({ success: true, data: methods });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Create Payment Transaction (Sections 8, 9, 12)
  app.post('/api/payments/create', async (req, res) => {
    try {
      const { order_id, order_number, payment_method, guest_token } = req.body;
      const targetIdentifier = order_number || order_id;

      if (!targetIdentifier) {
        return res.status(400).json({ success: false, error: 'order_id atau order_number wajib diisi.' });
      }

      const result = await createPayment(targetIdentifier, payment_method || 'bank_transfer', guest_token);
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('API /payments/create error:', err);
      res.status(400).json({ success: false, error: err.message || 'Gagal membuat transaksi pembayaran.' });
    }
  });

  // 3. Verify Payment Status (Sections 14 & 18)
  app.post('/api/payments/verify', async (req, res) => {
    try {
      const { order_id, order_number, payment_id } = req.body;
      const targetIdentifier = order_number || order_id;

      if (!targetIdentifier) {
        return res.status(400).json({ success: false, error: 'order_id atau order_number diperlukan.' });
      }

      const result = await verifyPayment(targetIdentifier, payment_id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('API /payments/verify error:', err);
      res.status(400).json({ success: false, error: err.message || 'Gagal memverifikasi status pembayaran.' });
    }
  });

  // 4. Payment Webhook Callback (Sections 15, 16, 17)
  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const signature = req.headers['x-callback-token'] as string | undefined;
      const result = await handleWebhookNotification(req.body, signature);
      res.json(result);
    } catch (err: any) {
      console.error('API /payments/webhook error:', err);
      res.status(400).json({ success: false, error: err.message || 'Webhook processing failed.' });
    }
  });

  // 5. Simulate Webhook for Testing
  app.post('/api/payments/simulate-webhook', async (req, res) => {
    try {
      const { order_number, status } = req.body;
      if (!order_number) {
        return res.status(400).json({ success: false, error: 'order_number wajib diisi.' });
      }
      const result = await simulateWebhook(order_number, status || 'settlement');
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6. Admin Payment History
  app.get('/api/admin/payments', async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const list = await getAllPaymentsAdmin({ status, search });
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // VITE OR STATIC FRONTEND SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
