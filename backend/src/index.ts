import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import 'dotenv/config';
import multer from 'multer';
import { sseManager } from './sseManager';
import { authenticate } from './middleware/auth';
import publicProjectsRouter from './routes/publicProjects';

// Import Router
import clientsRouter from './routes/clients';
import teamMembersRouter from './routes/teamMembers';
import projectsRouter from './routes/projects';
import packagesRouter from './routes/packages';
import addOnsRouter from './routes/addOns';
import promoCodesRouter from './routes/promoCodes';
import teamPaymentRecordsRouter from './routes/teamPaymentRecords';
import contractsRouter from './routes/contracts';
import transactionsRouter from './routes/transactions';
import cardsRouter from './routes/cards';
import pocketsRouter from './routes/pockets';
import projectTeamAssignmentsRouter from './routes/projectTeamAssignments';
import weddingDayChecklistRouter from './routes/weddingDayChecklist';
import galleriesRouter from './routes/galleries';
import portfoliosRouter from './routes/portfolios';
import teamProjectPaymentsRouter from './routes/teamProjectPayments';
import projectSubStatusConfirmationsRouter from './routes/projectSubStatusConfirmations';
import projectPrintItemsRouter from './routes/projectPrintItems';
import calendarEventsRouter from './routes/calendarEvents';
import notificationsRouter from './routes/notifications';
import suggestionsRouter from './routes/suggestions';
import leadsRouter from './routes/leads';
import clientFeedbackRouter from './routes/clientFeedback';
import usersRouter from './routes/users';
import profilesRouter from './routes/profiles';
import uploadRouter from './routes/upload';

const app = express();
const PORT = process.env.PORT || 5000;

// Multer instance untuk endpoint publik dp-proof
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Middleware
const corsOptions = {
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions)); // Mengizinkan request dari frontend (React)
app.use(express.json({ limit: '50mb' })); // Mengizinkan parsing request body berupa JSON dengan limit 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Mengizinkan parsing URL-encoded body dengan limit 50MB

// ==========================================
// PUSAT ROUTING (Modular)
// ==========================================

app.get('/', (req, res) => {
  res.json({ message: '🚀 Imagenic API Backend is running with modular routes!' });
});

// ==========================================
// SSE — Real-Time Event Stream (public)
// ==========================================
app.get('/api/events', authenticate, (req: any, res) => {
  const clientId = crypto.randomUUID();
  sseManager.addClient(clientId, res, req.user?.id ?? null);
});

// ==========================================
// PUBLIC ROUTES — tidak perlu autentikasi
// ==========================================
// /api/users: login & register public; route lain diproteksi di dalam usersRouter
app.use('/api/users', usersRouter);
// /api/suggestions: POST public (klien kirim saran); GET/DELETE diproteksi di dalam suggestionsRouter
app.use('/api/suggestions', suggestionsRouter);
// /api/public/* — semua endpoint publik tanpa auth (moodboard preview, dll)
app.use('/api/public', publicProjectsRouter);
// /api/upload/dp-proof: PUBLIC — klien upload bukti DP dari booking form (tanpa auth)
app.post('/api/upload/dp-proof', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan.' });
    const { v2: cloudinary } = await import('cloudinary');
    const folder = 'imagenic/public/dp-proof';
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', transformation: [{ width: 1200, height: 900, crop: 'limit' }, { quality: 'auto:good', fetch_format: 'auto' }] },
        (error: any, result: any) => { if (error) return reject(error); resolve(result); }
      );
      stream.end(req.file.buffer);
    });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error: any) {
    console.error('[POST /upload/dp-proof] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengupload bukti transfer.' });
  }
});

// ==========================================
// PROTECTED ROUTES — wajib token JWT valid
// semua route di bawah ini memerlukan autentikasi
// ==========================================
app.use('/api/clients', authenticate, clientsRouter);
app.use('/api/team-members', authenticate, teamMembersRouter);
app.use('/api/projects', authenticate, projectsRouter);
app.use('/api/packages', authenticate, packagesRouter);
app.use('/api/add-ons', authenticate, addOnsRouter);
app.use('/api/promo-codes', authenticate, promoCodesRouter);
app.use('/api/team-payment-records', authenticate, teamPaymentRecordsRouter);
app.use('/api/contracts', authenticate, contractsRouter);
app.use('/api/transactions', authenticate, transactionsRouter);
app.use('/api/cards', authenticate, cardsRouter);
app.use('/api/pockets', authenticate, pocketsRouter);
app.use('/api/project-team-assignments', authenticate, projectTeamAssignmentsRouter);
app.use('/api/wedding-day-checklists', authenticate, weddingDayChecklistRouter);
app.use('/api/galleries', authenticate, galleriesRouter);
app.use('/api/portfolios', authenticate, portfoliosRouter);
app.use('/api/team-project-payments', authenticate, teamProjectPaymentsRouter);
app.use('/api/project-sub-status-confirmations', authenticate, projectSubStatusConfirmationsRouter);
app.use('/api/project-print-items', authenticate, projectPrintItemsRouter);
app.use('/api/calendar-events', authenticate, calendarEventsRouter);
app.use('/api/notifications', authenticate, notificationsRouter);
app.use('/api/leads', authenticate, leadsRouter);
app.use('/api/client-feedback', authenticate, clientFeedbackRouter);
app.use('/api/profiles', authenticate, profilesRouter);
app.use('/api/upload', authenticate, uploadRouter);

// Menjalankan Server
app.listen(PORT, () => {
  console.log(`
  ✅ Server berhasil dinyalakan!
  🌍 URL: http://localhost:${PORT}
  `);
});
