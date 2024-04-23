import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AwsService } from 'src/aws/aws.service';
import { CommonService } from 'src/common/common.service';
import { CommentService } from 'src/comment/comment.service';

import { Opinion, OpinionStatus } from './entities/opinion.entity';
import { User } from 'src/user/entities/user.entity';

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

import { getOpinionPath } from 'src/user/utils';

@Injectable()
export class OpinionService {
  constructor(
    @InjectRepository(Opinion)
    private readonly opinionRepository: Repository<Opinion>,
    private readonly awsService: AwsService,
    private readonly commentService: CommentService,
    private readonly commonService: CommonService,
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
        },
        where: {
          user: {
            id: user.id,
          },
        },
        order: {
          createdAt: 'DESC',
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
        where: {
          id: input.id,
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
}
