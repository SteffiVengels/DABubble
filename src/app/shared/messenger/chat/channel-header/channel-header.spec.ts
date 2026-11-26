import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelHeader } from './channel-header';

describe('ChannelHeader', () => {
  let component: ChannelHeader;
  let fixture: ComponentFixture<ChannelHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelHeader);
    component = fixture.componentInstance;
    /** channel = Pflicht-Input, im Test ein Beispiel-Channel */
    fixture.componentRef.setInput('channel', {
      id: 1, created_at: new Date().toISOString(), name: 'Test', description: null,
      created_by: 'u1', memberIds: ['u1'],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
