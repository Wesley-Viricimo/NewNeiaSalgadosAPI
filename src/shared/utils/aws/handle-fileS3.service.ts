import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  private static s3Client: S3Client;

  constructor() {
    if(!S3Service.s3Client) {
      S3Service.s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SECRET_KEY,
        },
      });
    }
  }

  private sanitizeFileName(fileName: string): string {
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
      await S3Service.s3Client.send(command);
      const cloudFrontUrl = `${process.env.AWS_CLOUD_FRONT_URL}${fileKey}`;
      return cloudFrontUrl;
    } catch (error) {
      console.error("Erro ao enviar arquivo para o S3:", error);
      throw new Error("Erro ao salvar arquivo no armazenamento.");
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    if(fileKey.includes(process.env.AWS_CLOUD_FRONT_URL))
      fileKey = fileKey.replace(process.env.AWS_CLOUD_FRONT_URL, '');

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey
    };

    const command = new DeleteObjectCommand(params);

    try {
      await S3Service.s3Client.send(command);
    } catch (error) {
      console.error("Erro ao deletar arquivo do S3:", error);
      throw new Error("Erro ao deletar arquivo no armazenamento.");
    }
  }
}
