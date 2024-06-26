import { Component,OnInit,ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient,HttpClientModule, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditarProComponent } from './editar-pro/editar-pro.component';
import { SubirProComponent } from './subir-pro/subir-pro.component';
import { BorrarProComponent } from './borrar-pro/borrar-pro.component';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface Producto {
  id: number;
  nombre: string;
  stock: number;
  precioCoste: number;
  precioVenta: number;
  proveedor: {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
  };
} 

@Component({
  selector: 'app-productos-pro',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatInputModule,
    HttpClientModule,
    EditarProComponent,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {

  columnas: string[] = ['id', 'nombre', 'stock', 'precioCoste', 'precioVenta','acciones'];
  productos: Producto[] = [];
  filteredProductos: Producto[] = [];
  datos: MatTableDataSource<Producto> = new MatTableDataSource<Producto>([]);
  role:string = "";
  id:string = "";
  authUrl:string | null = "";

  filteredOptions!: Observable<Producto[]>;
  searchControl = new FormControl();
  
  constructor(
    private http: HttpClient,
    public dialog: MatDialog,
    private authService:AuthService,
    private _snackBar: MatSnackBar,
    private router: Router
  ){}

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  archivoSeleccionado: any = null;

  ngOnInit(): void {
    this.authUrl = this.authService.getAuthUrl();
    
    this.authService.getRol().subscribe({
      next: (role) => {
        this.role = role;
        if (this.role === 'PROVEEDOR') {
          this.columnas = ['id', 'nombre', 'stock', 'precioVenta', 'acciones'];
        }
        this.fetchListaProductos();
      }
    });

    this.searchControl.valueChanges.subscribe(value => {
      this.filtrarBusqueda(value);
    });
  }

  fetchListaProductos(): void {
    let url = "";
    if(this.role=="ESTABLECIMIENTO"){
      url = 'establecimientos/productos';
    }else{
      url = 'proveedores/productos';
    }
    this.authService.getWithToken<Producto[]>(url).subscribe({
      next:(productos: Producto[]) => {
        this.productos = productos;
        this.datos.data = this.productos;
        this.datos.paginator = this.paginator;
        this.datos.sort = this.sort;
      },
      error:(error) => {
        console.error('Error fetching productos:', error);
      }
      
    });
  }
  
  iniciarPaginator(): void {
    setTimeout(() => {
      this.datos = new MatTableDataSource(this.productos);
      this.datos.paginator = this.paginator;
      this.datos.sort = this.sort!;
    });
  }

  filtrarBusqueda(filterValue: string): void {
    this.datos.filter = filterValue.trim().toLowerCase();
  }


  subirProductos(): void {
    const dialogRef = this.dialog.open(SubirProComponent, {
      width: '400px',
      data: { id: this.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.archivoSeleccionado = result;
        this.fetchListaProductos();
      }
    });
  }

  editarProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(EditarProComponent, {
      width: '400px',
      data: { producto, role: this.role }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.productos.findIndex(p => p.id === result.id);
        if (index > -1) {
          this.productos[index] = result;
          this.datos.data = [...this.productos];
          this.iniciarPaginator();
          this._snackBar.open(`Producto actualizado`, "OK", { duration: 3000 });
        }
      }
    });
  }

  eliminarProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(BorrarProComponent, {
      width: '400px',
      data: { message: `¿Está seguro de que desea eliminar el producto ${producto.nombre}?`, role: this.role, producto }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._snackBar.open(`Producto ${producto.nombre} eliminado`, 'OK',{ duration: 3000 });
        this.fetchListaProductos();
      }
    });
  }

  getProveedorLink(producto: Producto): string {
    return `../Proveedores/${producto?.proveedor?.id}`;
  }

  isStockZero(producto: Producto): boolean {
    return producto.stock === 0;
  }
}
