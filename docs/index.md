---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Learn Nodejs"
  text: ""
  tagline: "Nodejs 学习总结，以及web框架 express koa nestjs"
  image:
    src: /node-mascot.svg
    alt: "nodejs 吉祥物"
  actions:
    - theme: brand
      text: Nodejs
      link: /builtin/index.md
    - theme: brand
      text: Web Framework
      link: /web/index.md

features:
  - title: Nodejs
    details: nodejs 基本知识，以及内置模块
  - title: Web Framework
    details: 使用原生 nodejs、express、koa、Nestjs 开发 web 服务端应用
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(120deg, #417e38 30%, transparent);
  --vp-home-hero-image-background-image: linear-gradient(
    -45deg,
    #417e38 60%,
    transparent 30%
  );
  --vp-home-hero-image-filter: blur(100px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>
