import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondaryChat } from './secondary-chat';

describe('SecondaryChat', () => {
  let component: SecondaryChat;
  let fixture: ComponentFixture<SecondaryChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecondaryChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecondaryChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
