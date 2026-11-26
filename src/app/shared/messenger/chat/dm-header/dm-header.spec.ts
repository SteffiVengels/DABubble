import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DmHeader } from './dm-header';

describe('DmHeader', () => {
  let component: DmHeader;
  let fixture: ComponentFixture<DmHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DmHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DmHeader);
    component = fixture.componentInstance;
    /** user = Pflicht-Input, im Test ein Beispiel-User */
    fixture.componentRef.setInput('user', {
      id: 'u1', created_at: new Date().toISOString(), name: 'Test', email: 'test@test.de', privacy_policy: true, avatar: '',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
