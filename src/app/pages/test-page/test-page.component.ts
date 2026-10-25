import { Component, Inject, OnDestroy, OnInit, Signal, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollableElement,
  CdkVirtualScrollViewport
} from '@angular/cdk/scrolling';
import { Skeleton } from 'primeng/skeleton';
import { Chat, Message } from '../../model/chat';
import { CHAT_SERVICE, ChatService } from '../../service/chat.service';
import { DatePipe, NgClass } from '@angular/common';
import { Button } from 'primeng/button';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { Textarea } from 'primeng/textarea';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Principal } from '../../security/data';
import { SECURITY_SERVICE, SecurityService } from '../../security/security.service';
import { environment } from '../../../environments/environment';
import { filter, map } from 'rxjs/operators';

const USER_ID = '0196b015-db4c-7c0e-be11-6800924f686f'; // a@a.com
const CHAT_ID = '0196b112-79fb-7de1-b8dc-0632d35988bb';

@Component({
  imports: [
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport,
    CdkVirtualScrollableElement,
    Skeleton,
    NgClass,
    Button,
    InputGroup,
    InputGroupAddon,
    ReactiveFormsModule,
    Textarea,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './test-page.component.html',
  styleUrl: './test-page.component.scss'
})
export class TestPageComponent implements OnInit, OnDestroy {

  readonly principal: Signal<Principal | null | undefined>;

  // chats
  readonly chats = signal<Array<Chat>>([]);
  readonly loading = signal(true);
  readonly hasMore = signal(false);
  private nextToken: string = '';

  // chat
  readonly currentChat: Signal<Chat | undefined>;

  // messages
  readonly messages = signal<Array<Message>>([]);

  // events
  private readonly eventSource;
  private readonly events$ = new Subject<any>();

  constructor(@Inject(CHAT_SERVICE)
              private readonly chatService: ChatService,
              @Inject(SECURITY_SERVICE)
              securityService: SecurityService) {
    console.log("constructor");

    this.principal = toSignal(securityService.current());

    // Chats
    this.doLoadChats();

    // Messages
    this.currentChat = toSignal(this.chatService.details(CHAT_ID));

    this.doLoadMessages(CHAT_ID);

    // Events
    this.events$
      .pipe(
        filter(evt => evt['@type'] == 'ChatCreated'),
        map(evt => Object.assign(new Chat(), evt))
      )
      .subscribe(chat => this.chats
        .update(arr => arr.some(it => it.id === chat.id) ? arr : arr.concat([chat])));

    this.events$
      .pipe(
        filter(evt => evt['@type'] == 'MessagePublished'),
        map(evt => Object.assign(new Message(), evt))
      )
      .subscribe(message => this.messages
        .update(arr => arr.some(it => it.id === message.id) ? arr : arr.concat([message])));

    this.events$
      .pipe(
        filter(evt => evt['@type'] == 'DebugEvent'),
      )
      .subscribe(evt => console.log("tick...", evt));

    // TODO: Move to separated component
    this.eventSource = new EventSource(`${environment.services.notifications}/subscribe?userId=${USER_ID}`);
    this.eventSource.addEventListener('message', evt => {
      evt.preventDefault();
      console.log(`EVENT: ${evt.data}`);
      const data = JSON.parse(evt.data);
      if (Array.isArray(data)) {
        data.forEach((evt: any) => this.events$.next(evt));
      } else {
        console.log("Event data must be array");
      }
    });
    this.eventSource.addEventListener('error', evt => {
      evt.preventDefault();
      console.log('closing EventSource because of error', evt);
      this.eventSource.close();
    });
  }

  // component lifecycle
  ngOnInit(): void {
    console.log("ngOnInit");
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy')
    this.eventSource.close();
  }

  // chats
  trackingChat(index: number, chat: Chat): string | undefined {
    return chat.id;
  }

  loadNextChat() {
    this.doLoadChats(this.nextToken);
  }

  private doLoadChats(token?: string) {
    this.loading.set(true);
    this.chatService.list(token)
      .subscribe({
        next: res => {
          this.chats.update(arr => arr.concat(res.data));
          this.hasMore.update(() => !!res.nextToken);
          this.nextToken = res.nextToken;
        },
        error: err => {
          alert(err);
        },
        complete: () => {
          this.loading.set(false);
        }
      });
  }

  // messages
  trackingMessage(index: number, message: Message) {
    return message.id;
  }

  sendMessage(message: string) {
    this.chatService.sendMessage(CHAT_ID, message)
      .subscribe(it => this.messages.update(arr => arr.concat([it])));
  }

  private doLoadMessages(chatId: string) {
    this.loading.set(true);
    this.chatService.messages(chatId)
      .subscribe({
        next: res => this.messages.update(arr => arr.concat(res.data.reverse())),
        error: err => alert(err)
      });
  }
}
