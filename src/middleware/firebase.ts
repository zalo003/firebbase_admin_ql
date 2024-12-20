import { AppCheckData, CallableRequest } from "firebase-functions/lib/common/providers/https";
import { HttpsError } from "firebase-functions/v2/https";
import { AuthData } from "firebase-functions/v2/tasks";
import { Message } from "../interfaces";



/**
 * Middleware function to verify if the request is from an App Check verified app.
 * If the app data is missing or invalid, an HttpsError is thrown.
 *
 * @param {AppCheckData | undefined} app - The App Check data of the incoming request, can be `undefined` if not available.
 * @param {Function} next - The callback function to pass control to the next middleware if the app is verified.
 * @throws {HttpsError} Throws an HttpsError if the app is not verified.
 */
export const isConfirmedApp = (app: AppCheckData | undefined, next: Function) => {
  if (app === undefined) {
    throw new HttpsError(
      "failed-precondition",
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
export const isAuthorizedUser = (auth: AuthData | undefined, next: Function) => {
  if (auth === undefined) {
    throw new HttpsError(
      "failed-precondition",
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
  request: CallableRequest<any>,
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

