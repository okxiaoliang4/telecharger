import { $fetch } from 'ohmyfetch'

export async function sliceDownLoad(url: string) {
  console.log(await getContentLength(url));
}

export function getContentLength(url: string) {
  return $fetch.raw(url, {
    method: 'HEAD'
  }).then(res => Number(res.headers.get('Content-Length')))
}