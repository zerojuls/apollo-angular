import {HttpParams} from '@angular/common/http';

import {Body} from './types';

export const normalizeUrl = (url: string): string =>
  url.replace(/^\/|\/$/g, '');

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
