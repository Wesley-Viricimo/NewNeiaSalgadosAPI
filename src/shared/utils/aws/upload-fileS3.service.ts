import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
    });
  }

  private sanitizeFileName(fileName: string): string {
    // Substituir espaços e caracteres especiais por hífens e manter a extensão
    const baseName = fileName
      .replace(/\s+/g, '-')                         // Substituir espaços por hífens
      .replace(/[^a-zA-Z0-9\-_.]/g, '');            // Remover caracteres especiais
    return `${baseName}`;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const sanitizedFileName = this.sanitizeFileName(file.originalname);
    const fileKey = `${Date.now()}-${sanitizedFileName}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);

    try {
      await this.s3Client.send(command);
      const cloudFrontUrl = `${process.env.AWS_CLOUD_FRONT_URL}${fileKey}`;
      return cloudFrontUrl;
    } catch (error) {
      console.error("Erro ao enviar arquivo para o S3:", error);
      throw new Error("Erro ao salvar arquivo no armazenamento.");
    }
  }
}
