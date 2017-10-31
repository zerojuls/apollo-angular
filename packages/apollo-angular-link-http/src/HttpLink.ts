import {Injectable} from '@angular/core';
import {HttpClient, HttpResponse, HttpHeaders} from '@angular/common/http';
import {
  ApolloLink,
  Observable as LinkObservable,
  RequestHandler,
  Operation,
} from 'apollo-link';
import {print} from 'graphql/language/printer';
import {ExecutionResult} from 'graphql';
import {Observable} from 'rxjs/Observable';

import {Options, Request, Context} from './types';
import {normalizeUrl, bodyToParams} from './utils';

// XXX find a better name for it
export class HttpLinkHandler extends ApolloLink {
  public requester: RequestHandler;
  private options: Options;

  constructor(httpClient: HttpClient, options: Options) {
    super();

    this.options = options;

    this.requester = new ApolloLink(
      (operation: Operation) =>
        new LinkObservable((observer: any) => {
          const context: Context = operation.getContext();

          const req: Request = {
            method: this.options.method || 'POST',
            url: normalizeUrl(this.options.uri) || 'graphql',
            body: {
              operationName: operation.operationName,
              variables: operation.variables,
              query: print(operation.query),
            },
            options: {
              withCredentials: this.options.withCredentials,
            },
          };

          // allow for sending extensions
          if (this.options.includeExtensions) {
            req.body.extensions = operation.extensions;
          }

          // Apply settings from request's context

          // overwrite withCredentials
          if (typeof context.withCredentials !== 'undefined') {
            req.options.withCredentials = context.withCredentials;
          }
          // merge headers
          if (context.headers) {
            req.options.headers = new HttpHeaders({
              ...this.options.headers,
              ...context.headers,
            });
          } else {
            req.options.headers = new HttpHeaders(this.options.headers);
          }
          // overwrite method
          if (context.method) {
            req.method = context.method;
          }

          // `body` for some, `params` for others
          const useBody = ['POST', 'PUT', 'PATCH'].includes(
            req.method.toUpperCase(),
          );
          let bodyOrParams = {};

          if (useBody) {
            bodyOrParams = {
              body: req.body,
            };
          } else {
            const params = bodyToParams(req.body);

            bodyOrParams = {params};
          }

          // create a request
          const obs: Observable<HttpResponse<Object>> = httpClient.request<
            Object
          >(req.method, req.url, {
            observe: 'response',
            responseType: 'json',
            reportProgress: false,
            ...bodyOrParams,
            ...req.options,
          });

          const sub = obs.subscribe({
            next: result => observer.next(result.body),
            error: err => observer.error(err),
            complete: () => observer.complete(),
          });

          return () => {
            if (!sub.closed) {
              sub.unsubscribe();
            }
          };
        }),
    ).request;
  }

  public request(op: Operation): LinkObservable<ExecutionResult> | null {
    return this.requester(op);
  }
}

@Injectable()
export class HttpLink {
  constructor(private httpClient: HttpClient) {}

  public create(options: Options): HttpLinkHandler {
    return new HttpLinkHandler(this.httpClient, options);
  }
}
