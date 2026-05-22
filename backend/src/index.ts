import express from 'express';
import cors from 'cors';

// Import Router
import clientsRouter from './routes/clients';
import teamMembersRouter from './routes/teamMembers';
import projectsRouter from './routes/projects';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Mengizinkan request dari frontend (React)
app.use(express.json({ limit: '50mb' })); // Mengizinkan parsing request body berupa JSON dengan limit 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Mengizinkan parsing URL-encoded body dengan limit 50MB

// ==========================================
// PUSAT ROUTING (Modular)
// ==========================================

app.get('/', (req, res) => {
  res.json({ message: '🚀 Imagenic API Backend is running with modular routes!' });
});

// Menyambungkan Router ke endpoint spesifik
app.use('/api/clients', clientsRouter);
app.use('/api/team-members', teamMembersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/packages', require('./routes/packages').default);
app.use('/api/add-ons', require('./routes/addOns').default);
app.use('/api/promo-codes', require('./routes/promoCodes').default);
app.use('/api/team-payment-records', require('./routes/teamPaymentRecords').default);
app.use('/api/contracts', require('./routes/contracts').default);
app.use('/api/transactions', require('./routes/transactions').default);
app.use('/api/cards', require('./routes/cards').default);
app.use('/api/pockets', require('./routes/pockets').default);
app.use('/api/project-team-assignments', require('./routes/projectTeamAssignments').default);
app.use('/api/wedding-day-checklists', require('./routes/weddingDayChecklist').default);
app.use('/api/galleries', require('./routes/galleries').default);
app.use('/api/team-project-payments', require('./routes/teamProjectPayments').default);
app.use('/api/project-sub-status-confirmations', require('./routes/projectSubStatusConfirmations').default);
app.use('/api/project-print-items', require('./routes/projectPrintItems').default);
app.use('/api/calendar-events', require('./routes/calendarEvents').default);
app.use('/api/notifications', require('./routes/notifications').default);
app.use('/api/suggestions', require('./routes/suggestions').default);
app.use('/api/client-feedback', require('./routes/clientFeedback').default);
app.use('/api/users', require('./routes/users').default);
app.use('/api/profiles', require('./routes/profiles').default);

// Nanti Anda tinggal menambahkan router lain seperti ini:
// import projectsRouter from './routes/projects';
// app.use('/api/projects', projectsRouter);

// Menjalankan Server
app.listen(PORT, () => {
  console.log(`
  ✅ Server berhasil dinyalakan!
  🌍 URL: http://localhost:${PORT}
  `);
});
