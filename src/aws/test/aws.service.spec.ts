import { Test } from '@nestjs/testing';
import { AwsService } from '../aws.service';
import { ConfigService } from '@nestjs/config';
import { CommonService } from 'src/common/common.service';
import * as utils from '../utils';
import * as AWS from 'aws-sdk';
import { mockImage } from 'test/mockData';

const testRegion = 'region';
const testAccessKey = 'accessKey';
const testSecretAccessKey = 'secretAccessKey';
const testBucketName = 'bucketName';

const mockConfigService = () => ({
  get: jest.fn((key: string) => {
    switch (key) {
      case 'AWS_S3_REGION':
        return testRegion;
      case 'AWS_S3_ACCESS_KEY':
        return testAccessKey;
      case 'AWS_S3_SECRET_ACCESS_KEY':
        return testSecretAccessKey;
      case 'AWS_S3_BUCKET_NAME':
        return testBucketName;
      default:
        return '';
    }
  }),
});

describe('AwsService 테스트', () => {
  let awsService: AwsService;
  let awsConfigSpyFn: jest.SpyInstance;
  let awsS3SpyFn: jest.SpyInstance;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AwsService,
        {
          provide: ConfigService,
          useValue: mockConfigService(),
        },
        CommonService,
      ],
    }).compile();

    awsService = module.get<AwsService>(AwsService);
    awsConfigSpyFn = jest.spyOn(AWS.config, 'update');
    awsS3SpyFn = jest.spyOn(AWS, 'S3');
  });

  it('서비스 health check ', () => {
    expect(awsService).toBeDefined();
    expect(awsConfigSpyFn).toBeDefined();
    expect(awsS3SpyFn).toBeDefined();
  });

  it('Aws config 설정 테스트', () => {
    expect(awsConfigSpyFn).toHaveBeenCalledTimes(1);
    expect(awsConfigSpyFn).toHaveBeenCalledWith({
      accessKeyId: testAccessKey,
      secretAccessKey: testSecretAccessKey,
      region: testRegion,
    });
  });

  it('파일 업로드 테스트', async () => {
    const filename = (await mockImage).filename;
    const folder = 'test-folder';
    const objectName = `${folder}/${filename}`;
    const buffer = Buffer.from('test');

    jest.spyOn(utils, 'streamToBuffer').mockResolvedValue(buffer);
    awsS3SpyFn.mockReturnValue({
      putObject: jest.fn(() => ({
        promise: jest.fn(),
      })),
    });

    const result = await awsService.uploadFile(mockImage, folder);

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.url).not.toEqual(
      `https://${testBucketName}.s3.amazonaws.com/${objectName}`,
    );
    expect(result.url).toEqual(
      `https://${testBucketName}.s3.amazonaws.com/${encodeURIComponent(`${objectName}`)}`,
    );

    expect(awsS3SpyFn.mock.results[0].value.putObject).toHaveBeenCalledTimes(1);
    expect(awsS3SpyFn.mock.results[0].value.putObject).toHaveBeenCalledWith({
      Body: buffer,
      Bucket: testBucketName,
      Key: objectName,
      ACL: 'public-read',
    });
  });
});
