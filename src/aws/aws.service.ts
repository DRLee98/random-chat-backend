import * as AWS from 'aws-sdk';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadFileOutput } from './dto/upload-file.dto';
import { CommonService } from 'src/common/common.service';
import { FileUpload } from 'graphql-upload/processRequest.js';
import { streamToBuffer } from './utils';

@Injectable()
export class AwsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
  ) {
    AWS.config.update({
      accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY'),
      secretAccessKey: this.configService.get('AWS_S3_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_S3_REGION'),
    });
  }

  async uploadFile(
    promiseFile: FileUpload,
    folder: string,
  ): Promise<UploadFileOutput> {
    try {
      const file = await promiseFile;
      const stream = file.createReadStream();
      const buffer = await streamToBuffer(stream);
      const objectName = `${folder}/${file.filename}`;

      await new AWS.S3()
        .putObject({
          Body: buffer,
          Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
          Key: objectName,
          ACL: 'public-read',
        })
        .promise();

      const encodeName = encodeURIComponent(objectName);
      const url = `https://${this.configService.get('AWS_S3_BUCKET_NAME')}.s3.amazonaws.com/${encodeName}`;

      return {
        ok: true,
        url,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }
}
