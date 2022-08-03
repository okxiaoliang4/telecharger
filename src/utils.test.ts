import { getHead } from "./utils";

describe('getContentLength', () => {
  it('should return the content length of the given url', async () => {
    const headers = await getHead('http://127.0.0.1:3000/playground/test.jpg')
    const len = headers.get('Content-Length')
    expect(len).toBe(242175)
  })
})