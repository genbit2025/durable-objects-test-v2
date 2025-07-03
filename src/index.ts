import { DurableObject } from "cloudflare:workers";

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject<Env> {
    /**
     * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
     * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
     *
     * @param ctx - The interface for interacting with Durable Object state
     * @param env - The interface to reference bindings declared in wrangler.jsonc
     */
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }

    /**
     * The Durable Object exposes an RPC method sayHello which will be invoked when when a Durable
     *  Object instance receives a request from a Worker via the same method invocation on the stub
     *
     * @returns The greeting to be sent back to the Worker
     */
    async sayHello(): Promise<string> {
        let result = this.ctx.storage.sql
            .exec("SELECT 'Hello, World!段超' as greeting")
            .one() as { greeting: string };

        await sleep(10000);
        return result.greeting;
    }

    async lock(lockKey: string): Promise<boolean> {
        let lockKeyValue = await this.ctx.storage.get(lockKey);
        console.log("lockKeyValue=", lockKeyValue);
        if (lockKeyValue) {
            console.log("加锁失败");
            return false;
        }
        await this.ctx.storage.put(lockKey, "1");

        // console.log("任务正在执行");
        // await sleep(10000);
        // console.log("任务执行完成");

        return true;
    }
    async unlock(lockKey: string): Promise<boolean> {
        await this.ctx.storage.delete(lockKey);
        return true;
    }

    // async increment(amount = 1) {
    //     let lockKeyValue = await this.ctx.storage.get("value");
    //     console.log("lockKeyValue=", lockKeyValue);
    //     await this.ctx.storage.put(lockKey, "1");

    //     let value: number = (await this.ctx.storage.get("value")) || 0;
    //     value += amount;
    //     // You do not have to worry about a concurrent request having modified the value in storage.
    //     // "input gates" will automatically protect against unwanted concurrency.
    //     // Read-modify-write is safe.
    //     await this.ctx.storage.put("value", value);
    //     return value;
    // }
}

export default {
    /**
     * This is the standard fetch handler for a Cloudflare Worker
     *
     * @param request - The request submitted to the Worker from the client
     * @param env - The interface to reference bindings declared in wrangler.jsonc
     * @param ctx - The execution context of the Worker
     * @returns The response to be sent back to the client
     */
    async fetch(request, env, ctx): Promise<Response> {

        let url = new URL(request.url);
        let userId = url.searchParams.get("userId");
        if (!userId) {
            return new Response(
                "Select a Durable Object to contact by using" +
                " the `userId` URL query string parameter, for example, ?userId=A",
            );
        }
        let lockKey = "lock_userId_1111";
        let id = env.MY_DURABLE_OBJECT.idFromName(lockKey);
        // Create a `DurableObjectId` for an instance of the `MyDurableObject`
        // class. The name of class is used to identify the Durable Object.
        // Requests from all Workers to the instance named
        // will go to a single globally unique Durable Object instance.
        // const id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName(
        //     new URL(request.url).pathname,
        // );

        // Create a stub to open a communication channel with the Durable
        // Object instance.
        const stub = env.MY_DURABLE_OBJECT.get(id);

        // Call the `sayHello()` RPC method on the stub to invoke the method on
        // the remote Durable Object instance
        //const greeting = await stub.sayHello();
        const lockFlag = await stub.lock(lockKey);
        if (lockFlag) {
            console.log("加锁成功");
        } else {
            return new Response(
                `用户正在执行，，，请稍后 ${lockFlag}`,
            );
        }

        // //模拟业务正在处理，睡眠10s
        // console.log("任务正在执行");
        // await sleep(10000);

        // stub.unlock(lockKey);
        // console.log("解锁成功成功");

        //let count = await stub.increment();
        return new Response(`Durable Object: ${lockFlag}`);
    },
} satisfies ExportedHandler<Env>;
