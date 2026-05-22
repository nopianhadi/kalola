import { apiFetch } from '@/lib/apiClient';
import { Package, PhysicalItem, DurationOption } from '@/types';

function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== 'string') return (val as T) || fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function normalize(row: Record<string, unknown>): Package {
  const rawDurationOptions = row.duration_options || row.duration_prices;
  const parsedDurationOptions = safeParse<DurationOption[] | Record<string, unknown>>(rawDurationOptions, []);
  let durationOptions: DurationOption[] | undefined = undefined;
  if (parsedDurationOptions) {
    if (Array.isArray(parsedDurationOptions)) {
      durationOptions = parsedDurationOptions as DurationOption[];
    } else if (typeof parsedDurationOptions === 'object' && parsedDurationOptions !== null) {
      const opts: DurationOption[] = [];
      const parsedDurationOptionsObj = parsedDurationOptions as Record<string, unknown>;
      if (typeof parsedDurationOptionsObj.eightHours === 'number') opts.push({ label: '8 Jam', price: parsedDurationOptionsObj.eightHours, default: true });
      if (typeof parsedDurationOptionsObj.fullDay === 'number') opts.push({ label: 'Full Day', price: parsedDurationOptionsObj.fullDay, default: opts.length === 0 });
      durationOptions = opts.length > 0 ? opts : undefined;
    }
  }

  return {
    id: Number(row.id || 0),
    name: String(row.name || ''),
    price: Number(row.price || 0),
    category: typeof row.category === 'string' ? row.category : '',
    region: typeof row.region === 'string' ? row.region : undefined,
    physicalItems: safeParse<PhysicalItem[]>(row.physical_items, []),
    digitalItems: safeParse<string[]>(row.digital_items, []),
    processingTime: typeof row.processing_time === 'string' ? row.processing_time : '',
    defaultPrintingCost: typeof row.default_printing_cost === 'number' ? row.default_printing_cost : undefined,
    defaultTransportCost: typeof row.default_transport_cost === 'number' ? row.default_transport_cost : undefined,
    photographers: typeof row.photographers === 'string' ? row.photographers : undefined,
    videographers: typeof row.videographers === 'string' ? row.videographers : undefined,
    coverImage: typeof row.cover_image === 'string' ? row.cover_image : undefined,
    // Store flexible options in the same duration_prices column for backward compatibility
    durationOptions,
  };
}

function denormalize(obj: Partial<Package>): Record<string, unknown> {
  const result: any = {
    ...(obj.name !== undefined ? { name: obj.name } : {}),
    ...(obj.price !== undefined ? { price: obj.price } : {}),
    ...(obj.category !== undefined ? { category: obj.category } : {}),
    ...(obj.region !== undefined ? { region: obj.region } : {}),
    ...(obj.physicalItems !== undefined ? { physical_items: JSON.stringify(obj.physicalItems) } : {}),
    ...(obj.digitalItems !== undefined ? { digital_items: JSON.stringify(obj.digitalItems) } : {}),
    ...(obj.processingTime !== undefined ? { processing_time: obj.processingTime } : {}),
    ...(obj.defaultPrintingCost !== undefined ? { default_printing_cost: obj.defaultPrintingCost } : {}),
    ...(obj.defaultTransportCost !== undefined ? { default_transport_cost: obj.defaultTransportCost } : {}),
    ...(obj.photographers !== undefined ? { photographers: obj.photographers } : {}),
    ...(obj.videographers !== undefined ? { videographers: obj.videographers } : {}),
    ...(obj.coverImage !== undefined ? { cover_image: obj.coverImage } : {}),
    ...(obj.durationOptions !== undefined ? { duration_options: JSON.stringify(obj.durationOptions) } : {}),
  };
  return result;
}

export async function listPackages(): Promise<Package[]> {
  const data = await apiFetch<any[]>('/packages');
  return data.map(row => normalize(row));
}

export async function createPackage(payload: Omit<Package, 'id' | 'createdAt'>): Promise<Package> {
  const data = await apiFetch<any>('/packages', {
    method: 'POST',
    body: JSON.stringify(denormalize(payload))
  });
  return normalize(data);
}

export async function updatePackage(id: number, patch: Partial<Package>): Promise<Package> {
  const payload = denormalize(patch);
  delete payload.id;
  const data = await apiFetch<any>(`/packages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return normalize(data);
}

export async function deletePackage(id: number): Promise<void> {
  await apiFetch(`/packages/${id}`, { method: 'DELETE' });
}
