import { getDayStr } from '../utils';

describe('Message Utils 테스트', () => {
  it('getDayStr 테스트', async () => {
    expect(getDayStr(0)).toEqual('일요일');
    expect(getDayStr(1)).toEqual('월요일');
    expect(getDayStr(2)).toEqual('화요일');
    expect(getDayStr(3)).toEqual('수요일');
    expect(getDayStr(4)).toEqual('목요일');
    expect(getDayStr(5)).toEqual('금요일');
    expect(getDayStr(6)).toEqual('토요일');
    expect(getDayStr(7)).toEqual(undefined);
  });
});
