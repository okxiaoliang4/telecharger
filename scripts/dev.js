const express = require('express')
const path = require('path')
const fs = require('fs')
const cors = require('cors')

const distPath = '../playground'
const app = express()
app.use(cors({
  // Access-Control-Allow-Headers: Range
  allowedHeaders:['Range'],
  // Access-Control-Expose-Headers: Accept-Ranges, Content-Encoding, Content-Length, Content-Range
  exposedHeaders:['Accept-Ranges', 'Content-Encoding', 'Content-Length', 'Content-Range']
}))
app.get('/down/:name', (req, res) => {
  try {
    let filename = req.params.name
    //获取文件的位置 和文件的大小
    let filePath = path.resolve(__dirname, distPath, req.params.name)
    let size = fs.statSync(filePath).size
    //获取请求头的range字段
    let range = req.headers['range']
    let file = path.resolve(__dirname, distPath, filename)
    //不使用分片下载  直接传输文件
    console.log(range)
    if (!range) {
      //res.set({'Accept-Ranges':'bytes'})
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${filename}`,
      })
      fs.createReadStream(file).pipe(res)
      return
    }
    //获取分片的开始和结束位置
    let bytesV = range.split('=')
    bytesV.shift()
    let [start, end=242175] = bytesV.join('').split('-')
    start = Number(start)
    end = Number(end)
    //分片开始 结束位置不对 拒绝下载
    if (start > size || end > size) {
      res.set({'Content-Range': `bytes */${size}`})
      res.status(416).send(null)
      return
    }
    //开始分片下载
    res.status(206)
    res.set({
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end ? end : size}/${size}`,
    })
    console.log(start + '---' + end)
    fs.createReadStream(file, {start, end}).pipe(res)
  } catch (e) {
    console.error(e)
  }
})

app.listen(8800)
