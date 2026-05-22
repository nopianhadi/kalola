import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const prismaProjects = (prisma as any).projects;
const prismaPackages = (prisma as any).packages;
const prismaAddOns = (prisma as any).add_ons;
const prismaProjectAddOns = (prisma as any).project_add_ons;
const prismaProjectTeamAssignments = (prisma as any).project_team_assignments;

// Helper to map DB record to Frontend model
const mapToFrontend = (p: any) => {
  if (!p) return p;
  const formatted: any = {
    id: p.id,
    projectName: p.project_name,
    clientName: p.client_name,
    clientId: p.client_id,
    projectType: p.project_type,
    packageName: p.package_name,
    packageId: p.package_id,
    date: p.date,
    deadlineDate: p.deadline_date,
    location: p.location,
    progress: Number(p.progress || 0),
    status: p.status,
    activeSubStatuses: p.active_sub_statuses || [],
    totalCost: Number(p.total_cost || 0),
    amountPaid: Number(p.amount_paid || 0),
    paymentStatus: p.payment_status,
    notes: p.notes,
    accommodation: p.accommodation,
    driveLink: p.drive_link,
    clientDriveLink: p.client_drive_link,
    finalDriveLink: p.final_drive_link,
    startTime: p.start_time,
    endTime: p.end_time,
    image: p.image,
    color: p.color,
    statusHistory: p.status_history || [],
    promoCodeId: p.promo_code_id,
    discountAmount: Number(p.discount_amount || 0),
    dpProofUrl: p.dp_proof_url,
    printingCost: Number(p.printing_cost || 0),
    transportCost: Number(p.transport_cost || 0),
    transportPaid: p.transport_paid,
    transportNote: p.transport_note,
    printingCardId: p.printing_card_id,
    transportCardId: p.transport_card_id,
    transportDetails: p.transport_details || [],
    transportUsed: p.transport_used,
    customCosts: p.custom_costs || [],
    isEditingConfirmedByClient: p.is_editing_confirmed_by_client,
    isPrintingConfirmedByClient: p.is_printing_confirmed_by_client,
    isDeliveryConfirmedByClient: p.is_delivery_confirmed_by_client,
    confirmedSubStatuses: p.confirmed_sub_statuses || [],
    clientSubStatusNotes: p.client_sub_status_notes || {},
    subStatusConfirmationSentAt: p.sub_status_confirmation_sent_at || {},
    completedDigitalItems: p.completed_digital_items || [],
    invoiceSignature: p.invoice_signature,
    customSubStatuses: p.custom_sub_statuses || [],
    bookingStatus: p.booking_status,
    rejectionReason: p.rejection_reason,
    chatHistory: p.chat_history || [],
    durationSelection: p.duration_selection,
    unitPrice: Number(p.unit_price || 0),
    address: p.address,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };

  // Map relations if they exist
  if (p.project_team_assignments) {
    formatted.team = p.project_team_assignments.map((t: any) => ({
      memberId: t.member_id,
      name: t.member_name,
      role: t.member_role,
      category: t.member_category || 'Tim',
      fee: Number(t.fee || 0),
      subJob: t.sub_job,
    }));
  }
  if (p.project_add_ons) {
    formatted.addOns = p.project_add_ons.map((pa: any) => pa.add_ons);
  }

  return formatted;
};

// Helper to map Frontend body to DB model
const mapToDb = (body: any) => {
  const result: any = {};
  if (body.id) result.id = Number(body.id);
  if (body.projectName) result.project_name = body.projectName;
  if (body.clientName) result.client_name = body.clientName;
  if (body.clientId) result.client_id = body.clientId;
  if (body.projectType) result.project_type = body.projectType;
  if (body.packageName) result.package_name = body.packageName;
  if (body.packageId) result.package_id = body.packageId;
  
  if (body.date) result.date = new Date(body.date);
  if (body.deadlineDate) result.deadline_date = new Date(body.deadlineDate);
  
  if (body.location) result.location = body.location;
  if (body.progress !== undefined) result.progress = Number(body.progress);
  if (body.status) result.status = body.status;
  if (body.activeSubStatuses) result.active_sub_statuses = body.activeSubStatuses;
  
  if (body.totalCost !== undefined) result.total_cost = Number(body.totalCost);
  if (body.amountPaid !== undefined) result.amount_paid = Number(body.amountPaid);
  if (body.paymentStatus) result.payment_status = body.paymentStatus;
  
  if (body.notes !== undefined) result.notes = body.notes;
  if (body.accommodation) result.accommodation = body.accommodation;
  if (body.driveLink) result.drive_link = body.driveLink;
  if (body.clientDriveLink) result.client_drive_link = body.clientDriveLink;
  if (body.finalDriveLink) result.final_drive_link = body.finalDriveLink;
  
  if (body.startTime) {
    const d = new Date(body.startTime);
    result.start_time = isNaN(d.getTime()) ? null : d;
  }
  if (body.endTime) {
    const d = new Date(body.endTime);
    result.end_time = isNaN(d.getTime()) ? null : d;
  }
  
  if (body.image) result.image = body.image;
  if (body.color) result.color = body.color;
  if (body.statusHistory) result.status_history = body.statusHistory;
  
  if (body.promoCodeId) result.promo_code_id = body.promoCodeId;
  if (body.discountAmount !== undefined) result.discount_amount = Number(body.discountAmount);
  if (body.dpProofUrl) result.dp_proof_url = body.dpProofUrl;
  
  if (body.printingCost !== undefined) result.printing_cost = Number(body.printingCost);
  if (body.transportCost !== undefined) result.transport_cost = Number(body.transportCost);
  if (body.transportPaid !== undefined) result.transport_paid = body.transportPaid;
  if (body.transportNote) result.transport_note = body.transportNote;
  
  if (body.printingCardId) result.printing_card_id = body.printingCardId;
  if (body.transportCardId) result.transport_card_id = body.transportCardId;
  
  if (body.transportDetails) result.transport_details = body.transportDetails;
  if (body.transportUsed !== undefined) result.transport_used = body.transportUsed;
  if (body.customCosts) result.custom_costs = body.customCosts;
  
  if (body.isEditingConfirmedByClient !== undefined) result.is_editing_confirmed_by_client = body.isEditingConfirmedByClient;
  if (body.isPrintingConfirmedByClient !== undefined) result.is_printing_confirmed_by_client = body.isPrintingConfirmedByClient;
  if (body.isDeliveryConfirmedByClient !== undefined) result.is_delivery_confirmed_by_client = body.isDeliveryConfirmedByClient;
  
  if (body.confirmedSubStatuses) result.confirmed_sub_statuses = body.confirmedSubStatuses;
  if (body.clientSubStatusNotes) result.client_sub_status_notes = body.clientSubStatusNotes;
  if (body.subStatusConfirmationSentAt) result.sub_status_confirmation_sent_at = body.subStatusConfirmationSentAt;
  if (body.completedDigitalItems) result.completed_digital_items = body.completedDigitalItems;
  
  if (body.invoiceSignature) result.invoice_signature = body.invoiceSignature;
  if (body.customSubStatuses) result.custom_sub_statuses = body.customSubStatuses;
  if (body.bookingStatus) result.booking_status = body.bookingStatus;
  if (body.rejectionReason) result.rejection_reason = body.rejectionReason;
  if (body.chatHistory) result.chat_history = body.chatHistory;
  
  if (body.durationSelection) result.duration_selection = body.durationSelection;
  if (body.unitPrice !== undefined) result.unit_price = Number(body.unitPrice);
  if (body.address) result.address = body.address;
  // Note: portal_access_id doesn't exist in projects table, only in clients table

  return result;
};

// 1. Summary
router.get('/summary', async (req, res) => {
  try {
    const result = await prismaProjects.aggregate({
      _count: true,
      _sum: { total_cost: true, amount_paid: true }
    });
    res.json({
      totalCount: result._count || 0,
      totalRevenue: Number(result._sum.total_cost || 0),
      totalAmountPaid: Number(result._sum.amount_paid || 0)
    });
  } catch (error: any) {
    console.error('[GET /projects/summary] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengambil summary projects' });
  }
});

// 2. Paginated
router.get('/paginated', async (req, res) => {
  try {
    const { page = '1', limit = '20', search, status, paymentStatus } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { project_name: { contains: String(search) } },
        { client_name: { contains: String(search) } }
      ];
    }
    if (status && status !== 'all') where.status = String(status);
    if (paymentStatus && paymentStatus !== 'all') where.payment_status = String(paymentStatus);

    const [total, rawRows] = await Promise.all([
      prismaProjects.count({ where }),
      prismaProjects.findMany({ 
        where, 
        skip, 
        take, 
        orderBy: { date: 'desc' },
        include: {
          project_team_assignments: true,
          project_add_ons: { include: { add_ons: true } }
        }
      })
    ]);

    res.json({
      projects: rawRows.map(mapToFrontend),
      total
    });
  } catch (error: any) {
    console.error('[GET /projects/paginated] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengambil data paginated' });
  }
});

// 3. List All
router.get('/', async (req, res) => {
  try {
    const { withRelations = 'true' } = req.query;
    const include = withRelations === 'true' ? {
      project_team_assignments: true,
      project_add_ons: { include: { add_ons: true } }
    } : undefined;

    const rawProjects = await prismaProjects.findMany({
      orderBy: { date: 'desc' },
      include
    });

    res.json(rawProjects.map(mapToFrontend));
  } catch (error: any) {
    console.error('[GET /projects] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengambil data projects' });
  }
});

// 4. Get By ID
router.get('/:id', async (req, res) => {
  try {
    const raw = await prismaProjects.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        project_team_assignments: true,
        project_add_ons: { include: { add_ons: true } }
      }
    });
    if (!raw) return res.status(404).json({ error: 'Not found' });
    res.json(mapToFrontend(raw));
  } catch (error: any) {
    console.error('[GET /projects/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/:id/with-relations', async (req, res) => {
  try {
    const raw = await prismaProjects.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        project_team_assignments: true,
        project_add_ons: { include: { add_ons: true } }
      }
    });
    if (!raw) return res.status(404).json({ error: 'Not found' });
    res.json(mapToFrontend(raw));
  } catch (error: any) {
    console.error('[GET /projects/:id/with-relations] Error:', error?.message);
    res.status(500).json({ error: 'Gagal' });
  }
});

// 5. Create
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    console.log('[POST /projects] Received body:', JSON.stringify(body, null, 2));
    const data = mapToDb(body);
    delete data.id; // Let DB handle auto-increment
    delete data.portal_access_id; // portal_access_id doesn't exist in projects table

    console.log('[POST /projects] Mapped data:', JSON.stringify(data, null, 2));
    const project = await prismaProjects.create({ data });
    res.status(201).json(mapToFrontend(project));
  } catch (error: any) {
    console.error('[POST /projects] Error:', error?.message || error);
    console.error('[POST /projects] Full error:', error);
    res.status(500).json({ error: 'Gagal membuat project', details: error?.message });
  }
});

// 6. Update
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = mapToDb(req.body);
    delete data.id;

    const project = await prismaProjects.update({
      where: { id: Number(id) },
      data
    });
    res.json(mapToFrontend(project));
  } catch (error: any) {
    console.error('[PATCH /projects/:id] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal update project' });
  }
});

// 7. Delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = Number(id);

    // Check if project exists
    const project = await prismaProjects.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }

    // Delete related records first (transactions don't have CASCADE delete)
    // Note: Other relations like contracts, project_add_ons, etc. have CASCADE delete in schema
    const prismaTransactions = (prisma as any).transactions;
    await prismaTransactions.deleteMany({
      where: { project_id: projectId }
    });

    // Now delete the project (CASCADE will handle other relations)
    await prismaProjects.delete({
      where: { id: projectId }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /projects/:id] Error:', error?.message || error);
    console.error('[DELETE /projects/:id] Full error:', error);
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Project tidak ditemukan' });
    } else {
      res.status(500).json({ error: 'Gagal menghapus project', details: error?.message });
    }
  }
});

// 8. Sync Finance
router.post('/:id/sync-finance', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prismaProjects.findUnique({
      where: { id: Number(id) },
      include: { transactions: true }
    });
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const totalPaid = project.transactions.reduce((sum: number, t: any) => {
        return sum + Number(t.amount || 0);
    }, 0);
    
    const newStatus = totalPaid >= Number(project.total_cost) ? 'Lunas' : (totalPaid > 0 ? 'DP Terbayar' : 'Belum Bayar');
    
    const updated = await prismaProjects.update({
      where: { id: Number(id) },
      data: { 
        amount_paid: totalPaid,
        payment_status: newStatus
      }
    });
    
    res.json(mapToFrontend(updated));
  } catch (error: any) {
    console.error('[POST /projects/:id/sync-finance] Error:', error?.message);
    res.status(500).json({ error: 'Gagal sync finance' });
  }
});

export default router;
