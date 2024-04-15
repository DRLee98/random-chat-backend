import { Test } from '@nestjs/testing';
import { FcmService } from '../fcm.service';

import admin from 'firebase-admin';
import * as firebaseConfig from '../firebase.config.json';

import type { ServiceAccount } from 'firebase-admin';

jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    messaging: jest.fn(() => ({
      send: jest.fn(),
    })),
  },
}));

describe('FcmService 테스트', () => {
  let fcmService: FcmService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [FcmService],
    }).compile();

    fcmService = module.get<FcmService>(FcmService);
  });

  it('서비스 health check ', () => {
    expect(fcmService).toBeDefined();
  });

  it('Fcm config 설정 테스트', () => {
    expect(admin.initializeApp).toHaveBeenCalledTimes(1);
    expect(admin.initializeApp).toHaveBeenCalledWith({
      credential: admin.credential.cert(firebaseConfig as ServiceAccount),
    });
  });

  it('pushMessage 테스트', async () => {
    const result = await fcmService.pushMessage({
      token: 'test token',
      title: 'test title',
      message: 'test message',
    });

    expect(admin.messaging).toHaveBeenCalledTimes(1);
    // expect(admin.messaging).toHaveBeenCalledWith({
    //   token: 'test token',
    //   notification: {
    //     title: 'test title',
    //     body: 'test message',
    //   },
    //   data: {
    //     body: 'test message',
    //   },
    // });

    expect(result).toEqual(true);
  });
});
