import { telecharger } from '../src'

const button = document.querySelector('#download') as HTMLButtonElement
const pause = document.querySelector('#pause') as HTMLButtonElement
const resume = document.querySelector('#resume') as HTMLButtonElement

button?.addEventListener('click', async () => {
  try {
    const result = await telecharger('http://localhost:8800/down/test.jpg')

    result.emitter.on('progress', (progress) => {
      console.log(`${progress * 100}%`)
    })

    result.emitter.on('done', (blob) => {
      const img = document.createElement('img')
      img.src = window.URL.createObjectURL(blob)
      document.body.appendChild(img)
    })

    pause.onclick = result.pause
    resume.onclick = result.resume
  } catch (e) {
    console.error(e)
  }
})
