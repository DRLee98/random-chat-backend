import { determiners, nouns } from './constants';

export const getProfilePath = (socialId: string) => {
  return `user-profile/${socialId}`;
};

export const getOpinionPath = (id: string) => {
  return `opinion/${id}`;
};

export const randomNameGenerator = () => {
  return `${determiners[Math.floor(Math.random() * determiners.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  } ${Math.floor(Math.random() * 9999)}`;
};
