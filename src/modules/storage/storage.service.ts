import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ApiConfiguration } from '@matterchat/config';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  private s3Client!: S3Client;

  private readonly avatarBucketName = 'matterchat-avatars';

  onModuleInit() {
    this.s3Client = new S3Client({
      endpoint: ApiConfiguration.s3.endpoint,
      credentials: {
        accessKeyId: ApiConfiguration.s3.accessKeyId,
        secretAccessKey: ApiConfiguration.s3.secretAccessKey,
      },
      region: 'us-east-1',
      forcePathStyle: true,
    });

    this.ensureAvatarBucketExists().catch((err) => {
      this.logger.error('Failed to initialize S3 avatars bucket', err);
    });
  }

  private async ensureAvatarBucketExists() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.avatarBucketName }),
      );

      this.logger.log(`S3 bucket "${this.avatarBucketName}" already exists.`);
    } catch (error: any) {
      // Create the bucket if it doesn't exist
      if (
        error.name === 'NotFound' ||
        error['$metadata']?.httpStatusCode === 404
      ) {
        this.logger.log(
          `S3 bucket "${this.avatarBucketName}" not found. Creating bucket...`,
        );

        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.avatarBucketName }),
        );
        this.logger.log(
          `S3 bucket "${this.avatarBucketName}" created successfully.`,
        );

        // Set public read policy
        const policy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicRead',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.avatarBucketName}/*`],
            },
          ],
        });

        await this.s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: this.avatarBucketName,
            Policy: policy,
          }),
        );
        this.logger.log(
          `Set public read policy on S3 bucket "${this.avatarBucketName}".`,
        );
      } else throw error;
    }
  }

  async uploadAvatar(buffer: Buffer, mimetype: string, key: string): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.avatarBucketName,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    );

    return `${ApiConfiguration.s3.publicUrl}/${this.avatarBucketName}/${key}`;
  }
}
