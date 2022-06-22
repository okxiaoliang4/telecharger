import { sliceDownLoad } from './src/index'

const button = document.querySelector('#download')
button?.addEventListener('click', () => {
  sliceDownLoad('/test.jpg')
})