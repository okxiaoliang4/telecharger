import { telecharger } from './src/index'

const button = document.querySelector('#download')
button?.addEventListener('click', async () => {
  console.time('download')
  const result = await telecharger('/CCA-universalTest-v2.0.1.3.apk')
  result.emitter.on('progress', (progress) => {
    console.log(`${progress * 100}%`);
  })
  result.emitter.on('done', () => {
    console.log('done');
    console.timeEnd('download')
  })
})