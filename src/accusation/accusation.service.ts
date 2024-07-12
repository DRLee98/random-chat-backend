import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';

import { CommonService } from 'src/common/common.service';
import { AwsService } from 'src/aws/aws.service';
import { UserService } from 'src/user/user.service';
import { NotificationService } from 'src/notification/notification.service';
import { ConfigService } from '@nestjs/config';

import { AccusationInfo } from './entities/accusation-info.entity';
import { Accusation, AccusationStatus } from './entities/accusation.entity';
import { User } from 'src/user/entities/user.entity';
import { NotificationType } from 'src/notification/entities/notification.entity';

import { MyAccusationInfoOutput } from './dtos/my-accusation-info.dto';
import {
  ViewAccusationsInput,
  ViewAccusationsOutput,
} from './dtos/view-accusations.dto';
import {
  ViewAccusationInput,
  ViewAccusationOutput,
} from './dtos/view-accusation.dto';
import {
  CreateAccusationInput,
  CreateAccusationOutput,
} from './dtos/create-accusation.dto';
import {
  UpdateAccusationStatusInput,
  UpdateAccusationStatusOutput,
} from './dtos/update-accusation-status.dto';

import { getAccusationPath } from 'src/user/utils';
import { LIMIT_COUNT } from './accusation.constants';

@Injectable()
export class AccusationService {
  constructor(
    @InjectRepository(AccusationInfo)
    private readonly accusationInfoRepository: Repository<AccusationInfo>,
    @InjectRepository(Accusation)
    private readonly accusationRepository: Repository<Accusation>,
    private readonly commonService: CommonService,
    private readonly awsService: AwsService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  async myAccusationInfo(user: User): Promise<MyAccusationInfoOutput> {
    try {
      const info = await this.accusationInfoRepository.findOne({
        where: {
          user: {
            id: user.id,
          },
        },
        relations: {
          user: true,
        },
      });

      if (info.showAlert) {
        this.accusationInfoRepository.update(info.id, {
          showAlert: false,
        });

        return {
          ok: true,
          message: `앞으로 ${LIMIT_COUNT - info.count}회 더 신고가 접수되면 계정이 한달간 정지됩니다.`,
        };
      }

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async viewAccusations(
    input: ViewAccusationsInput,
  ): Promise<ViewAccusationsOutput> {
    try {
      if (!input.password)
        return this.commonService.error(
          '신고을 처리하기 위한 비밀번호를 입력해 주세요',
        );
      if (input.password !== this.configService.get('PASSWORD'))
        return this.commonService.error('비밀번호가 맞지 않습니다');

      const accusations = await this.accusationRepository.find({
        relations: {
          info: {
            user: true,
          },
        },
        where: {
          status: AccusationStatus.WAIT,
        },
        order: {
          createdAt: 'DESC',
        },
        ...this.commonService.paginationOption(input),
      });

      const output = await this.commonService.paginationOutput(
        input,
        this.accusationRepository,
        {
          status: AccusationStatus.WAIT,
        },
      );
      return {
        accusations,
        ...output,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async viewAccusation(
    input: ViewAccusationInput,
  ): Promise<ViewAccusationOutput> {
    try {
      if (!input.password)
        return this.commonService.error(
          '신고을 처리하기 위한 비밀번호를 입력해 주세요',
        );
      if (input.password !== this.configService.get('PASSWORD'))
        return this.commonService.error('비밀번호가 맞지 않습니다');

      const accusation = await this.accusationRepository.findOne({
        relations: {
          info: {
            user: true,
          },
        },
        where: {
          id: input.id,
        },
      });

      return {
        ok: true,
        accusation,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async createAccusation(
    input: CreateAccusationInput,
    user: User,
  ): Promise<CreateAccusationOutput> {
    try {
      const existAccusation = await this.accusationRepository.findOne({
        where: {
          authorId: user.id,
          info: {
            user: {
              id: input.targetUserId,
            },
          },
          createdAt: MoreThan(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)),
        },
        relations: {
          info: true,
        },
      });

      if (existAccusation)
        return this.commonService.error('이미 신고한 유저입니다.');

      let accusationInfo = await this.accusationInfoRepository.findOne({
        where: {
          user: {
            id: input.targetUserId,
          },
        },
        relations: {
          user: true,
        },
      });
      if (!accusationInfo)
        accusationInfo = await this.accusationInfoRepository.save({
          user: {
            id: input.targetUserId,
          },
        });

      const accusation = this.accusationRepository.create({
        content: input.content,
        info: accusationInfo,
        authorId: user.id,
      });

      if (input.images && input.images.length > 0) {
        const result = await this.awsService.uploadFiles(
          input.images,
          getAccusationPath(accusation.id),
        );
        if (result.ok) {
          accusation.imageUrls = result.urls;
        }
      }

      await this.accusationRepository.save(accusation);

      this.notificationService.createNotification(
        {
          title: `신고가 접수되었습니다.`,
          message: `신고 내용을 검토 후 처리하겠습니다.`,
          type: NotificationType.ACCUSATION,
        },
        user,
      );

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async updateAccusationStatus(
    input: UpdateAccusationStatusInput,
  ): Promise<UpdateAccusationStatusOutput> {
    try {
      if (!input.password)
        return this.commonService.error(
          '신고을 처리하기 위한 비밀번호를 입력해 주세요',
        );
      if (input.password !== this.configService.get('PASSWORD'))
        return this.commonService.error('비밀번호가 맞지 않습니다');

      const accusation = await this.accusationRepository.findOne({
        where: {
          id: input.id,
        },
        relations: {
          info: {
            user: true,
          },
        },
      });

      if (!accusation)
        return this.commonService.error('존재하지 않는 신고입니다.');

      if (accusation.status !== AccusationStatus.WAIT)
        return this.commonService.error('이미 처리된 신고입니다.');

      if (input.status === AccusationStatus.WAIT)
        return this.commonService.error(
          '수락 또는 거절 상태로만 변경할 수 있습니다.',
        );

      await this.accusationRepository.update(accusation.id, {
        status: input.status,
        answer: input.answer,
      });

      if (input.status === AccusationStatus.ACCEPT) {
        if (accusation.info.count + 1 >= LIMIT_COUNT) {
          await this.accusationInfoRepository.update(accusation.info.id, {
            count: 0,
            showAlert: false,
          });
          this.notificationService.createNotification(
            {
              title: `신고가 접수되었습니다.`,
              message: `신고횟수가 ${LIMIT_COUNT}회 누적되어 한달간 계정이 정지됩니다.`,
              type: NotificationType.ACCUSATION,
            },
            accusation.info.user,
          );
          const suspendDate = new Date();
          suspendDate.setTime(0);
          suspendDate.setMinutes(0);
          suspendDate.setSeconds(0);
          suspendDate.setMinutes(suspendDate.getMonth() + 1);
          await this.userService.suspendUserUntilDate(
            accusation.info.user.id,
            suspendDate,
          );
        } else {
          await this.accusationInfoRepository.update(accusation.info.id, {
            count: accusation.info.count + 1,
            showAlert: true,
          });
          this.notificationService.createNotification(
            {
              title: `신고가 접수되었습니다.`,
              message: `앞으로 신고가 더 접수될 경우 서비스 이용에 제한이 있을 수 있습니다.`,
              type: NotificationType.ACCUSATION,
            },
            accusation.info.user,
          );
        }
      }

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }
}
