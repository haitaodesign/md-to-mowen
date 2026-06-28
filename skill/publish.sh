#!/bin/bash

# mowen-publish Skill wrapper for Claude Code
# 用法：./publish.sh [args...]

set -e

# 检查 CLI 是否安装
if ! command -v mowen-publish &> /dev/null; then
    echo "正在安装 mowen-publish..."
    npm install -g mowen-publish
fi

# 调用 CLI
mowen-publish "$@"
