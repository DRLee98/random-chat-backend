import { Injectable } from '@nestjs/common';

import { PushMessageInput } from './dtos/push-message.dto';

import admin from 'firebase-admin';
import * as firebaseConfig from './firebase.config.json';

import type { ServiceAccount } from 'firebase-admin';

@Injectable()
export class FcmService {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig as ServiceAccount),
    });
  }

  async pushMessage({
    token,
    title,
    message,
    imageUrl,
    data,
  }: PushMessageInput) {
    try {
      await admin.messaging().send({
        token,
        notification: {
          title: title,
          body: message,
          imageUrl,
        },
        data,
      });
      return true;
    } catch (error) {
      console.error('====== fcm pushMessage error:', error);
      return false;
    }
  }
}
