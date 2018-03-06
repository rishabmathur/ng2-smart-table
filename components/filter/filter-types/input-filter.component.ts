import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/skip';

import { DefaultFilter } from './default-filter';

@Component({
  selector: 'input-filter',
  template: `
    <input [(ngModel)]="query"
           [ngClass]="inputClass"
           [formControl]="inputControl"
           (keydown.enter)="OnEnterSetFilter($event)"
           class="form-control"
           type="text"
           placeholder="{{ column.title }}" />
  `,
})
export class InputFilterComponent extends DefaultFilter implements OnInit {

  inputControl = new FormControl();

  constructor() {
    super();
  }

  ngOnInit() {
    // this.inputControl.valueChanges
    //   .skip(1)
    //   .distinctUntilChanged()
    //   .debounceTime(1000)
    //   .subscribe((value: string) => this.setFilter());
  }

  OnEnterSetFilter(event:any) {
     this.setFilter();
  }
}
