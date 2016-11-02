import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Apollo, ApolloQueryObservable, graphql } from 'apollo-angular';
import { ApolloQueryResult } from 'apollo-client';
import { Subject } from 'rxjs/Subject';

// We need this to parse graphql string
import gql from 'graphql-tag';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

interface User {
  firstName: string;
  lastName: string;
  emails: {
    address: string,
    verified: boolean
  }[];
}

interface GetUsersQueryResult {
  users: User[];
}

interface AddUserMutationResult {
  addUser: User;
}

export const getUsersQuery = gql`
  query getUsers($name: String) {
    users(name: $name) {
      firstName
      lastName
      emails {
        address
        verified
      }
    }
  }
`;

export const getUsersQueryEmpty = gql`
  query getUsers {
    users(name: "") {
      firstName
      lastName
      emails {
        address
        verified
      }
    }
  }
`;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
@graphql([{
  name: 'emptyUsers',
  query: getUsersQueryEmpty
}])
export class AppComponent implements OnInit, AfterViewInit {
  // Observable with GraphQL result
  public users: ApolloQueryObservable<GetUsersQueryResult>;
  public emptyUsers: ApolloQueryObservable<GetUsersQueryResult>;
  public firstName: string;
  public lastName: string;
  public nameControl = new FormControl();
  // Observable variable of the graphql query
  public nameFilter: Subject<string> = new Subject<string>();
  private apollo: Apollo;

  // Inject Apollo service
  constructor(apollo: Apollo) {
    console.log('apollo', apollo);
    this.apollo = apollo;
  }

  public ngOnInit() {
    // Query users data with observable variables
    this.users = this.apollo.watchQuery<GetUsersQueryResult>({
      query: getUsersQuery,
      variables: {
        name: this.nameFilter,
      },
    })
      // Return only users, not the whole ApolloQueryResult
      .map(result => result.data.users) as any;

    // Add debounce time to wait 300 ms for a new change instead of keep hitting the server
    this.nameControl.valueChanges.debounceTime(300).subscribe(name => {
      this.nameFilter.next(name);
    });
  }

  public ngAfterViewInit() {
    // Set nameFilter to null after NgOnInit happend and the view has been initated
    this.nameFilter.next(null);
  }

  public newUser(firstName: string) {
    // Call the mutation called addUser
    this.apollo.mutate<AddUserMutationResult>({
      mutation: gql`
        mutation addUser(
          $firstName: String!
          $lastName: String!
        ) {
          addUser(
            firstName: $firstName
            lastName: $lastName
          ) {
            firstName
            lastName,
            emails {
              address
              verified
            }
          }
        }
      `,
      variables: {
        firstName,
        lastName: this.lastName,
      },
    })
      .toPromise()
      .then(({ data }) => {
        console.log('got a new user', data.addUser);

        // get new data
        this.users.refetch();
      })
      .catch((errors: any) => {
        console.log('there was an error sending the query', errors);
      });
  }
}
