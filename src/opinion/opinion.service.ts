import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConfigService } from '@nestjs/config';
import { AwsService } from 'src/aws/aws.service';
import { CommonService } from 'src/common/common.service';
import { CommentService } from 'src/comment/comment.service';
import { NotificationService } from 'src/notification/notification.service';

import { Opinion, OpinionStatus } from './entities/opinion.entity';
import { User } from 'src/user/entities/user.entity';
import { NotificationType } from 'src/notification/entities/notification.entity';

import { MyOpinionsInput, MyOpinionsOutput } from './dtos/my-opinions.dto';
import {
  OpinionDetailInput,
  OpinionDetailOutput,
} from './dtos/opinion-detail.dto';
import {
  CreateOpinionInput,
  CreateOpinionOutput,
} from './dtos/create-opinion.dto';
import { EditOpinionInput, EditOpinionOutput } from './dtos/edit-opinion.dto';
import {
  DeleteOpinionInput,
  DeleteOpinionOutput,
} from './dtos/delete-opinion.dto';
import {
  UpdateOpinionStatusInput,
  UpdateOpinionStatusOutput,
} from './dtos/update-opinion-status';

import { getOpinionPath } from 'src/user/utils';

@Injectable()
export class OpinionService {
  constructor(
    @InjectRepository(Opinion)
    private readonly opinionRepository: Repository<Opinion>,
    private readonly awsService: AwsService,
    private readonly commentService: CommentService,
    private readonly notificationService: NotificationService,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  async myOpinions(
    input: MyOpinionsInput,
    user: User,
  ): Promise<MyOpinionsOutput> {
    try {
      const opinions = await this.opinionRepository.find({
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          user: {
            id: true,
          },
        },
        where: {
          user: {
            id: user.id,
          },
        },
        order: {
          createdAt: 'DESC',
        },
        relations: {
          user: true,
        },
        ...this.commonService.paginationOption(input),
      });

      const output = await this.commonService.paginationOutput(
        input,
        this.opinionRepository,
        { user: { id: user.id } },
      );

      return {
        opinions,
        ...output,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async opinionDetail(
    input: OpinionDetailInput,
    user: User,
  ): Promise<OpinionDetailOutput> {
    try {
      const opinion = await this.opinionRepository.findOne({
        select: {
          user: {
            id: true,
          },
        },
        where: {
          id: input.id,
        },
        relations: {
          user: true,
        },
      });

      if (!opinion) {
        return this.commonService.error('존재하지 않는 의견입니다.');
      }

      if (opinion.user.id !== user.id) {
        return this.commonService.error('해당 의견에 대한 권한이 없습니다.');
      }

      return {
        ok: true,
        opinion,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async createOpinion(
    { images, ...input }: CreateOpinionInput,
    user: User,
  ): Promise<CreateOpinionOutput> {
    try {
      const opinion = this.opinionRepository.create({ ...input, user });

      if (images && images.length > 0) {
        const result = await this.awsService.uploadFiles(
          images,
          getOpinionPath(opinion.id),
        );
        if (result.ok) {
          opinion.imageUrls = result.urls;
        }
      }

      await this.opinionRepository.save(opinion);

      return {
        ok: true,
        opinion,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async editOpinion(
    { id, images, imageUrls, ...input }: EditOpinionInput,
    user: User,
  ): Promise<EditOpinionOutput> {
    try {
      const opinion = await this.opinionRepository.findOne({
        select: {
          user: {
            id: true,
          },
        },
        where: {
          id,
        },
        relations: {
          user: true,
        },
      });

      if (!opinion) {
        return this.commonService.error('존재하지 않는 의견입니다.');
      }

      if (opinion.user.id !== user.id) {
        return this.commonService.error('해당 의견에 대한 권한이 없습니다.');
      }

      if (opinion.status !== OpinionStatus.WAITING) {
        return this.commonService.error('확인 중인 의견은 수정할 수 없습니다.');
      }

      let updateImageUrls = imageUrls ?? opinion.imageUrls;

      if (images && images.length > 0) {
        const result = await this.awsService.uploadFiles(
          images,
          getOpinionPath(opinion.id),
        );
        if (result.ok) {
          updateImageUrls = [...updateImageUrls, ...result.urls];
        }
      }

      await this.opinionRepository.update(id, {
        ...input,
        ...(updateImageUrls && { imageUrls: updateImageUrls }),
      });

      return {
        ok: true,
        opinion: {
          ...opinion,
          ...input,
          imageUrls: updateImageUrls,
        },
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async deleteOpinion(
    input: DeleteOpinionInput,
    user: User,
  ): Promise<DeleteOpinionOutput> {
    try {
      const opinion = await this.opinionRepository.findOne({
        select: {
          user: {
            id: true,
          },
        },
        where: {
          id: input.id,
        },
        relations: {
          user: true,
        },
      });

      if (!opinion) {
        return this.commonService.error('존재하지 않는 의견입니다.');
      }

      if (opinion.user.id !== user.id) {
        return this.commonService.error('해당 의견에 대한 권한이 없습니다.');
      }

      if (opinion.status === OpinionStatus.READ) {
        return this.commonService.error('확인중인 의견은 삭제할 수 없습니다.');
      }

      this.commentService.deleteCommentsByPostId(opinion.id);
      await this.opinionRepository.softDelete(opinion.id);

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async updateOpinionStatus({
    password,
    id,
    status,
  }: UpdateOpinionStatusInput): Promise<UpdateOpinionStatusOutput> {
    try {
      if (!password)
        return this.commonService.error(
          '의견을 수정하기 위한 비밀번호를 입력해 주세요',
        );
      if (password !== this.configService.get('PASSWORD'))
        return this.commonService.error('비밀번호가 맞지 않습니다');

      const opinion = await this.opinionRepository.findOne({
        where: {
          id,
        },
        relations: {
          user: true,
        },
      });

      if (!opinion) {
        return this.commonService.error('존재하지 않는 의견입니다.');
      }

      await this.opinionRepository.update(id, {
        status,
      });

      if (status === OpinionStatus.READ) {
        this.notificationService.createNotification(
          {
            title: '작성해주신 의견을 확인중입니다.',
            message: `${opinion.title} 의견을 확인하고 있습니다!`,
            type: NotificationType.OPINION,
            data: {
              opinionId: opinion.id + '',
            },
          },
          opinion.user,
        );
      }

      if (status === OpinionStatus.ANSWERED) {
        this.notificationService.createNotification(
          {
            title: '작성해주신 의견 답변이 작성되었습니다.',
            message: `${opinion.title} 의견에 대한 답변이 작성되었습니다!`,
            type: NotificationType.OPINION,
            data: {
              opinionId: opinion.id + '',
            },
          },
          opinion.user,
        );
      }

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }
}
