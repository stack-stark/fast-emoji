import { activity } from "./activity";
import { body } from "./body";
import { emotes } from "./emote";
import { flag } from "./flag";
import { food } from "./food";
import { goods } from "./goods";
import { journey } from "./journey";
import { sign } from "./sign";
import { zoo } from "./zoo";
import { EmojiItem } from "./types";

const rawData: EmojiItem[] = [
  ...flag,
  ...body,
  ...activity,
  ...emotes,
  ...food,
  ...goods,
  ...journey,
  ...sign,
  ...zoo,
];

export const EMOJI_DATA: EmojiItem[] = rawData;

export const emojiMap: Map<string, string> = new Map(
  rawData.map((item) => [item.name, item.emoji])
);
