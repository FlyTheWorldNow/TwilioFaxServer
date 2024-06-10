# 使用官方的 Node.js 镜像作为基础镜像
FROM node:14

# 设置工作目录
WORKDIR /usr/src/app

# 将项目文件复制到工作目录
COPY . .

# 安装依赖
RUN npm install

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "app.js"]
