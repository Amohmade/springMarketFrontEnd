import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { jwtDecode } from 'jwt-decode';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, map } from 'rxjs/operators';

interface Usuario {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  contrasena:string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authUrl:string = 'http://localhost:8082';
  private jwtHelper = new JwtHelperService();
  private role:string = "";

  constructor(private http: HttpClient, private router: Router) {
  }

  login(credentials: { correo: string; contrasena: string }): Observable<boolean> {
    return this.http.post<{ token: string }>(`${this.authUrl}/login`, credentials).pipe(
      map(response => {
        localStorage.setItem('token', response.token);
        return true;
      })
    );
  }

  register(credentials: { nombre: string; telefono: string; correo: string; contrasena: string; rol: string }): Observable<boolean> {
    return this.http.post<{ token: string }>(`${this.authUrl}/register`, credentials).pipe(
      map(response => {
        if (response && response.token) {
          localStorage.setItem("token",response.token)
          this.getRol().subscribe({
            next:(data)=> {
              if(data == 'ESTABLECIMIENTO'){
                this.router.navigate(['/Menu']);
              }else if(data == 'PROVEEDOR'){
                this.router.navigate(['/Menu/Productos']);
              }
            }
          });
          return true;
        }
        throw new Error('Unexpected response structure');
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error en la petición, vuelva a intentarlo.';
        if (error.status === 409) {
          errorMessage = 'Ya existe una cuenta con ese correo o teléfono.';
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        console.error('Registration error:', errorMessage, error);
        return throwError(errorMessage);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['Cuenta']);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    return token ? !this.jwtHelper.isTokenExpired(token) : false;
  }

  getDatosUsuario(): Observable<Usuario> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Usuario>(`${this.authUrl}/usuarios/miCuenta`, { headers });
  }
  
  getRol(): Observable<string> {
    return this.getDatosUsuario().pipe(
      map((usuario: Usuario) => usuario.rol)
    );
  }

  getAuthUrl(): string | null {
    return this.authUrl;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const decodedToken: any = jwtDecode(token);
    const currentTime = Date.now() / 1000 + 7200;

    return decodedToken.exp < currentTime;
  }

  getWithToken<T>(endpoint: string, params?: HttpParams): Observable<T> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<T>(`${this.authUrl}/${endpoint}`, { headers, params });
  }

  postWithToken<T>(endpoint: string, body: any): Observable<T> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<T>(`${this.authUrl}/${endpoint}`, body, { headers, responseType: 'text' as 'json' }).pipe(
      catchError((error: any) => {
        let errorMsg = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMsg = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMsg = `Error: ${error.error}`;
        }
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  putWithToken<T>(endpoint: string, body: any): Observable<T> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<T>(`${this.authUrl}/${endpoint}`, body, { headers });
  }

  deleteWithToken<T>(endpoint: string): Observable<T> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.delete<T>(`${this.authUrl}/${endpoint}`, { headers });
  }
}
