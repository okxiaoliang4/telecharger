import { describe, expect, it } from "vitest";
import { getContentLength, sliceDownLoad } from ".";

describe('getContentLength', () => {
  it('should return the content length of the given url', async () => {
    const len = await getContentLength('http://127.0.0.1:3000/test.jpg')
    expect(len).toBe(242175)
  })
})