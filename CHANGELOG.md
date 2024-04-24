# 快捷 emoji Change Log

## [1.0.0] - 2024-04-23

### Added

- 支持中文输入，用户输入特定关键字后跟中文字符，按下空格键即可插入对应的 emoji。

- Support for inserting emojis when the user types a specific keyword followed by a Chinese character or emoji name and then presses the space bar.

### Changed

- 修改正则表达式以正确匹配中文输入。

- Updated the regular expression to correctly match the emoji name input pattern.

### Fixed

- 解决了由于事件监听不当导致的插件无法触发 emoji 插入的问题。

- Resolved an issue where the plugin would not trigger the emoji insertion due to incorrect event handling.
