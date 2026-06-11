import { apiFetch } from '@/lib/apiClient';
import { Profile, ProjectStatusConfig } from '@/types';

function asJsonObject<T = any>(value: any): T | null {
  if (!value) return null;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return null; }
  }
  return null;
}

export function fromRow(row: any): Profile {
  return {
    id: Number(row.id),
    adminUserId: Number(row.admin_user_id || 0),
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    companyName: row.company_name || '',
    website: row.website || '',
    address: row.address || '',
    bankAccount: row.bank_account || '',
    authorizedSigner: row.authorized_signer || '',
    idNumber: row.id_number || undefined,
    bio: row.bio || '',
    incomeCategories: asJsonObject(row.income_categories) || [],
    expenseCategories: asJsonObject(row.expense_categories) || [],
    projectTypes: asJsonObject(row.project_types) || [],
    eventTypes: asJsonObject(row.event_types) || [],
    assetCategories: asJsonObject(row.asset_categories) || [],
    sopCategories: asJsonObject(row.sop_categories) || [],
    packageCategories: asJsonObject(row.package_categories) || [],
    projectStatusConfig: (asJsonObject(row.project_status_config) || []) as ProjectStatusConfig[],
    notificationSettings: (asJsonObject(row.notification_settings) && typeof asJsonObject(row.notification_settings) === 'object')
      ? { 
          newProject: !!asJsonObject(row.notification_settings).newProject, 
          paymentConfirmation: !!asJsonObject(row.notification_settings).paymentConfirmation, 
          deadlineReminder: !!asJsonObject(row.notification_settings).deadlineReminder 
        }
      : { newProject: true, paymentConfirmation: true, deadlineReminder: true },
    securitySettings: (asJsonObject(row.security_settings) && typeof asJsonObject(row.security_settings) === 'object')
      ? { twoFactorEnabled: !!asJsonObject(row.security_settings).twoFactorEnabled }
      : { twoFactorEnabled: false },
    briefingTemplate: row.briefing_template || '',
    termsAndConditions: row.terms_and_conditions || undefined,
    logoBase64: row.logo_base64 || undefined,
    signatureBase64: row.signature_base64 || undefined,
    brandColor: row.brand_color || undefined,
    publicPageConfig: asJsonObject(row.public_page_config) ? {
      template: asJsonObject(row.public_page_config).template || 'classic',
      title: asJsonObject(row.public_page_config).title || 'Vena Pictures',
      introduction: asJsonObject(row.public_page_config).introduction || '',
      galleryImages: asJsonObject(row.public_page_config).galleryImages || [],
    } : {
      template: (row.public_page_template || 'classic') as any,
      title: row.public_page_title || 'Vena Pictures',
      introduction: row.public_page_introduction || '',
      galleryImages: [],
    },
    packageShareTemplate: row.package_share_template || undefined,
    bookingFormTemplate: row.booking_form_template || undefined,
    // Prefer dedicated column; else, fallback to booking_form_template JSON envelope { chatTemplates: [...] }
    chatTemplates: asJsonObject(row.chat_templates) || (asJsonObject(row.booking_form_template)?.chatTemplates ?? []),
    billingTemplates: asJsonObject(row.booking_form_template)?.billingTemplates ?? undefined,
    invoiceShareTemplate: asJsonObject(row.booking_form_template)?.invoiceShareTemplate ?? undefined,
    receiptShareTemplate: asJsonObject(row.booking_form_template)?.receiptShareTemplate ?? undefined,
    expenseShareTemplate: asJsonObject(row.booking_form_template)?.expenseShareTemplate ?? undefined,
    portalShareTemplate: asJsonObject(row.booking_form_template)?.portalShareTemplate ?? undefined,
    checklistTemplates: asJsonObject(row.booking_form_template)?.checklistTemplates ?? undefined,
    customRegions: asJsonObject(row.booking_form_template)?.customRegions ?? undefined,
  } as Profile;
}

function toRow(p: Partial<Profile>): any {
  return {
    ...(p.adminUserId !== undefined ? { admin_user_id: p.adminUserId } : {}),
    ...(p.fullName !== undefined ? { full_name: p.fullName } : {}),
    ...(p.email !== undefined ? { email: p.email } : {}),
    ...(p.phone !== undefined ? { phone: p.phone } : {}),
    ...(p.companyName !== undefined ? { company_name: p.companyName } : {}),
    ...(p.website !== undefined ? { website: p.website } : {}),
    ...(p.address !== undefined ? { address: p.address } : {}),
    ...(p.bankAccount !== undefined ? { bank_account: p.bankAccount } : {}),
    ...(p.authorizedSigner !== undefined ? { authorized_signer: p.authorizedSigner } : {}),
    ...(p.idNumber !== undefined ? { id_number: p.idNumber } : {}),
    ...(p.bio !== undefined ? { bio: p.bio } : {}),
    ...(p.incomeCategories !== undefined ? { income_categories: JSON.stringify(p.incomeCategories) } : {}),
    ...(p.expenseCategories !== undefined ? { expense_categories: JSON.stringify(p.expenseCategories) } : {}),
    ...(p.projectTypes !== undefined ? { project_types: JSON.stringify(p.projectTypes) } : {}),
    ...(p.eventTypes !== undefined ? { event_types: JSON.stringify(p.eventTypes) } : {}),
    ...(p.assetCategories !== undefined ? { asset_categories: JSON.stringify(p.assetCategories) } : {}),
    ...(p.sopCategories !== undefined ? { sop_categories: JSON.stringify(p.sopCategories) } : {}),
    ...(p.packageCategories !== undefined ? { package_categories: JSON.stringify(p.packageCategories) } : {}),
    ...(p.termsAndConditions !== undefined ? { terms_and_conditions: p.termsAndConditions } : {}),
    ...(p.logoBase64 !== undefined ? { logo_base64: p.logoBase64 } : {}),
    ...(p.signatureBase64 !== undefined ? { signature_base64: p.signatureBase64 } : {}),
    ...(p.brandColor !== undefined ? { brand_color: p.brandColor } : {}),
    ...(p.publicPageConfig !== undefined ? {
      // Only write to JSONB column that actually exists in the current schema
      public_page_config: JSON.stringify(p.publicPageConfig),
    } : {}),
    ...(p.projectStatusConfig !== undefined ? { project_status_config: JSON.stringify(p.projectStatusConfig) } : {}),
    ...(p.packageShareTemplate !== undefined ? { package_share_template: p.packageShareTemplate } : {}),
    ...(p.bookingFormTemplate !== undefined ? { booking_form_template: p.bookingFormTemplate } : {}),
    ...(p.briefingTemplate !== undefined ? { briefing_template: p.briefingTemplate } : {}),
    ...(p.notificationSettings !== undefined ? { notification_settings: JSON.stringify(p.notificationSettings) } : {}),
    ...(p.securitySettings !== undefined ? { security_settings: JSON.stringify(p.securitySettings) } : {}),
    ...(p.chatTemplates !== undefined ? { chat_templates: JSON.stringify(p.chatTemplates) } : {}),
  };
}

export async function getProfile(id?: number): Promise<Profile | null> {
  try {
    const endpoint = id ? `/profiles?id=${id}` : '/profiles';
    const data = await apiFetch<any>(endpoint);
    return fromRow(data);
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('Not found') || error.message.includes('not found')) return null;
    throw error;
  }
}

export async function upsertProfile(input: Partial<Profile> & { id?: number }): Promise<Profile> {
  // Declare payload variable at function scope
  let bookingFormTemplatePayload: string | undefined = undefined;

  // If any of the templates are provided, merge into booking_form_template JSON envelope
  if (
    input.chatTemplates !== undefined ||
    input.billingTemplates !== undefined ||
    input.invoiceShareTemplate !== undefined ||
    input.receiptShareTemplate !== undefined ||
    input.expenseShareTemplate !== undefined ||
    input.portalShareTemplate !== undefined ||
    input.checklistTemplates !== undefined ||
    input.customRegions !== undefined
  ) {
    let existingEnvelope: any = {};
    if (input.id) {
      const current = await getProfile(input.id);
      if (current && current.bookingFormTemplate) {
         existingEnvelope = { bookingFormTemplate: current.bookingFormTemplate };
      }
    }
    const merged: any = { ...existingEnvelope };
    if (input.chatTemplates !== undefined) merged.chatTemplates = input.chatTemplates;
    if (input.billingTemplates !== undefined) merged.billingTemplates = input.billingTemplates;
    if (input.invoiceShareTemplate !== undefined) merged.invoiceShareTemplate = input.invoiceShareTemplate;
    if (input.receiptShareTemplate !== undefined) merged.receiptShareTemplate = input.receiptShareTemplate;
    if (input.expenseShareTemplate !== undefined) merged.expenseShareTemplate = input.expenseShareTemplate;
    if (input.portalShareTemplate !== undefined) merged.portalShareTemplate = input.portalShareTemplate;
    if (input.checklistTemplates !== undefined) merged.checklistTemplates = input.checklistTemplates;
    if (input.customRegions !== undefined) merged.customRegions = input.customRegions;
    
    bookingFormTemplatePayload = JSON.stringify(merged);
  }

  const row = toRow({ 
    ...input, 
    bookingFormTemplate: bookingFormTemplatePayload ?? input.bookingFormTemplate, 
  } as any);
  if (input.id) {
    const data = await apiFetch<any>(`/profiles/${input.id}`, {
      method: 'PATCH',
      body: JSON.stringify(row)
    });
    return fromRow(data);
  } else {
    const data = await apiFetch<any>('/profiles', {
      method: 'POST',
      body: JSON.stringify(row)
    });
    return fromRow(data);
  }
}
