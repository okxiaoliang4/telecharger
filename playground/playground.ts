import { telecharger } from '../src/index'

const button = document.querySelector('#download') as HTMLButtonElement
const pause = document.querySelector('#pause') as HTMLButtonElement
const resume = document.querySelector('#resume') as HTMLButtonElement

button?.addEventListener('click', async () => {
  // https://az764295.vo.msecnd.net/stable/30d9c6cd9483b2cc586687151bcbcd635f373630/VSCode-darwin-universal.zip
  const result = await telecharger('./test.jpg')

  result.emitter.on('progress', (progress) => {
    console.log(`${progress * 100}%`);
  })

  result.emitter.on('done', (blob) => {
    const img = document.createElement('img')
    img.src = window.URL.createObjectURL(blob)
    document.body.appendChild(img)
  })

  pause.onclick = result.pause
  resume.onclick = result.resume
})