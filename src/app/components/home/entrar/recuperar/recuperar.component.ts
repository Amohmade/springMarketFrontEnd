import { Component } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import { FormGroup,FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [MatCardModule,MatFormFieldModule,ReactiveFormsModule,MatInputModule,MatIconModule,MatButtonModule,RouterModule],
  templateUrl: './recuperar.component.html',
  styleUrl: './recuperar.component.css'
})
export class RecuperarComponent {
  recuperarForm = new FormGroup({
    datoRecuperar: new FormControl<string>('',[
      // Validators.minLength(3),
      // Validators.required
    ])
  });
  enviar(){
    console.log(this.recuperarForm.value);
  }
}