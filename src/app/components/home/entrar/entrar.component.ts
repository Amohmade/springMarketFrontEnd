import { Component } from '@angular/core';
import { HeaderComponent } from '../../general/header/header.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-entrar',
  standalone: true,
  imports: [
    HeaderComponent,
    RouterOutlet
  ],
  templateUrl: './entrar.component.html',
  styleUrl: './entrar.component.css'
})
export class EntrarComponent {

}
