import { Component, OnInit } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Observable, firstValueFrom} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {AsyncPipe,CommonModule, NgFor, NgIf} from '@angular/common';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { MatGridListModule } from '@angular/material/grid-list';

interface Producto {
  id: number;
  nombre: string;
  stock: number;
  precio_coste: number;
  precioVenta: number;
  cantidad: number;
}

@Component({
  selector: 'app-infoscan',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatGridListModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  templateUrl: './infoscan.component.html',
  styleUrl: './infoscan.component.css'
})

export class InfoscanComponent implements OnInit {

  listaproductos: Producto[] = [];
  filteredProductos: Producto[] = [];

  miform = new FormControl('');
  
  filteredOptions!: Observable<Producto[]>;

  selectedProducto: Producto | null = null;

  productos:any[]=[];

  subTotal!: any;

  constructor(private http: HttpClient,
    private authService:AuthService,
    private _snackBar: MatSnackBar
  ){}

  ngOnInit() {
    this.fetchListaProductos();
    this.loadCarrito();
    this.productos = this.getProducto();
  }

  fetchListaProductos(): void {
    this.authService.getWithToken<Producto[]>('establecimientos/productos').subscribe({
      next: (data: Producto[]) => {
        this.listaproductos = data;
        this.filteredProductos = data.filter(producto => producto.stock > 0);
        this.filteredOptions = this.miform.valueChanges.pipe(
          startWith(''),
          map(value => this._filter(value || '')),
        );
      },
      error: (error) => {
        console.error('Error fetching productos:', error);
      }
    });
  }

  private _filter(value: string): Producto[] {
    const filterValue = value.toLowerCase();
    this.filteredProductos = this.listaproductos.filter(producto =>
      producto.nombre.toLowerCase().includes(filterValue) ||
      producto.id.toString().includes(filterValue)
    ).filter(producto => producto.stock > 0);
    return this.filteredProductos;
  }

  onOptionSelected(event: any): void {
    const seleccionado = event.option.value;
    this.selectedProducto = this.listaproductos.find(producto => (producto.id === seleccionado)||(producto.nombre === seleccionado)) || null;
  }

  //Funciones carrito

  getProducto(){
    return this.productos;
  }

  saveCarrito(){
    localStorage.setItem('carrito_compra',JSON.stringify(this.productos))
  }

  addProducto(producto: any){
    const index = this.productos.findIndex((p) => p.id === producto.id);
    if (index > -1) {
      this.productos[index].cantidad += 1;
    } else {
      producto.cantidad = 1;
      this.productos.push(producto);
    }
    this.saveCarrito();
    this.updateSubTotal();
  }

  updateSubTotal() {
    this.subTotal = this.productos.reduce((total, producto) => total + producto.precio_venta * producto.cantidad, 0);
  }

  updateCantidad(producto: Producto, cantidad: number) {
    const index = this.productos.findIndex((p) => p.id === producto.id);
    if (index > -1) {
      this.productos[index].cantidad = cantidad;
      if (this.productos[index].cantidad <= 0) {
        this.deleteProductoCarrito(producto);
      } else {
        this.saveCarrito();
        this.updateSubTotal();
      }
    }
  }

  loadCarrito(){
    this.productos = JSON.parse(localStorage.getItem('carrito_compra') as any) || [];
  }

  productoCarrito(producto:any){
    return this.productos.findIndex((x:any)=> x.id === producto.id) > -1;
  }
  
  deleteProductoCarrito(producto:any){
    const index = this.productos.findIndex((x:any)=> x.id === producto.id);

    if(index > -1){
      this.productos.splice(index,1);
      this.saveCarrito()
    }
  }

  clearCarrito(){
    localStorage.removeItem("carrito_compra");
    this.productos = [];
    this.updateSubTotal();
  }

  total(): number {
    return this.productos.reduce((total, producto) => {
      return total + (producto.precioVenta * producto.cantidad);
    }, 0);
  }

  prepareCompraData(): any[] {
    return this.productos.map(producto => ({
      productoEstablecimientoId: producto.id,
      cantidad: producto.cantidad
    }));
  }

  async realizarCompra(): Promise<void> {
    const compraData = this.prepareCompraData();
    const apiUrl = `establecimientos/ventas`;
    const comprasFallidas: Producto[] = [];
    let comprasExitosas = 0;
  
    for (const item of compraData) {
      try {
        await firstValueFrom(this.authService.postWithToken(apiUrl, [item]));
        comprasExitosas++;
      } catch (error: any) {
        const productoFallido = this.productos.find(p => p.id === item.productoEstablecimientoId);
        if (productoFallido) {
          this._snackBar.open(`Quedan ${productoFallido.stock} unidades de ${productoFallido.nombre}`, "OK", { duration: 2000 });
          await new Promise(resolve => setTimeout(resolve, 2000));
          comprasFallidas.push(productoFallido);
        }
      }
    }
  
    if (comprasExitosas > 0) {
      this._snackBar.open(`${comprasExitosas} compras realizadas con éxito`, "OK", { duration: 2000 });
    }
  
    this.productos = comprasFallidas;
    this.saveCarrito();
    this.updateSubTotal();
  }
}
