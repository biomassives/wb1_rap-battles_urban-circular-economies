/**
 * POST /api/audio/upload
 * Upload audio file for battle submissions
 *
 * Accepts multipart/form-data with:
 * - audio: File (required) - Audio file (webm, mp3, wav, m4a, ogg)
 * - battleId: string (optional) - Battle ID if submitting to existing battle
 * - rapperName: string (optional) - Rapper stage name
 * - category: string (optional) - Battle category
 *
 * Returns:
 * - audioUrl: URL to access the uploaded audio
 * - audioId: Unique identifier for the audio
 * - duration: Audio duration in seconds (if available)
 */

export const prerender = false;

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'audio/webm',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/m4a',
  'audio/mp4',
  'audio/ogg',
  'audio/x-m4a'
];

export async function POST({ request }) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type must be multipart/form-data'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const battleId = formData.get('battleId') || 'new';
    const rapperName = formData.get('rapperName') || 'Anonymous';
    const category = formData.get('category') || 'freestyle';

    // Validate audio file exists
    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Audio file is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const mimeType = audioFile.type.toLowerCase();
    if (!ALLOWED_TYPES.some(type => mimeType.includes(type.split('/')[1]))) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid file type: ${audioFile.type}. Allowed: webm, mp3, wav, m4a, ogg`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique audio ID
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const audioId = `audio_${timestamp}_${randomId}`;

    // Get file extension
    const extension = getExtensionFromMimeType(mimeType) || 'webm';
    const fileName = `${audioId}.${extension}`;

    // Convert file to base64 for storage
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // For now, we'll store a reference and return a data URL
    // In production, this would upload to IPFS, S3, or Arweave
    //
    // TODO: Implement actual file storage:
    // Option 1: Vercel Blob Storage
    // Option 2: IPFS via Pinata/Infura
    // Option 3: AWS S3
    // Option 4: Arweave for permanent storage

    // For demo/development: store metadata and return data URL
    // In production, replace this with actual cloud storage
    const audioUrl = `data:${mimeType};base64,${base64Audio}`;

    // Store audio metadata in database (if available)
    try {
      // Import database connection if available
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

      await sql`
        INSERT INTO audio_uploads (
          audio_id,
          file_name,
          mime_type,
          file_size,
          battle_id,
          rapper_name,
          category,
          created_at
        ) VALUES (
          ${audioId},
          ${fileName},
          ${mimeType},
          ${audioFile.size},
          ${battleId === 'new' ? null : battleId},
          ${rapperName},
          ${category},
          NOW()
        )
      `;
    } catch (dbError) {
      // Database not available, continue without storing metadata
      console.warn('Could not store audio metadata:', dbError.message);
    }

    // If this is a new battle, create the battle
    let newBattleId = null;
    if (battleId === 'new') {
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

        // Generate battle ID
        newBattleId = `battle_${timestamp}_${randomId}`;

        // Get user wallet from session/headers if available
        const userWallet = request.headers.get('x-wallet-address') || 'anonymous';

        await sql`
          INSERT INTO battles (
            id,
            challenger_wallet,
            category,
            status,
            rounds,
            created_at
          ) VALUES (
            ${newBattleId},
            ${userWallet},
            ${category},
            'pending',
            3,
            NOW()
          )
        `;
      } catch (battleError) {
        console.warn('Could not create new battle:', battleError.message);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Audio uploaded successfully',
      audio: {
        id: audioId,
        url: audioUrl,
        fileName,
        mimeType,
        fileSize: audioFile.size,
        fileSizeFormatted: formatFileSize(audioFile.size)
      },
      battle: {
        id: newBattleId || battleId,
        isNew: battleId === 'new',
        category,
        rapperName
      },
      // Placeholder for future cloud storage URLs
      storageInfo: {
        type: 'base64', // Will be 'ipfs', 's3', 'arweave' in production
        note: 'Using base64 data URL for development. Production will use cloud storage.'
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Audio upload error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to upload audio',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper: Get file extension from MIME type
function getExtensionFromMimeType(mimeType) {
  const extensions = {
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/x-wav': 'wav',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/ogg': 'ogg'
  };

  for (const [type, ext] of Object.entries(extensions)) {
    if (mimeType.includes(type.split('/')[1])) {
      return ext;
    }
  }

  return 'webm';
}

// Helper: Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
