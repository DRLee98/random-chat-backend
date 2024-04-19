export class PushMessageInput {
  token: string;
  title: string;
  message: string;
  imageUrl?: string;
  data?: Record<string, string>;
}
