const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const session = require('express-session');
const multer = require('multer');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

// 配置 session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // 生产环境应设置为 true 并使用 HTTPS
}));

// 文件上传配置
const upload = multer({ dest: 'uploads/' });

// 用户凭据（示例）
const adminUsername = 'admin';
const adminPassword = 'password';

// 配置文件路径
const configPath = path.resolve(__dirname, 'config.json');

// 读取配置文件
let config = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath));
}

let client, transporter;
if (config.accountSid && config.authToken) {
  client = new twilio(config.accountSid, config.authToken);
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.emailUser,
      pass: config.emailPass
    }
  });
}

const faxes = [];
const sentFaxes = [];  // 用于存储已发送传真信息

// 中间件：保护设置页面和 API
function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
}

// 处理发送传真
app.post('/send-fax', upload.single('faxFile'), async (req, res) => {
  if (!client) {
    return res.status(500).send('Twilio client not configured.');
  }

  const { to, from } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  // 将文件上传到一个公共可访问的URL，比如S3，假设 uploadFileToS3 返回文件的URL
  const mediaUrl = await uploadFileToS3(file.path);

  client.fax.faxes
    .create({
      to: to,
      from: from,
      mediaUrl: mediaUrl
    })
    .then(fax => {
      // 将文件移动到 sent-faxes 目录并重命名
      const sentFaxPath = path.resolve(__dirname, 'sent-faxes', file.originalname);
      fs.renameSync(file.path, sentFaxPath);

      // 存储已发送传真信息
      const sentFaxInfo = {
        from: from,
        to: to,
        mediaUrl: `/sent-faxes/${file.originalname}`,
        dateSent: new Date().toISOString(),
        sid: fax.sid
      };
      sentFaxes.push(sentFaxInfo);

      res.json({ sid: fax.sid });
    })
    .catch(error => {
      fs.unlinkSync(file.path);
      res.status(500).send(error);
    });
});

// 处理接收传真
app.post('/receive-fax', (req, res) => {
  if (!client) {
    return res.status(500).send('Twilio client not configured.');
  }

  const faxSid = req.body.FaxSid;

  client.fax.faxes(faxSid)
    .fetch()
    .then(fax => {
      const mediaUrl = fax.mediaUrl;
      const fileName = `fax_${faxSid}.pdf`;

      axios({
        method: 'get',
        url: mediaUrl,
        responseType: 'stream'
      })
        .then(response => {
          const filePath = path.resolve(__dirname, 'faxes', fileName);
          const writer = fs.createWriteStream(filePath);

          response.data.pipe(writer);
          writer.on('finish', () => {
            const faxInfo = {
              from: fax.from,
              to: fax.to,
              mediaUrl: `/faxes/${fileName}`,
              dateCreated: fax.dateCreated
            };
            faxes.push(faxInfo);

            // 发送电子邮件通知
            const mailOptions = {
              from: config.emailUser,
              to: config.toEmail,
              subject: 'New Fax Received',
              text: `You have received a new fax from ${fax.from} to ${fax.to}.`,
              attachments: [
                {
                  filename: fileName,
                  path: filePath
                }
              ]
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Email error:', error);
              } else {
                console.log('Email sent:', info.response);
              }
            });

            // 发送短信通知
            client.messages
              .create({
                body: `You have received a new fax from ${fax.from} to ${fax.to}.`,
                from: fax.to,
                to: config.smsRecipient
              })
              .then(message => console.log('SMS sent:', message.sid))
              .catch(error => console.log('SMS error:', error));

            res.send(`Fax saved as ${fileName}`);
          });
          writer.on('error', error => res.status(500).send(error));
        })
        .catch(error => res.status(500).send(error));
    })
    .catch(error => res.status(500).send(error));
});

// 保存设置
app.post('/api/save-settings', isAuthenticated, (req, res) => {
  const newConfig = req.body;
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
  res.sendStatus(200);
  // 更新 Twilio 客户端和邮件发送器
  config = newConfig;
  client = new twilio(config.accountSid, config.authToken);
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.emailUser,
      pass: config.emailPass
    }
  });
});

// 获取设置
app.get('/api/settings', isAuthenticated, (req, res) => {
  if (fs.existsSync(configPath)) {
    const settings = JSON.parse(fs.readFileSync(configPath));
    res.json(settings);
  } else {
    res.json({});
  }
});

// 登录页面
app.get('/login', (req, res) => {
  res.render('login');
});

// 处理登录
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUsername && password === adminPassword) {
    req.session.authenticated = true;
    res.redirect('/settings');
  } else {
    res.redirect('/login');
  }
});

// 处理注销
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// 设置页面
app.get('/settings', isAuthenticated, (req, res) => {
  res.render('settings');
});

// 保护传真文件的访问
app.use('/faxes', isAuthenticated, express.static(path.join(__dirname, 'faxes')));
app.use('/sent-faxes', isAuthenticated, express.static(path.join(__dirname, 'sent-faxes')));

app.get('/', (req, res) => {
  res.render('index', { faxes, sentFaxes, twilioPhoneNumbers: config.twilioPhoneNumbers });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// 示例文件上传到 S3 的方法
async function uploadFileToS3(filePath) {
  // 这里应该包含将文件上传到 S3 的逻辑，并返回文件的公共 URL
  // 这只是一个示例，你需要根据实际的 S3 配置进行调整
  return 'https://example.com/path/to/your/file.pdf';
}
