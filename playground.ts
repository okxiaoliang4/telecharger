import { telecharger } from './src/index'

const button = document.querySelector('#download')
button?.addEventListener('click', async () => {
  const result = await telecharger('/test.jpg', {
    threads: 2,
    chunkSize: 10_240,
  })

  result.emitter.on('progress', (progress) => {
    console.log(`${progress * 100}%`);
  })

  result.emitter.on('done', (blob) => {
    const img = document.createElement('img')
    img.src = window.URL.createObjectURL(blob)
    document.body.appendChild(img)
  })
})