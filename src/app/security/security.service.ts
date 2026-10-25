import { Injectable, InjectionToken, OnInit } from "@angular/core";
import { filter, first, map } from "rxjs/operators";
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Principal } from './data';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { User } from '../model/user';

export const SECURITY_SERVICE = new InjectionToken<SecurityService>("SecurityService")

export interface SecurityService {

  authenticate(principal: Principal): Observable<Principal>;

  clear(): Observable<boolean>;

  current(): Observable<Principal | null>;

  observe(): Observable<Principal | null>;

}

@Injectable()
export class SecurityServiceImpl implements SecurityService {

  private readonly principal$: Subject<Principal | null | undefined> = new BehaviorSubject<Principal | null | undefined>(undefined);

  authenticate(principal: Principal): Observable<Principal> {
    this.principal$.next(principal);
    return of(principal);
  }

  current(): Observable<Principal | null> {
    return this.observe()
      .pipe(first());
  }

  clear(): Observable<boolean> {
    this.principal$.next(null);
    return of(true);
  }

  observe(): Observable<Principal | null> {
    return this.principal$
      .pipe(filter(it => it !== undefined));
  }
}
