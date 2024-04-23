import { activity } from "./activity";
import { body } from "./body";
import { emotes } from "./emote";
import { flag } from "./flag";
import { food } from "./food";
import { goods } from "./goods";
import { journey } from "./journey";
import { sign } from "./sign";
import { zoon } from "./zoon";

export const EMOJI_DATA: Array<{ name: string; emoji: string }> = [
  ...flag,
  ...body,
  ...activity,
  ...emotes,
  ...food,
  ...goods,
  ...journey,
  ...sign,
  ...zoon,
];
