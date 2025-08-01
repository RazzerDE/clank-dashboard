import {Component, Input} from '@angular/core';
import {NgClass} from "@angular/common";

@Component({
  selector: 'page-thumb',
  imports: [
    NgClass
  ],
  templateUrl: './page-thumb.component.html',
  styleUrl: './page-thumb.component.scss'
})
export class PageThumbComponent {
  @Input() subtitle: string = '';
  @Input() title: string = '';
  @Input() desc: string = '';

  @Input() size: 'less' | 'normal' = 'normal';
  @Input() color: 'red' | 'red-bright' | 'yellow' | 'blue' | 'green' | 'purple' | 'rosa' | 'cyan' | 'orange' |
                  'red-yellow' | 'red-pink' | 'orange-red' | 'green-yellow' = 'yellow';

}
