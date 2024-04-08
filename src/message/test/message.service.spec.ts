import { Test } from '@nestjs/testing';
import { MessageService } from '../message.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository, MockService, mockRepository } from 'test/utils';
import { CommonService } from 'src/common/common.service';
import { RoomService } from 'src/room/room.service';
import { PubSub } from 'graphql-subscriptions';
import { Message, MessageType } from '../entites/message.entity';
import { PUB_SUB } from 'src/common/common.constants';
import { NEW_MESSAGE, READ_MESSAGE } from '../message.constants';
import { SendMessageInput } from '../dtos/send-message.dto';
import { ViewMessagesInput } from '../dtos/view-messages.dto';
import { mockUser } from 'test/mockData';

const roomId = 'test room';

const mockRoomService = () => ({
  checkValidRoom: jest.fn(),
  resetNewMessageInUserRoom: jest.fn(),
  updateNewMesssageInUserRoom: jest.fn(),
  updateRoomUpdateAt: jest.fn(),
});

const mockPubSub = () => ({
  publish: jest.fn(),
});

describe('MessageService 테스트', () => {
  let messageService: MessageService;
  let messageRepository: MockRepository<Message>;
  let roomService: MockService<RoomService>;
  let pubSub: MockService<PubSub>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockRepository(),
        },
        CommonService,
        {
          provide: RoomService,
          useValue: mockRoomService(),
        },
        { provide: PUB_SUB, useValue: mockPubSub() },
      ],
    }).compile();

    messageService = module.get(MessageService);
    messageRepository = module.get(getRepositoryToken(Message));
    roomService = module.get(RoomService);
    pubSub = module.get(PUB_SUB);
  });

  it('서비스 health check ', () => {
    expect(messageService).toBeDefined();
    expect(messageRepository).toBeDefined();
    expect(roomService).toBeDefined();
    expect(pubSub).toBeDefined();
  });

  describe('메시지 조회 테스트', () => {
    const input: ViewMessagesInput = {
      roomId,
      take: 20,
      skip: 0,
    };

    it('참여중인 방이 아닌 경우', async () => {
      roomService.checkValidRoom.mockResolvedValue(false);

      const result = await messageService.viewMessages(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
      expect(result.messages).toEqual(undefined);

      expect(roomService.checkValidRoom).toHaveBeenCalledTimes(1);
      expect(roomService.checkValidRoom).toHaveBeenCalledWith(
        input.roomId,
        mockUser.id,
      );

      expect(messageRepository.find).toHaveBeenCalledTimes(0);
      expect(roomService.resetNewMessageInUserRoom).toHaveBeenCalledTimes(0);
    });

    it('메시지 조회', async () => {
      const messages = [
        { id: '1', contents: 'test', readUsersId: [] },
        { id: '2', contents: 'test2', readUsersId: [] },
        { id: '3', contents: 'test3', readUsersId: [] },
      ];

      roomService.checkValidRoom.mockResolvedValue(true);
      messageRepository.find.mockReturnValue(messages);

      const result = await messageService.viewMessages(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.messages).toEqual(messages.reverse());

      expect(roomService.checkValidRoom).toHaveBeenCalledTimes(1);
      expect(roomService.checkValidRoom).toHaveBeenCalledWith(
        input.roomId,
        mockUser.id,
      );

      expect(messageRepository.find).toHaveBeenCalledTimes(2);

      expect(roomService.resetNewMessageInUserRoom).toHaveBeenCalledTimes(1);
      expect(roomService.resetNewMessageInUserRoom).toHaveBeenCalledWith(
        input.roomId,
        mockUser.id,
      );
    });
  });

  describe('메시지 전송 테스트', () => {
    const input: SendMessageInput = {
      roomId,
      contents: 'test message',
      type: MessageType.TEXT,
    };

    it('참여중인 방이 아닌 경우', async () => {
      roomService.checkValidRoom.mockResolvedValue(false);

      const result = await messageService.sendMessage(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
      expect(result.message).toEqual(undefined);

      expect(roomService.checkValidRoom).toHaveBeenCalledTimes(1);
      expect(roomService.checkValidRoom).toHaveBeenCalledWith(
        input.roomId,
        mockUser.id,
      );
      expect(roomService.updateNewMesssageInUserRoom).toHaveBeenCalledTimes(0);
      expect(roomService.updateRoomUpdateAt).toHaveBeenCalledTimes(0);
      expect(messageRepository.create).toHaveBeenCalledTimes(0);
      expect(messageRepository.save).toHaveBeenCalledTimes(0);
      expect(pubSub.publish).toHaveBeenCalledTimes(0);
    });

    it('메시지 전송 (마지막 메시지가 당일인 경우)', async () => {
      const message = {
        id: 'test message',
        contents: input.contents,
        type: input.type,
        user: mockUser,
        room: { id: input.roomId },
        readUsersId: [mockUser.id],
      };

      roomService.checkValidRoom.mockResolvedValue(true);
      messageRepository.create.mockReturnValue(message);
      messageRepository.findOne.mockReturnValue({ createdAt: new Date() });

      const result = await messageService.sendMessage(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.message).toEqual(message);

      expect(roomService.checkValidRoom).toHaveBeenCalledTimes(1);
      expect(roomService.checkValidRoom).toHaveBeenCalledWith(
        input.roomId,
        mockUser.id,
      );

      expect(messageRepository.findOne).toHaveBeenCalledTimes(1);

      expect(roomService.updateNewMesssageInUserRoom).toHaveBeenCalledTimes(1);
      expect(roomService.updateNewMesssageInUserRoom).toHaveBeenCalledWith(
        input.roomId,
        mockUser.id,
        input.contents,
      );

      expect(roomService.updateRoomUpdateAt).toHaveBeenCalledTimes(1);
      expect(roomService.updateRoomUpdateAt).toHaveBeenCalledWith(input.roomId);

      const { id: _, ...createMessageData } = message;
      expect(messageRepository.create).toHaveBeenCalledTimes(1);
      expect(messageRepository.create).toHaveBeenCalledWith(createMessageData);

      expect(messageRepository.save).toHaveBeenCalledTimes(1);
      expect(messageRepository.save).toHaveBeenCalledWith(message);

      expect(pubSub.publish).toHaveBeenCalledTimes(1);
      expect(pubSub.publish).toHaveBeenCalledWith(NEW_MESSAGE, {
        newMessage: message,
      });
    });

    it('메시지 전송 (마지막 메시지가 당일이 아닌 경우)', async () => {
      const lastMessage = {
        id: 'test message',
        contents: input.contents,
        type: input.type,
        user: mockUser,
        room: { id: input.roomId },
        readUsersId: [mockUser.id],
        createdAt: new Date(2000, 1, 1),
      };

      const message = {
        id: 'test message',
        contents: input.contents,
        type: input.type,
        user: mockUser,
        room: { id: input.roomId },
        readUsersId: [mockUser.id],
      };

      roomService.checkValidRoom.mockResolvedValue(true);
      messageRepository.create.mockReturnValue(message);
      messageRepository.findOne.mockReturnValue(lastMessage);

      const result = await messageService.sendMessage(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.message).toEqual(message);

      expect(roomService.checkValidRoom).toHaveBeenCalledTimes(1);
      expect(roomService.checkValidRoom).toHaveBeenCalledWith(
        input.roomId,
        mockUser.id,
      );

      expect(messageRepository.findOne).toHaveBeenCalledTimes(1);

      expect(roomService.updateNewMesssageInUserRoom).toHaveBeenCalledTimes(1);
      expect(roomService.updateNewMesssageInUserRoom).toHaveBeenCalledWith(
        input.roomId,
        mockUser.id,
        input.contents,
      );

      expect(roomService.updateRoomUpdateAt).toHaveBeenCalledTimes(1);
      expect(roomService.updateRoomUpdateAt).toHaveBeenCalledWith(input.roomId);

      const { id: _, ...createMessageData } = message;
      expect(messageRepository.create).toHaveBeenCalledTimes(2);
      expect(messageRepository.create).toHaveBeenLastCalledWith(
        createMessageData,
      );

      expect(messageRepository.save).toHaveBeenCalledTimes(2);
      expect(messageRepository.save).toHaveBeenLastCalledWith(message);

      expect(pubSub.publish).toHaveBeenCalledTimes(2);
      expect(pubSub.publish).toHaveBeenLastCalledWith(NEW_MESSAGE, {
        newMessage: message,
      });
    });
  });

  describe('메시지 읽음 처리 테스트', () => {
    it('읽지 않은 메시지가 없는 경우', async () => {
      messageRepository.find.mockResolvedValue([]);

      const result = await messageService.readMessage(roomId, mockUser.id);

      expect(result).toEqual([]);

      expect(messageRepository.find).toHaveBeenCalledTimes(1);
      expect(messageRepository.save).toHaveBeenCalledTimes(0);
      expect(pubSub.publish).toHaveBeenCalledTimes(0);
    });

    it('메시지 읽음 처리', async () => {
      const messages = [
        { id: '1', readUsersId: [] },
        { id: '2', readUsersId: [] },
        { id: '3', readUsersId: ['y'] },
      ];
      const resultMessages = messages.map(({ id, readUsersId }) => ({
        id,
        readUsersId: [...readUsersId, mockUser.id],
      }));

      messageRepository.find.mockResolvedValue(messages);

      const result = await messageService.readMessage(roomId, mockUser.id);

      expect(result).toEqual(resultMessages);

      expect(messageRepository.find).toHaveBeenCalledTimes(1);
      expect(messageRepository.save).toHaveBeenCalledTimes(messages.length);
      messages.forEach(({ id, readUsersId }, i) => {
        expect(messageRepository.save).toHaveBeenNthCalledWith(i + 1, {
          id,
          readUsersId: [...readUsersId, mockUser.id],
        });
      });

      expect(pubSub.publish).toHaveBeenCalledTimes(1);
      expect(pubSub.publish).toHaveBeenCalledWith(READ_MESSAGE, {
        readMessage: {
          messages: resultMessages,
          roomId,
          userId: mockUser.id,
        },
      });
    });
  });
});
