FROM node:18

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install

COPY src tsconfig.json ./

CMD [ "pnpm", "start" ]
