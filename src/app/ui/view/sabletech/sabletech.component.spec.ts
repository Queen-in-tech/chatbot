import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SabletechComponent } from './sabletech.component';

describe('SabletechComponent', () => {
  let component: SabletechComponent;
  let fixture: ComponentFixture<SabletechComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SabletechComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SabletechComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
