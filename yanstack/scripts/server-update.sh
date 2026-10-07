#!/usr/bin/env bash
# 在服务器上执行：解压新包后跑本脚本
set -euo pipefail
cd "$(dirname "$0")"
sudo systemctl stop yanstack || true
# 保留线上 .env
if [[ -f ../yanstack/.env && ! -f .env ]]; then
  cp ../yanstack/.env .env
fi
# 若当前目录就是 ~/yanstack（覆盖解压），.env 应已在
npm install --prefer-offline
# 数据库：若包内带 prisma/dev.db 则直接用；否则只迁移结构
if [[ -f prisma/dev.db ]]; then
  echo "using bundled prisma/dev.db"
else
  npx prisma db push
fi
npm run build
sudo systemctl start yanstack
sudo systemctl status yanstack --no-pager | head -n 20
curl -sI http://127.0.0.1:3000 | head -n 5
echo "done: open http://124.220.179.231"
