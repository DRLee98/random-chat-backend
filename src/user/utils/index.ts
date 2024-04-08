import { determiners, nouns } from './constants';

export const getProfilePath = (socialId: string) => {
  return `user-profile/${socialId}`;
};

export const randomNameGenerator = () => {
  return `${determiners[Math.floor(Math.random() * determiners.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  } ${Math.floor(Math.random() * 9999)}`;
};

export const getDayStr = (dayNum: number): string => {
  switch (dayNum) {
    case 0:
      return '일요일';
    case 1:
      return '월요일';
    case 2:
      return '화요일';
    case 3:
      return '수요일';
    case 4:
      return '목요일';
    case 5:
      return '금요일';
    case 6:
      return '토요일';
    default:
      break;
  }
};
