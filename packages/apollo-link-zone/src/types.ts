import {Operation} from 'apollo-link';

export interface ZoneHandler {
  (operation: Operation): boolean;
}
