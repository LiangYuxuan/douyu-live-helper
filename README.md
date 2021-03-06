# Douyu Live Helper

斗鱼直播相关自动化脚本

## 功能

- [x] 每日获取并赠送荧光棒

## 配置方法

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
npm install
npm run build
node dist/app.js
```

## 许可

MIT License
