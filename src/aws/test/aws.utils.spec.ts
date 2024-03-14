import { Readable } from 'typeorm/platform/PlatformTools';
import { streamToBuffer } from '../utils';

describe('AwsUtils 테스트', () => {
  it('streamToBuffer 테스트', async () => {
    const stream = new Readable();
    stream.push('test');
    stream.push(null);

    const result = await streamToBuffer(stream);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe('test');
  });
});
