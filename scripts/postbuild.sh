#!/bin/sh
# 给编译后的 CLI 文件添加 shebang
CLI_FILE="dist/cli/index.js"
if [ -f "$CLI_FILE" ]; then
  # 如果还没有 shebang，添加之
  if ! head -1 "$CLI_FILE" | grep -q '^#!'; then
    sed -i '' '1i\
#!/usr/bin/env node
' "$CLI_FILE"
    echo "✅ 已为 $CLI_FILE 添加 shebang"
  else
    echo "ℹ️  $CLI_FILE 已有 shebang"
  fi
fi
