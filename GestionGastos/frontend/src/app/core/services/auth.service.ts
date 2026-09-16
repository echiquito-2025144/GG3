import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';
import Swal from 'sweetalert2';
import { FinanzasService } from './finanzas.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private finanzasService = inject(FinanzasService);

  private apiUrl = 'http://localhost:3000/api/auth';
  private timerExpiracion: any;
  
  private readonly MINUTOS_INACTIVIDAD = 2; 

  // Estado reactivo del usuario
  private usuarioSubject = new BehaviorSubject<any>(this.obtenerUsuarioDeStorage());
  public usuario$ = this.usuarioSubject.asObservable();

  constructor() {
    const token = this.obtenerToken();
    if (token) {
      this.reiniciarTemporizadorInactividad();
    }
  }

  login(email: string, passwordPlana: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password: passwordPlana }).pipe(
      tap((res: any) => {
        if (res && res.token) {
          this.guardarSesion(res.token, res.usuario);
        }
      })
    );
  }

  registro(nombre: string, email: string, passwordPlana: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, { nombre, email, password: passwordPlana }).pipe(
      tap((res: any) => {
        if (res && res.token) {
          this.guardarSesion(res.token, res.usuario);
        }
      })
    );
  }

  loginConGoogle(googleToken: string): Observable<any> {
    const usuarioGooglePayload = this.decodificarJwtPayload(googleToken);

    const usuario = {
      nombre: usuarioGooglePayload?.name || 'Usuario Google',
      email: usuarioGooglePayload?.email || '',
      foto: usuarioGooglePayload?.picture || '',
      metodo: 'google'
    };

    this.guardarSesion(googleToken, usuario);
    return of({ success: true, token: googleToken, usuario });
  }

  guardarSesion(token: string, usuario: any): void {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    
    this.usuarioSubject.next(usuario); // Emite datos a la app
    this.finanzasService.cargarDatosUsuario();
    this.reiniciarTemporizadorInactividad();
  }

  reiniciarTemporizadorInactividad(): void {
    if (!this.obtenerToken()) return;

    if (this.timerExpiracion) {
      clearTimeout(this.timerExpiracion);
    }

    const tiempoMs = this.MINUTOS_INACTIVIDAD * 60 * 1000;
    this.timerExpiracion = setTimeout(() => {
      this.logoutPorExpiracion();
    }, tiempoMs);
  }

  private limpiarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    
    if (this.timerExpiracion) {
      clearTimeout(this.timerExpiracion);
      this.timerExpiracion = null;
    }

    this.usuarioSubject.next(null); // Notifica el cierre de sesión
    this.finanzasService.cargarDatosUsuario();
  }

  private obtenerUsuarioDeStorage(): any {
    const usuarioStr = localStorage.getItem('usuario');
    return usuarioStr ? JSON.parse(usuarioStr) : null;
  }

  obtenerUsuario(): any {
    return this.usuarioSubject.value;
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  actualizarUsuario(usuarioActualizado: any): void {
    localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
    this.usuarioSubject.next(usuarioActualizado); // Emite la foto nueva en tiempo real
  }

  logout(): void {
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }

  private logoutPorExpiracion(): void {
    this.limpiarSesion();

    Swal.fire({
      title: 'Sesión Expirada',
      text: `Tu sesión se ha cerrado por ${this.MINUTOS_INACTIVIDAD} minutos de inactividad.`,
      icon: 'warning',
      width: '380px',
      padding: '1.2em',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#0B192C',
      background: '#ffffff',
      color: '#0B192C',
      heightAuto: false,
      customClass: {
        popup: 'sweet-popup-small',
        title: 'sweet-title-small',
        htmlContainer: 'sweet-text-small'
      }
    }).then(() => {
      this.router.navigate(['/login']);
    });
  }

  private decodificarJwtPayload(token: string): any {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;

      const jsonPayload = decodeURIComponent(
        atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decodificando el JWT:', e);
      return null;
    }
  }

  actualizarFotoPerfil(fotoBase64: string): Observable<any> {
      const usuarioActual = this.obtenerUsuario();

      return this.http.patch<any>(`${this.apiUrl}/perfil/foto`, { 
        email: usuarioActual?.email,
        foto: fotoBase64 
      }).pipe(
        tap((res: any) => {
          // Actualizamos el estado local en localStorage y en el BehaviorSubject
          const usuarioActualizado = { 
            ...usuarioActual, 
            foto: res.usuario?.foto || fotoBase64 
          };
        this.actualizarUsuario(usuarioActualizado);
      })
    );
  }
}