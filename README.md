# Douyu Live Helper

斗鱼直播相关自动化脚本

## 功能

- [x] 每日获取并赠送荧光棒

## 配置与运行

### Docker Compose

1. 编写配置文件

根据需要修改environment条目的变量，并保存为`compose.yml`文件。

```yml
version: "3"

services:
  firefox:
    image: "selenium/standalone-firefox:latest"
    # image: "seleniarm/standalone-firefox:latest" # 在ARM机器上运行时使用
    network_mode: bridge
    shm_size: 2g
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4444"]
      interval: 20s
      timeout: 10s
      retries: 3
      start_period: 40s
      start_interval: 5s
  app:
    image: "rhyster/douyu-live-helper:latest"
    network_mode: bridge
    links:
      - firefox
    environment:
      MANUAL: 1 # 自定义赠送数量
      ROOM_ID: 48699 # 送礼目标直播间（以英文逗号间隔）
      SEND_COUNT: 1 # 对应荧光棒数量
      PUSHKEY: PUSHKEY_HERE # PushDeer PushKey
      CRON_EXP: 30 5 0 * * * # CRON 表达式
      SELENIUM_URL: http://firefox:4444/
      COOKIES: "${COOKIES}"
    depends_on:
      firefox:
        condition: service_healthy
```

2. 获取Cookies

程序会尝试从以下途径获取Cookies：`.env`中的`COOKIES`、`.cookies`文件内容、环境变量`COOKIES`。考虑到更新Cookies时需要修改`compose.yml`较为不便，以下以保存到`.cookies`文件为例。

打开无痕模式，随便打开一个直播间，然后打开开发人员工具，在网络/Network选项卡内过滤`douyu.com`的`Fetch/XHR`请求，随意挑选一个请求，然后在请求头中找到Cookie，复制冒号后面的内容（即下图浅蓝色部分）。

![How to find Cookies](HOWTO-Cookies.jpg)

3. 运行

```bash
COOKIES=$(cat .cookies) docker compose up --exit-code-from app
```

### Node

1. 运行环境

需要环境 Node.js >= 14.18.2，Google Chrome >= 97.0与对应的Chromedriver。

2. 配置

```bash
cp .env.example .env
vi .env
```

根据注释修改，如果需要禁用某项功能，将等号后置空或者改为0。

3. 获取Cookies

程序会尝试从以下途径获取Cookies：`.env`中的`COOKIES`、`.cookies`文件内容、环境变量`COOKIES`。

打开无痕模式，随便打开一个直播间，然后打开开发人员工具，在网络/Network选项卡内过滤`douyu.com`的`Fetch/XHR`请求，随意挑选一个请求，然后在请求头中找到Cookie，复制冒号后面的内容（即下图浅蓝色部分）。

![How to find Cookies](HOWTO-Cookies.jpg)

4. 开始运行

```bash
pnpm install
pnpm build
pnpm start
```

## 许可

MIT License
