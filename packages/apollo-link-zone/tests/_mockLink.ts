import {ApolloLink, Operation, NextLink, Observable} from 'apollo-link';
import {ExecutionResult} from 'graphql';

interface MockedOperation {
  operationName: string;
  result: ExecutionResult;
}

export const withMock = (mockedOperations: MockedOperation[]): ApolloLink => {
  return new ApolloLink((operation: Operation, forward: NextLink) => {
    return new Observable(observer => {
      let sub: any;

      const found = mockedOperations.find(
        op => op.operationName === operation.operationName,
      );

      if (found) {
        const {data, errors} = found.result;

        if (errors) {
          observer.error(errors);
        } else if (data) {
          console.log('next');
          observer.next(found.result);
        } else {
          throw new Error('Something wrong');
        }
      } else {
        throw new Error('Not found');
      }

      return () => {
        if (sub) {
          sub.unsubscribe();
        }
      };
    });
  });
};
