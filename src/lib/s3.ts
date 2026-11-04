import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import path from "path"
import { isUploadKey } from "./imageUrl"

const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true, // нужно для MinIO и большинства не-AWS провайдеров
})

const BUCKET = process.env.S3_BUCKET!

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

// Используется в server actions: берёт файл из FormData, загружает в S3.
// Если нового файла нет — возвращает существующий ключ или URL из скрытого поля.
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

// Удаляет только загруженные файлы по ключу. Внешние URL и статические файлы не удаляются.
export async function deleteImage(key: string): Promise<void> {
    if (!isUploadKey(key)) return
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

    return key
}
