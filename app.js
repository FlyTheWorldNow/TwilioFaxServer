const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const app = express();

// 配置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 解析请求体
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 路由
app.get('/', (req, res) => {
    // 渲染首页
    res.render('index');
});

// 其他路由...

// 监听端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
