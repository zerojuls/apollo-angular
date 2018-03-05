import {ApolloLink, Operation, Observable, NextLink} from 'apollo-link';
import {ExecutionResult} from 'graphql';

import {ZoneHandler} from './types';

export const withZone = (zoneHandler?: ZoneHandler): ApolloLink => {
  return new ApolloLink((operation: Operation, forward: NextLink) => {
    if (zoneHandler && !zoneHandler(operation)) {
      return forward(operation);
    }

    return new Observable(observer => {
      let sub: any;

      sub = forward(operation).subscribe({
        next: result => {
          Zone.current.run(() => {
            observer.next(result);
          });
        },
        error: err => {
          Zone.current.run(() => {
            observer.error(err);
          });
        },
        complete: () => {
          Zone.current.run(() => {
            observer.complete.bind(observer);
          });
        },
      });

      return () => {
        if (sub) {
          sub.unsubscribe();
        }
      };
    });
  });
};

export class ZoneLink extends ApolloLink {
  private link: ApolloLink;

  constructor(zoneHandler?: ZoneHandler) {
    super();
    this.link = withZone(zoneHandler);
  }

  public request(
    operation: Operation,
    forward: NextLink,
  ): Observable<ExecutionResult> | null {
    return this.link.request(operation, forward);
  }
}
