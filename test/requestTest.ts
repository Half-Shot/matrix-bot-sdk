import * as expect from "expect";
import { getRequestFn, setRequestFn } from "../src.ts";

describe('request', () => {
    it('should return whatever request function was set', () => {
        const testFn = (() => null);
        setRequestFn(testFn);
        expect(getRequestFn()).toBe(testFn);
    });
});
