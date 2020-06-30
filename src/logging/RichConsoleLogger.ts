import { ILogger } from "./ILogger.ts";
import clc from 'https://deno.land/x/color/index.ts'

/**
 * Prints to the console with colors and a format.
 * @category Logging
 */
export class RichConsoleLogger implements ILogger {

    protected chalkDebug = clc.cyan.text;
    protected chalkInfo = clc.green.text;
    protected chalkWarning = clc.yellow.text;
    protected chalkError = clc.bright.red.text;
    protected chalkTimestamp = clc.grey.text;
    protected chalkModule = clc.grey.text;

    protected getTimestamp(): string {
        const now = new Date(Date.now()).toUTCString();
        return now; // this.chalkTimestamp(now);
    }

    public debug(module: string, ...messageOrObject: any[]) {
        console.debug(
            this.getTimestamp(),
            this.chalkDebug("[DEBUG]"),
            this.chalkModule(`[${module}]`),
            ...messageOrObject,
        );
    }

    public error(module: string, ...messageOrObject: any[]) {
        console.error(
            this.getTimestamp(),
            this.chalkError("[ERROR]"),
            this.chalkModule(`[${module}]`),
            ...messageOrObject,
        );
    }

    public info(module: string, ...messageOrObject: any[]) {
        console.log(
            this.getTimestamp(),
            this.chalkInfo("[INFO]"),
            this.chalkModule(`[${module}]`),
            ...messageOrObject,
        );
    }

    public warn(module: string, ...messageOrObject: any[]) {
        console.warn(
            this.getTimestamp(),
            this.chalkWarning("[WARN]"),
            this.chalkModule(`[${module}]`),
            ...messageOrObject,
        );
    }

}
