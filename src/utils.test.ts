import { getContentLength } from "./utils";

describe('getContentLength', () => {
  it('should return the content length of the given url', async () => {
    const len = await getContentLength('http://127.0.0.1:3000/playground/test.jpg')
    expect(len).toBe(242175)
  })
})