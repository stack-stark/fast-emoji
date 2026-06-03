export interface EmojiItem {
  name: string;
  emoji: string;
  category?: EmojiCategory;
}

export enum EmojiCategory {
  Activity = "activity",
  Body = "body",
  Emote = "emote",
  Flag = "flag",
  Food = "food",
  Goods = "goods",
  Journey = "journey",
  Sign = "sign",
  Zoo = "zoo",
}

export interface ExtensionConfig {
  prefix: string;
}

export interface MatchResult {
  name: string;
  startIndex: number;
  endIndex: number;
}
