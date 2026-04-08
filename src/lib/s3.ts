import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import path from "path"
import { env } from "@/lib/env"

const client = new S3Client({
    endpoint: env.s3.endpoint,
    region: env.s3.region,
    credentials: {
        accessKeyId: env.s3.accessKeyId,
        secretAccessKey: env.s3.secretAccessKey,
    },
    forcePathStyle: true, // нужно для MinIO и большинства не-AWS провайдеров
})

const BUCKET = env.s3.bucket
const PUBLIC_URL = env.s3.publicUrl

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

// Используется в server actions: берёт файл из FormData, загружает в S3.
// Если нового файла нет — возвращает существующий URL из скрытого поля.
export async function resolveImageUpload(
    formData: FormData,
    fileField: string,
    urlField: string,
): Promise<string | null> {
    const file = formData.get(fileField)
    if (file instanceof File && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer())
        return uploadImage(buffer, file.name, file.type)
    }
    return (formData.get(urlField) as string) || null
}

// Удаляет файл из S3 по его публичному URL. Ошибки игнорируются — файл мог быть удалён ранее.
export async function deleteImage(url: string): Promise<void> {
    const prefix = `${PUBLIC_URL}/`
    if (!url.startsWith(prefix)) return
    const key = url.slice(prefix.length)
    try {
        await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    } catch {
        // не критично
    }
}

export async function uploadImage(
    buffer: Buffer,
    originalName: string,
    contentType: string,
): Promise<string> {
    if (!ALLOWED_TYPES.includes(contentType)) {
        throw new Error("Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF")
    }

    if (buffer.byteLength > MAX_SIZE_BYTES) {
        throw new Error("Файл слишком большой. Максимум 10 МБ")
    }

    const ext = path.extname(originalName).toLowerCase() || ".jpg"
    const key = `uploads/${randomUUID()}${ext}`

    await client.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }),
    )

    return `${PUBLIC_URL}/${key}`
}
