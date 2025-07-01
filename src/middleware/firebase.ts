import { logger } from "firebase-functions/v2";
import { Message } from "../utility";
import { CallableRequest, onCall, CallableFunction } from "firebase-functions/https";

/**
 * Middleware function to verify if the request is from an App Check verified app.
 * If the app data is missing or invalid, an HttpsError is thrown.
 *
 * @param {AppCheckData | undefined} app - The App Check data of the incoming request, can be `undefined` if not available.
 * @param {Function} next - The callback function to pass control to the next middleware if the app is verified.
 * @throws {HttpsError} Throws an HttpsError if the app is not verified.
 */
export const isConfirmedApp = (app: object | undefined, next: Function) => {
  if (app === undefined) {
    throw new Error(
      "The function must be called from an App Check verified app."
    );
  }
  next(); // Continue to the next middleware
};


/**
 * Middleware function to check if the user is authorized.
 * If the auth data is missing or invalid, an HttpsError is thrown.
 *
 * @param {AuthData | undefined} auth - The authentication data of the user, can be `undefined` if not available.
 * @param {Function} next - The callback function to pass control to the next middleware if the user is authorized.
 * @throws {HttpsError} Throws an HttpsError if the user is not authorized.
 */
export const isAuthorizedUser = (auth: object | undefined, next: Function) => {
  if (auth === undefined) {
    throw new Error(
      "The function must be called by an authorized user"
    );
  }
  next(); // Continue to the next middleware
};


/**
 * Chains multiple middleware functions and executes them in sequence. 
 * Once all middlewares are executed, the final handler function is invoked.
 * If any middleware throws an error, the process is halted.
 *
 * @param {Function[]} middlewares - An array of middleware functions to be executed in order. 
 *                                    Each middleware should call the `next` function to proceed to the next middleware.
 * @param {CallableRequest<any>} request - The Firebase function's request object that contains the request data.
 * @param {Function} handler - The final function to be called after all middlewares are executed.
 * @returns {Promise<Message>} A promise that resolves with the result from the handler function once all middlewares have been processed.
 * @throws {Error} Throws an error if any middleware or the handler throws an exception.
 */
export const chainMiddlewares = async (
  middlewares: Function[],
  request: any,
  handler: Function
): Promise<Message> => {
  const execute = async (index: number): Promise<any> => {
    if (index < middlewares.length) {
      return new Promise((resolve, reject) => {
        try {
          middlewares[index](request, async () => {
            resolve(await execute(index + 1));
          });
        } catch (error) {
          reject(error);
        }
      });
    } else {
      return await handler(request); // Return the result from the handler
    }
  };
  return await execute(0); // Start the middleware chain
};


/**
 * A wrapper function for Firebase Callable Functions with optional authentication and middleware support.
 * 
 * @param callback {(request: CallableRequest<any>) => Promise<Message>} - 
 *        The main function to execute after middleware processing. It should accept a CallableRequest object and return a Promise of type Message.
 * 
 * @param withAuth {boolean} [optional] - 
 *        A boolean indicating whether the function should enforce user authentication using `isAuthorizedUser`. Defaults to false.
 * 
 * @returns {CallableFunction<any, Promise<Message | { status: string; message: string }>, unknown>} - 
 *          A Firebase Callable Function with middleware for app confirmation and optional user authentication.
 */
export const callableFunctionWrapper = (callback: (request: CallableRequest<any>)=>Promise<Message>, withAuth: boolean = false): CallableFunction<any, Promise<Message | { status: string; message: string; data?: any}>, unknown> => {
    return onCall(
      {
        timeoutSeconds: 120,
        enforceAppCheck: true,
      },
      async (request) => {
        try {
            const middleWares = [
                (req: CallableRequest<any>, next: ()=>void) =>
                isConfirmedApp(req.app, next),
            ];
            if(withAuth) middleWares.push(
                (req: CallableRequest<any>, next: ()=>void) =>
                isAuthorizedUser(req.auth, next),
            )
          return await chainMiddlewares(
            middleWares,
            request,
            async () => {
              try {
                return await callback(request);
              } catch (error) {
                logger.log("callableFunctionWrapper: ", error);
                return {
                  status: "error",
                  message: "Unable to conclude process",
                };
              }
            }
          );
        } catch (error) {
            logger.log("init error: ", error);
          return {
            status: "error",
            message: "Poor network connections!",
          };
        }
      }
    );
    
}


