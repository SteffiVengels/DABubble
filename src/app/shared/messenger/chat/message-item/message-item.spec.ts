import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageItem } from './message-item';
import { MessageListState } from '../message-list/message-list-state';

describe('MessageItem', () => {
  let component: MessageItem;
  let fixture: ComponentFixture<MessageItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageItem],
      /** MessageItem braucht den State, den sonst MessageList bereitstellt */
      providers: [MessageListState]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageItem);
    component = fixture.componentInstance;
    /** message = Pflicht-Input, im Test eine Beispiel-Nachricht */
    fixture.componentRef.setInput('message', {
      id: 1, created_at: new Date().toISOString(), sender_id: 'u1', content: 'Hallo',
      channel_id: 1, conversation_id: null, parent_id: null,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
