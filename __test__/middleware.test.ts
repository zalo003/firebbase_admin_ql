import { AuthData } from 'firebase-functions/tasks';
import { isConfirmedApp, isAuthorizedUser, chainMiddlewares } from '../src/middleware/firebase';
import { HttpsError } from 'firebase-functions/v2/https';

// confirm if the app is authentic
describe('isConfirmedApp Middleware', () => {
    let next: jest.Mock;
  
    beforeEach(() => {
      next = jest.fn();
    });
  
    it('should throw an error if app is undefined', () => {
      const app = undefined; // Simulating that the app is not verified
  
      expect(() => isConfirmedApp(app, next)).toThrowError(
        new HttpsError('failed-precondition', 'The function must be called from an App Check verified app.')
      );
    });
  
    it('should call next if app is verified', () => {
      const app = { appId: 'mockAppId', token: 'mockToken' }; // Mocking a verified app with required properties
  
      isConfirmedApp(app, next);
  
      expect(next).toHaveBeenCalledTimes(1);
    });
});

// confirms if there is an authenticated user
describe('isAuthorizedUser Middleware', () => {
    let next: jest.Mock;
  
    beforeEach(() => {
      next = jest.fn();
    });
  
    it('should throw an error if user is undefined', () => {
      const auth = undefined; // Simulating an unauthenticated user
  
      expect(() => isAuthorizedUser(auth, next)).toThrowError(
        new HttpsError('failed-precondition', 'The function must be called by an authorized user')
      );
    });
  
    it('should call next if user is authenticated', () => {
      const auth = {} as AuthData; // Simulating an authenticated user
  
      isAuthorizedUser(auth, next);
  
      expect(next).toHaveBeenCalledTimes(1);
    });
  });


// chains middlewares together
  describe('chainMiddlewares Function', () => {
    it('should execute all middlewares in sequence and then call the handler', async () => {
      const mockMiddleware1 = jest.fn((req, next) => next());
      const mockMiddleware2 = jest.fn((req, next) => next());
      const mockHandler = jest.fn(() => ({ message: 'Success' }));
  
      // Mocking the request object with necessary properties
      const request = {
        data: {}, // Mocking data (could be anything depending on your use case)
        rawRequest: {}, // Mocking rawRequest
        acceptsStreaming: false, // Mocking acceptsStreaming
      };
  
      const middlewares = [mockMiddleware1, mockMiddleware2];
  
      const result = await chainMiddlewares(middlewares, request, mockHandler);
  
      expect(mockMiddleware1).toHaveBeenCalledTimes(1);
      expect(mockMiddleware2).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: 'Success' });
    });
  
    it('should handle errors thrown by any middleware', async () => {
      const mockMiddleware1 = jest.fn((req, next) => next());
      const mockMiddleware2 = jest.fn(() => {
        throw new Error('Middleware 2 Error');
      });
      const mockHandler = jest.fn();
  
      const request = {
        data: {},
        rawRequest: {},
        acceptsStreaming: false,
      };
  
      const middlewares = [mockMiddleware1, mockMiddleware2];
  
    //   await expect(chainMiddlewares(middlewares, request, mockHandler)).rejects.toThrowError('Middleware 2 Error');
      expect(mockMiddleware1).toHaveBeenCalledTimes(1);
      expect(mockMiddleware2).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledTimes(0); // The handler should not be called due to error
    });
  });
