// Все импорты библиотек, которыми будем пользоваться
import express from 'express'
import axios from 'axios'
import cors from 'cors'
import bodyParser from 'body-parser'
import multer from 'multer'
import helmet from "helmet"
import sharp from 'sharp'
import compression  from 'compression'

// Создаём сервер
const app = express()
// Указываем, куда сохранять файлы
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'static/img/tmp');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname)
  }
})
// Создаём конфигурацию multer
const upload = multer({ storage: storageConfig })

// Используем cors (Кросс-доменные запросы)
app.use(cors())
// Используем helmed (Защита)
// app.use(helmet())

// Используем функцию загрузки файлов
app.use(upload.any())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// middleware (фунция промежуточной обработки, которая срабатывает при любом запросе)
const addTimestamp = (req, res, next) => {
  return (req, res, next)=>{
    req.timeStamp = Date.now()
    next()
  }
}

// добавили свой middleware
app.use(addTimestamp())

// Настраиваем перекодировку изображений sharp
const resizeImages = async (req, res, next) => {
  if (!req.files) return next()
  try {

    req.body.images = []
    await Promise.all(
      req.files.map(async (file) => {
        // @ts-ignore
        const filename = Date.now() + "-" + file.originalname.match(/\d?[a-zA-Z.-]?/g).join('').replace(/\..+$/, "")
        const newFilename = `${filename}.webp`

        await sharp(file.path)
          .resize({ width: 1050 })
          .webp()
          .toFile(`static/img/desktop/${newFilename}`)

        await sharp(file.path)
          .resize({ width: 720 })
          .webp()
          .toFile(`static/img/tablet/${newFilename}`)

        await sharp(file.path)
          .resize({ width: 380 })
          .webp()
          .toFile(`static/img/mobile/${newFilename}`)

        await sharp(file.path)
          .resize({ width: 200 })
          .webp({ quality: 10 })
          .toFile(`static/img/lazy/${newFilename}`)
        fs.unlinkSync(file.path)
        req.body.images.push({ newName: newFilename, originalName: file.originalname })
      })
    )
  } catch (e) {
    console.log(e)
  }
  next()
}

// используем перекодировку изображений
app.use(resizeImages)

// parse application/json
app.use(bodyParser.json())

// Используем серверное сжатие
app.use(compression({strategy:3}))

// Используем папку со статическим контентом
app.use(express.static('static'))

// Описываем функцию, которая будет обрабатывать GET запросы на адрес '/'
app.get('/', function (req, res) {
  res.send('Hello World')
})

// Описываем функцию, которая будет обрабатывать GET запросы на адрес '/hello'
app.get('/hello', function (req, res) {  
  res.send('Hello user!!!')
})

// Описываем функцию, которая будет обрабатывать GET запросы на адрес '/translate'
app.get('/translate', async function (req, res) {  
  const headers = {...req.headers}
  delete headers.host
  // const resp = await axios.get('https://ya.ru/images/search?family=yes&from=tabbar&text=котята', {headers})
  const resp = await axios.get('https://translate.yandex.ru/?source_lang=en&target_lang=ru&text=hello new day', {headers})
  res.send({data:resp.data, headers: req.headers})
})

// Описываем функцию, которая будет обрабатывать POST запросы на адрес '/data'
app.post('/data', (req,res)=>{
  console.log(req.body)
  console.log(req.files)
  res.send({ok:'server'})
})

// Описываем функцию, которая будет обрабатывать GET запросы на адрес '/hello/:name/day/:day
// с параметрами :name и :day
// Они попадают в переменные req.params.name и req.params.day
app.get('/hello/:name/day/:day', function (req, res) {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    h1 {
      color:red;
    }
  </style>
</head>
<body>
  <h1>Привет ${req.params.name}! Поздравляю с ${req.params.day}</h1>
  <p id=ms>${req.timeStamp}</p>
  <script>
    console.log(Date.now() - +ms.innerText)
  </script>
</body>
</html>`
  )
})

app.get('/:any', function (req, res) {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    h1 {
      color:red;
    }
  </style>
</head>
<body>
  <h1>${req.params.any} такого адреса не существует</h1>
  <p>timestamp ${req.timeStamp}</p>
</body>
</html>`
  )
})
// Запускаем сервер слушать порт
app.listen(3000)

// https://habr.com/ru/articles/327440/