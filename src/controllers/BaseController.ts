import { Request, Response } from "express";
import Joi from "joi";
import { ICurrentUser } from "../lib/CurrentUser";

interface IConstructorArgs<TDataStore> {
  req: Request;
  res: Response;
  dataStore?: TDataStore;
  cu: ICurrentUser;
}

export type THttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface IController {
  /**
   * This method should be called to handle the current request
   * no additional params should be needed since the request and
   * response should be available to the controller.
   */
  handleRequest(): Promise<void>;
}

/**
 * Every controller must extend from this BaseController in order to delegate some common
 * activities such as parameter validation.
 */
export abstract class BaseController<TDataStore> implements IController {
  protected readonly req: Request;
  protected readonly res: Response;
  protected readonly dataStore?: TDataStore;
  protected readonly cu: ICurrentUser;
  private hasSentResponse: boolean;

  constructor(args: IConstructorArgs<TDataStore>) {
    this.req = args.req;
    this.res = args.res;
    this.dataStore = args.dataStore;
    this.cu = args.cu;
    this.hasSentResponse = false;
  }

  /**
   * Handles the current request with the appropriate method handler.
   */
  public async handleRequest(): Promise<void> {
    const method = this.req.method as THttpMethod;
    const schema = this.permittedParams(method);
    const reqData = this.getRequestData(method);
    try {
      await schema.validateAsync(reqData);
    } catch (err) {
      console.log(`Invalid parameters for ${this.reqToString}!`);
      console.error(err);
      return this.notAcceptable();
    }
    try {
      await this.handleRequestImpl(method, reqData);
    } catch (err) {
      console.log(
        `An error ocurred while handling request ${this.reqToString()}`
      );
      console.log(err);
      if (!this.hasSentResponse) {
        this.serverError();
      }
    }
  }

  // ============================ ABSTRACT METHODS =================================

  /**
   * Implement this method to return a Joi schema that describes which params
   * are permitted based on the HTTP Verb.
   *
   * @example
   * ```
   * protected permittedParams(method: THttpMethod) {
   *  if (method === "GET") {
   *    return Joi.object().keys({
   *      username: Joi.string(),
   *      email: Joi.string(),
   *    })
   *  }
   * }
   * ```
   */
  protected abstract permittedParams(method: THttpMethod): Joi.Schema;

  /**
   * Implement this method to handle the current request based on the HTTP method
   * and the params received.
   * @param method
   * @param paramsData
   *
   * @example
   * ```
   * protected handleRequestImpl(method: THttpMethod, data: any) {
   *  if (method === 'GET') {
   *    console.log("I'm a GET request!");
   *    // Do some stuff with the _data_ I received...
   *    // Sends a 200 response
   *    this.ok({ success: true, users: userData }, 'Successfull request!');
   *  }
   * }
   * ```
   */
  protected abstract handleRequestImpl(
    method: THttpMethod,
    paramsData: any
  ): Promise<void>;

  // ========================= PROTECTED METHODS =============================
  /**
   * Sends a 500 response with an empty json response.
   */
  protected serverError(): void {
    this.sendResponse(500, "Server error", {});
  }

  /**
   * Sends a 200 success response with _json_ as its response body.
   * @param json The response body
   * @param msg The status message
   */
  protected ok(json: any, msg: string = "Success"): void {
    this.sendResponse(200, msg, json);
  }

  // ========================== PRIVATE INTERFACE ============================

  /**
   * Fetches the data from the request. To force conventions, data sent with a
   * GET request must be through query params and for every other method it must
   * be sent in the request body.
   * @param method
   */
  private getRequestData(method: THttpMethod) {
    switch (method) {
      case "GET":
        return this.req.query;
      case "POST":
      case "PUT":
      case "DELETE":
        return this.req.body;
    }
  }

  /**
   * Sends back a response with the corresponding params. Throws an error
   * if more than one response is attempted to be sent.
   * @param code Status code for the response
   * @param msg Message set in the response's status message
   * @param jsonData Json data to send with the response.
   */
  private sendResponse(code: number, msg: string, jsonData: any) {
    if (this.hasSentResponse) {
      throw new Error("Trying to send a response but one was already sent!");
    }
    this.hasSentResponse = true;
    this.res.statusMessage = msg;
    this.res.status(code).json(jsonData);
  }

  private reqToString(): string {
    return `${this.req.method} ${this.req.url}`;
  }

  private notAcceptable(): void {
    this.sendResponse(406, "Invalid params", {});
  }
}
