import * as assert from "assert";
import { escapeRegex } from "../matcher";
import { emojiMap, EMOJI_DATA } from "../constants/emoji";

suite("Matcher Test Suite", () => {
  test("escapeRegex 应转义正则特殊字符", () => {
    assert.strictEqual(escapeRegex("++"), "\\+\\+");
    assert.strictEqual(escapeRegex("$test"), "\\$test");
    assert.strictEqual(escapeRegex("a.b"), "a\\.b");
    assert.strictEqual(escapeRegex("(hi)"), "\\(hi\\)");
    assert.strictEqual(escapeRegex("000"), "000");
  });

  test("escapeRegex 应处理空字符串", () => {
    assert.strictEqual(escapeRegex(""), "");
  });

  test("escapeRegex 应处理所有特殊字符", () => {
    const input = ".*+?^${}()|[]\\";
    const expected = "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\";
    assert.strictEqual(escapeRegex(input), expected);
  });
});

suite("Emoji Data Test Suite", () => {
  test("emojiMap 应包含已知 emoji", () => {
    assert.strictEqual(emojiMap.get("闪亮"), "✨");
    assert.strictEqual(emojiMap.get("嘿嘿"), "😀");
    assert.strictEqual(emojiMap.get("西红柿"), "🍅");
  });

  test("emojiMap 对不存在的名称应返回 undefined", () => {
    assert.strictEqual(emojiMap.get("不存在的emoji"), undefined);
    assert.strictEqual(emojiMap.get(""), undefined);
  });

  test("EMOJI_DATA 不应为空", () => {
    assert.ok(EMOJI_DATA.length > 0);
  });

  test("EMOJI_DATA 每条数据应有 name 和 emoji 字段", () => {
    for (const item of EMOJI_DATA) {
      assert.ok(item.name, `缺少 name 字段: ${JSON.stringify(item)}`);
      assert.ok(item.emoji, `缺少 emoji 字段: ${JSON.stringify(item)}`);
    }
  });

  test("emojiMap 大小应与 EMOJI_DATA 一致", () => {
    assert.strictEqual(emojiMap.size, EMOJI_DATA.length);
  });
});
