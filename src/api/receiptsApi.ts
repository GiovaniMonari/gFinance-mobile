import { getAccessToken } from './authApi'

/**
 * Receipt scanner client — frontend only.
 *
 * Talks to the existing FastAPI receipt service:
 *   POST {RECEIPT_SERVICE_URL}/receipts/scan
 * with a multipart `file` field and `Authorization: Bearer <token>`.
 *
 * The backend (app/api/receipts.py) validates type/size, stores the upload
 * under `uploads/` and forwards `{ imageUrl }` to the Nest
 * `POST /receipts/internal`, which creates a `Receipt` row with status
 * `PROCESSING`. The scan response below is that acknowledgement — it does
 * NOT yet contain OCR/extracted merchant, total, date or items.
 */

export const RECEIPT_SERVICE_URL = 'http://192.168.15.8:8002'

export const RECEIPT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type ReceiptAllowedMimeType =
  (typeof RECEIPT_ALLOWED_MIME_TYPES)[number]

export const RECEIPT_MAX_FILE_SIZE = 10 * 1024 * 1024

export type ReceiptStatus =
  | 'PROCESSING'
  | 'PROCESSED'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'FAILED'
  | string

/**
 * OCR output the scanner backend attaches to the scan response.
 *
 * Today only `rawText` (and `currency`) arrive filled — `merchant`, `total`,
 * `date` and `items` come back `null`/empty because structured parsing is not
 * implemented server-side yet. The frontend shows what exists and says what
 * does not, instead of parsing the text itself.
 */
export type ReceiptExtractedData = {
  rawText: string | null
  confidence: number | null
  merchant: string | null
  total: number | null
  date: string | null
  currency: string | null
  items: unknown[]
}

export type ScanReceiptResult = {
  message: string
  receiptId: string
  status: ReceiptStatus
  filename: string
  originalName: string | null
  mimeType: string
  size: number
  extractedData: ReceiptExtractedData | null
}

export type ReceiptImage = {
  uri: string
  mimeType?: string | null
  fileName?: string | null
  fileSize?: number | null
}

function extensionToMime(ext: string): string | null {
  const normalized = ext.toLowerCase()

  if (normalized === '.jpg' || normalized === '.jpeg') return 'image/jpeg'
  if (normalized === '.png') return 'image/png'
  if (normalized === '.webp') return 'image/webp'

  return null
}

function mimeToExtension(mime: string): string {
  if (mime === 'image/png') return '.png'
  if (mime === 'image/webp') return '.webp'

  return '.jpg'
}

function fileNameFromUri(uri: string): string {
  const segment = uri.split('/').pop()?.split('?')[0] ?? ''

  return segment || 'receipt.jpg'
}

export function resolveReceiptFile(image: ReceiptImage): {
  name: string
  type: string
} {
  const fromUri = fileNameFromUri(image.uri)
  const name = image.fileName ?? fromUri

  const extMatch = name.match(/\.[a-zA-Z0-9]+$/)
  const ext = extMatch ? extMatch[0] : ''

  const mimeFromExt = ext ? extensionToMime(ext) : null
  const type = image.mimeType ?? mimeFromExt ?? 'image/jpeg'

  const finalName = ext ? name : `${name}${mimeToExtension(type)}`

  return { name: finalName, type }
}

export function validateReceiptImage(image: ReceiptImage): string | null {
  const { type } = resolveReceiptFile(image)

  if (
    !(RECEIPT_ALLOWED_MIME_TYPES as readonly string[]).includes(type)
  ) {
    return 'Formato não suportado. Use uma foto em JPG, PNG ou WEBP.'
  }

  if (
    typeof image.fileSize === 'number' &&
    image.fileSize > RECEIPT_MAX_FILE_SIZE
  ) {
    return 'Arquivo muito grande. O limite é de 10MB.'
  }

  return null
}

export function formatReceiptSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'

  if (bytes < 1024) return `${bytes} B`

  const kb = bytes / 1024

  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`

  return `${(kb / 1024).toFixed(2)} MB`
}

export function translateReceiptStatus(status: string): string {
  switch (status) {
    case 'PROCESSING':
      return 'Processando'
    case 'PROCESSED':
      return 'Processado'
    case 'PENDING_CONFIRMATION':
      return 'Aguardando confirmação'
    case 'CONFIRMED':
      return 'Confirmado'
    case 'FAILED':
      return 'Falha no processamento'
    default:
      return status
  }
}

function isScanReceiptResult(data: unknown): data is ScanReceiptResult {
  if (typeof data !== 'object' || data === null) return false

  const candidate = data as Record<string, unknown>

  return (
    typeof candidate['receiptId'] === 'string' &&
    typeof candidate['status'] === 'string'
  )
}

/**
 * Upload a receipt image to the existing backend endpoint.
 *
 * Accepts either a bare uri (backwards compatible) or a {@link ReceiptImage}
 * carrying the mime/size metadata reported by expo-image-picker, so invalid
 * files can be rejected before the upload.
 */
export async function scanReceipt(
  image: string | ReceiptImage,
): Promise<ScanReceiptResult> {
  const normalized: ReceiptImage =
    typeof image === 'string' ? { uri: image } : image

  if (!normalized.uri) {
    throw new Error('Selecione uma imagem do recibo antes de enviar.')
  }

  const validationError = validateReceiptImage(normalized)

  if (validationError) {
    throw new Error(validationError)
  }

  const accessToken = await getAccessToken()

  if (!accessToken) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const { name, type } = resolveReceiptFile(normalized)

  const formData = new FormData()

  formData.append('file', {
    uri: normalized.uri,
    name,
    type,
  } as any)

  let response: Response

  try {
    response = await fetch(`${RECEIPT_SERVICE_URL}/receipts/scan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    })
  } catch {
    throw new Error(
      'Não foi possível alcançar o serviço de recibos. Verifique sua conexão e se o serviço está no ar.',
    )
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      (data as { detail?: unknown; message?: unknown } | null)?.detail as string ||
        (data as { message?: unknown } | null)?.message as string ||
        'Não foi possível processar o recibo.',
    )
  }

  if (!isScanReceiptResult(data)) {
    throw new Error('Resposta inesperada do serviço de recibos.')
  }

  const raw = data as unknown as Record<string, unknown>
  const rawExtracted = raw['extractedData'] as Record<string, unknown> | null | undefined

  const extractedData =
    rawExtracted && typeof rawExtracted === 'object'
      ? {
          rawText:
            typeof rawExtracted['rawText'] === 'string'
              ? (rawExtracted['rawText'] as string)
              : null,
          confidence:
            typeof rawExtracted['confidence'] === 'number'
              ? (rawExtracted['confidence'] as number)
              : null,
          merchant:
            typeof rawExtracted['merchant'] === 'string'
              ? (rawExtracted['merchant'] as string)
              : null,
          total:
            typeof rawExtracted['total'] === 'number'
              ? (rawExtracted['total'] as number)
              : null,
          date:
            typeof rawExtracted['date'] === 'string'
              ? (rawExtracted['date'] as string)
              : null,
          currency:
            typeof rawExtracted['currency'] === 'string'
              ? (rawExtracted['currency'] as string)
              : null,
          items: Array.isArray(rawExtracted['items'])
            ? (rawExtracted['items'] as unknown[])
            : [],
        }
      : null

  return {
    message:
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : 'Recibo recebido com sucesso.',
    receiptId: data.receiptId,
    status: data.status,
    filename:
      typeof (data as { filename?: unknown }).filename === 'string'
        ? (data as unknown as ScanReceiptResult).filename
        : name,
    originalName:
      typeof (data as { originalName?: unknown }).originalName === 'string'
        ? (data as unknown as ScanReceiptResult).originalName
        : name,
    mimeType:
      typeof (data as { mimeType?: unknown }).mimeType === 'string'
        ? (data as unknown as ScanReceiptResult).mimeType
        : type,
    size:
      typeof (data as { size?: unknown }).size === 'number'
        ? (data as unknown as ScanReceiptResult).size
        : (normalized.fileSize ?? 0),
    extractedData,
  }
}
