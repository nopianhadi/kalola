import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { getVendorId } from '../middleware/auth';

const router = Router();

// ─── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer — simpan di memory (tidak ke disk) ────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.'));
    }
  },
});

// ─── Helper: upload buffer ke Cloudinary ─────────────────────────────────────
function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  options: Record<string, any> = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ─── POST /upload/avatar ──────────────────────────────────────────────────────
/**
 * Upload avatar (klien, anggota tim, profil).
 * Field: `file` (multipart/form-data)
 * Query param opsional: `context` = 'client' | 'team' | 'profile'
 *
 * Return: { url, thumbnailUrl, publicId }
 */
router.post('/avatar', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan.' });

    const vendorId = getVendorId(req);
    const context = (req.query.context as string) || 'general';
    const folder = `imagenic/${vendorId}/${context}`;

    const result = await uploadToCloudinary(req.file.buffer, folder, {
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good', fetch_format: 'auto' },
      ],
    });

    // Thumbnail versi kecil (80×80)
    const thumbnailUrl = cloudinary.url(result.public_id, {
      width: 80,
      height: 80,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      fetch_format: 'auto',
    });

    res.json({
      url: result.secure_url,
      thumbnailUrl,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error('[POST /upload/avatar] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengupload gambar.', detail: error?.message });
  }
});

// ─── POST /upload/image ───────────────────────────────────────────────────────
/**
 * Upload gambar umum (cover paket, gambar project, dll).
 * Field: `file` (multipart/form-data)
 * Query param opsional: `context` = 'package' | 'project' | 'gallery' | 'general'
 *
 * Return: { url, thumbnailUrl, publicId }
 */
router.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan.' });

    const vendorId = getVendorId(req);
    const context = (req.query.context as string) || 'general';
    const folder = `imagenic/${vendorId}/${context}`;

    const result = await uploadToCloudinary(req.file.buffer, folder, {
      transformation: [
        { width: 1200, height: 900, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'auto' },
      ],
    });

    // Thumbnail versi kecil
    const thumbnailUrl = cloudinary.url(result.public_id, {
      width: 400,
      height: 300,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });

    res.json({
      url: result.secure_url,
      thumbnailUrl,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error('[POST /upload/image] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengupload gambar.', detail: error?.message });
  }
});

// ─── POST /upload/logo ────────────────────────────────────────────────────────
/**
 * Upload logo perusahaan vendor (untuk profil & dokumen).
 * Field: `file` (multipart/form-data)
 *
 * Return: { url, publicId }
 */
router.post('/logo', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan.' });

    const vendorId = getVendorId(req);
    const folder = `imagenic/${vendorId}/logo`;

    const result = await uploadToCloudinary(req.file.buffer, folder, {
      transformation: [
        { height: 200, crop: 'limit' },
        { quality: 'auto:best', fetch_format: 'auto' },
      ],
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error('[POST /upload/logo] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengupload logo.', detail: error?.message });
  }
});

// ─── POST /upload/gallery ─────────────────────────────────────────────────────
/**
 * Upload multiple gambar untuk galeri (maks 20 file sekaligus).
 * Field: `files[]` (multipart/form-data, array)
 *
 * Return: Array<{ url, thumbnailUrl, publicId }>
 */
router.post('/gallery', upload.array('files', 20), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload.' });
    }

    const vendorId = getVendorId(req);
    const folder = `imagenic/${vendorId}/gallery`;

    const results = await Promise.all(
      files.map(async (file) => {
        const result = await uploadToCloudinary(file.buffer, folder, {
          transformation: [
            { width: 1600, height: 1200, crop: 'limit' },
            { quality: 'auto:good', fetch_format: 'auto' },
          ],
        });

        const thumbnailUrl = cloudinary.url(result.public_id, {
          width: 400,
          height: 300,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto',
        });

        return {
          url: result.secure_url,
          thumbnailUrl,
          publicId: result.public_id,
        };
      })
    );

    res.json(results);
  } catch (error: any) {
    console.error('[POST /upload/gallery] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengupload gambar galeri.', detail: error?.message });
  }
});

// ─── POST /upload/portfolio ───────────────────────────────────────────────────
/**
 * Upload multiple gambar untuk portfolio (maks 20 file sekaligus).
 * Field: `files[]` (multipart/form-data, array)
 *
 * Return: Array<{ url, thumbnailUrl, publicId }>
 */
router.post('/portfolio', upload.array('files', 20), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload.' });
    }

    const vendorId = getVendorId(req);
    const folder = `imagenic/${vendorId}/portfolio`;

    const results = await Promise.all(
      files.map(async (file) => {
        const result = await uploadToCloudinary(file.buffer, folder, {
          transformation: [
            { width: 1600, height: 1200, crop: 'limit' },
            { quality: 'auto:good', fetch_format: 'auto' },
          ],
        });

        const thumbnailUrl = cloudinary.url(result.public_id, {
          width: 400,
          height: 300,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto',
        });

        return {
          url: result.secure_url,
          thumbnailUrl,
          publicId: result.public_id,
        };
      })
    );

    res.json(results);
  } catch (error: any) {
    console.error('[POST /upload/portfolio] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengupload gambar portfolio.', detail: error?.message });
  }
});

// ─── POST /upload/document ───────────────────────────────────────────────────
/**
 * Upload dokumen (gambar JPEG/PNG/WebP atau PDF) untuk brief/moodboard & file pengantin.
 * Field: `file` (multipart/form-data)
 * Query param opsional: `context` = 'moodboard' | 'bride_file' | 'general'
 *
 * Return: { url, publicId, resourceType, originalName }
 */
const uploadDocument = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // max 20 MB
  fileFilter: (req, file, cb) => {
    const context = (req.query.context as string) || 'general';
    const isMoodboard = context === 'moodboard';

    // Moodboard: gambar saja (tidak boleh PDF)
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedAll = [...allowedImages, 'application/pdf'];

    const allowed = isMoodboard ? allowedImages : allowedAll;
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(
        isMoodboard
          ? 'Moodboard hanya menerima gambar (JPG, PNG, WebP).'
          : 'Format tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.'
      ));
    }
  },
});

router.post('/document', uploadDocument.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan.' });

    const vendorId = getVendorId(req);
    const context = (req.query.context as string) || 'general';
    const folder = `imagenic/${vendorId}/${context}`;
    const isPdf = req.file.mimetype === 'application/pdf';

    if (isPdf) {
      // ── PDF: upload sebagai raw, public_id dengan .pdf eksplisit ──────────
      const baseName = (req.file.originalname || 'document')
        .replace(/\.[^/.]+$/, '')         // hapus ekstensi
        .replace(/[^a-zA-Z0-9_-]/g, '_') // sanitasi
        .substring(0, 50);
      const uniqueSuffix = Date.now().toString(36);
      // public_id TANPA ekstensi — Cloudinary raw akan simpan dengan nama ini
      const publicId = `${folder}/${baseName}_${uniqueSuffix}`;

      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: 'raw',
            // format TIDAK diset — biarkan Cloudinary simpan as-is
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });

      // Cloudinary raw URL untuk PDF: ganti /raw/upload/ dengan /raw/upload/fl_attachment/
      // agar browser trigger download, ATAU gunakan URL langsung yang sudah benar
      // secure_url dari raw sudah berupa URL yang bisa diakses langsung
      const url = result.secure_url as string;

      return res.json({
        url,
        publicId: result.public_id,
        resourceType: 'pdf',
        originalName: req.file.originalname,
      });
    }

    // ── Gambar: upload sebagai image ──────────────────────────────────────────
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' },
            { quality: 'auto:good', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file!.buffer);
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: 'image',
      originalName: req.file.originalname,
    });
  } catch (error: any) {
    console.error('[POST /upload/document] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengupload dokumen.', detail: error?.message });
  }
});

// ─── DELETE /upload/:publicId ─────────────────────────────────────────────────
/**
 * Hapus gambar dari Cloudinary berdasarkan publicId.
 * publicId dikirim sebagai encoded string di URL param.
 *
 * Keamanan: hanya bisa hapus file di folder milik vendor sendiri.
 */
router.delete('/:encodedPublicId', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const publicId = decodeURIComponent(req.params.encodedPublicId);

    // Pastikan publicId hanya milik folder vendor ini
    const expectedPrefix = `imagenic/${vendorId}/`;
    if (!publicId.startsWith(expectedPrefix)) {
      return res.status(403).json({ error: 'Akses ditolak — file bukan milik Anda.' });
    }

    await cloudinary.uploader.destroy(publicId);
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /upload/:publicId] Error:', error?.message);
    res.status(500).json({ error: 'Gagal menghapus gambar.', detail: error?.message });
  }
});

export default router;
