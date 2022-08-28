import { toAny } from "../test/test_deps.ts";



  
export const extendRequest = () => {
    if (!!toAny(Request.prototype).json0 as boolean) {
        // already extended
        return
      }
       
      toAny(Request.prototype).json0 = Request.prototype.json;
      toAny(Request.prototype).text0 = Request.prototype.text;
      Request.prototype.json = async function (this: Request) {
        if (this.parsedBody) {
            return this.parsedBody;
          }
        try {
            this.parsedBody = await toAny(this).json0();
        } catch(_: unknown) {        
            this.parsedBody = Promise.resolve({error: true});
        }
        return this.parsedBody;
    } as InstanceType<typeof Request>['json']

    Request.prototype.text = async function (this: Request) {
        console.log('=> TEXT', this.bodyUsed);
        if (this.parsedBody) {
            return this.parsedBody;
          }
        this.parsedBody = await toAny(this).text0();
        console.log('TXT =>', this.parsedBody);
        return this.parsedBody;
    } as InstanceType<typeof Request>['text']

}