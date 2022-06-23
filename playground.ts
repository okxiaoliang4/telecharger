import { telecharger } from './src/index'

const button = document.querySelector('#download')
button?.addEventListener('click', async () => {
  console.time('download')
  const result = await telecharger('/test.jpg')
  result.emitter.on('progress', (progress) => {
    console.log(`${progress * 100}%`);
  })
  result.emitter.on('done', () => {
    console.log('done');
    console.timeEnd('download')
  })
})