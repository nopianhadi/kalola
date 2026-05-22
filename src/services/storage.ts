// Helper for local file handling (converting to base64 for storage in MySQL TEXT/LongText)

export async function uploadDpProof(file: File): Promise<string> {
  return await fileToBase64(file);
}

export async function uploadGalleryImage(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  // Final size check
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File size must be less than 10MB');
  }

  return await fileToBase64(file);
}

export async function deleteGalleryImage(_imageUrl: string): Promise<void> {
  // Since we use base64 strings stored in the DB, there's no external file to delete here.
  // The record deletion in the gallery service handles this.
  return Promise.resolve();
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};
