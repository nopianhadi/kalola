import type { ChatTemplate } from '@/types';

/**
 * Process template dengan variable replacement
 */
export function processTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let processed = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    processed = processed.replace(regex, value);
  });
  
  return processed;
}

/**
 * Validate template
 */
export function validateTemplate(template: ChatTemplate): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!template.title || template.title.trim() === '') {
    errors.push('Title tidak boleh kosong');
  }

  if (!template.template || template.template.trim() === '') {
    errors.push('Template tidak boleh kosong');
  }

  if (template.template && template.template.length > 4096) {
    errors.push('Template terlalu panjang (max 4096 karakter)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
