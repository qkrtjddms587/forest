#!/bin/bash

# 변수 설정


echo "🚀 배포를 시작합니다: $APP_NAME"

cd /volume1/www/forest-app

git pull origin main

git reset --hard origin/main

docker-compose down

docker-compose up -d --build


echo "✅ 배포 완료!"