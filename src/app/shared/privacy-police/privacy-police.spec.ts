import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyPolice } from './privacy-police';

describe('PrivacyPolice', () => {
  let component: PrivacyPolice;
  let fixture: ComponentFixture<PrivacyPolice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPolice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivacyPolice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
