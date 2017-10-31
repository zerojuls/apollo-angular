import {HttpHeaders, HttpParams} from '@angular/common/http';

import {Body} from './types';

export const normalizeUrl = (url: string): string =>
  url.replace(/^\/|\/$/g, '');

export const mergeHeaders = (
  source: HttpHeaders,
  destination: HttpHeaders,
): HttpHeaders => {
  if (source && destination) {
    const merged = destination
      .keys()
      .reduce(
        (headers, name) => headers.set(name, destination.getAll(name)),
        source,
      );

    return merged;
  }

  return destination || source;
};

export const bodyToParams = (body: Body): HttpParams => {
  const params = new HttpParams()
    .set('query', JSON.stringify(body.query))
    .set('operationName', body.operationName)
    .set('variables', JSON.stringify(body.variables));

  if (body.extensions) {
    return params.set('extensions', JSON.stringify(body.extensions));
  }

  return params;
};
