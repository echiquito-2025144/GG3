import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, of } from 'rxjs';
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

  constructor() {
    const token = this.obtenerToken();
    if (token) {
      this.iniciarTemporizadorExpiracion(token);
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
    
    // Notifica cambio de usuario al servicio de finanzas
    this.finanzasService.cargarDatosUsuario();
    this.iniciarTemporizadorExpiracion(token, usuario);
  }

  private limpiarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    
    if (this.timerExpiracion) {
      clearTimeout(this.timerExpiracion);
      this.timerExpiracion = null;
    }

    this.finanzasService.cargarDatosUsuario();
  }

  obtenerUsuario(): any {
    const usuarioStr = localStorage.getItem('usuario');
    return usuarioStr ? JSON.parse(usuarioStr) : null;
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }

  private logoutPorExpiracion(): void {
    this.limpiarSesion();

    Swal.fire({
      title: 'Sesión Expirada',
      text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
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

  iniciarTemporizadorExpiracion(token: string, usuarioParam?: any): void {
    try {
      if (this.timerExpiracion) clearTimeout(this.timerExpiracion);

      const usuario = usuarioParam || this.obtenerUsuario();
      const payload = this.decodificarJwtPayload(token);
      
      const esGoogle = usuario?.metodo === 'google' || payload?.iss?.includes('google');
      let tiempoRestanteMs = 0;

      if (esGoogle) {
        tiempoRestanteMs = 2 * 60 * 1000; // 2 minutos exactos para cuentas de Google
      } else {
        if (!payload || !payload.exp) return;
        tiempoRestanteMs = (payload.exp * 1000) - Date.now();
      }

      if (tiempoRestanteMs > 0) {
        const maxDelay = 2147483647;
        const delay = Math.min(tiempoRestanteMs, maxDelay);

        this.timerExpiracion = setTimeout(() => {
          this.logoutPorExpiracion();
        }, delay);
      } else {
        this.logoutPorExpiracion();
      }
    } catch (error) {
      console.error('Error al procesar el token expirado:', error);
      this.logoutPorExpiracion();
    }
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
}