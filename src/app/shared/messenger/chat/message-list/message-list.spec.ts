import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageList } from './message-list';

describe('MessageList', () => {
  let component: MessageList;
  let fixture: ComponentFixture<MessageList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageList);
    component = fixture.componentInstance;
    /** messages = Pflicht-Input, im Test eine leere Liste */
    fixture.componentRef.setInput('messages', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
