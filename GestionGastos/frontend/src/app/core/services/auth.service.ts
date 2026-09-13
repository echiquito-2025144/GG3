import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, of } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/api/auth';
  private timerExpiracion: any;

  constructor() {
    // Al recargar la aplicación, restaurar el temporizador si ya hay un token guardado
    const token = this.obtenerToken();
    if (token) {
      this.iniciarTemporizadorExpiracion(token);
    }
  }

  // 1. Método Login Local
  login(email: string, passwordPlana: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password: passwordPlana }).pipe(
      tap((res: any) => {
        if (res && res.token) {
          this.guardarSesion(res.token, res.usuario);
        }
      })
    );
  }

  // 2. Método Login / Registro con Google
  loginConGoogle(googleToken: string): Observable<any> {
    /* 
       OPCIÓN A: Cuando conectes tu backend Node/Express, descomenta la siguiente petición HTTP:
       
       return this.http.post<any>(`${this.apiUrl}/google`, { token: googleToken }).pipe(
         tap((res: any) => {
           if (res && res.token) {
             this.guardarSesion(res.token, res.usuario);
           }
         })
       );
    */

    // OPCIÓN B (Modo Cliente / Temporal sin backend):
    // Decodificamos el JWT directamente para estructurar el objeto usuario y aprovechar el timer de expiración de Google
    const usuarioGooglePayload = this.decodificarJwtPayload(googleToken);

    const usuario = {
      nombre: usuarioGooglePayload?.name || 'Usuario Google',
      email: usuarioGooglePayload?.email || '',
      foto: usuarioGooglePayload?.picture || '',
      metodo: 'google'
    };

    // Usamos el token de Google como token de sesión en el cliente
    this.guardarSesion(googleToken, usuario);

    return of({ success: true, token: googleToken, usuario });
  }

  // 3. Método Registro Local
  registro(nombre: string, email: string, passwordPlana: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, { nombre, email, password: passwordPlana }).pipe(
      tap((res: any) => {
        if (res && res.token) {
          this.guardarSesion(res.token, res.usuario);
        }
      })
    );
  }

  // 4. Guardar sesión y activar temporizador de expiración
  guardarSesion(token: string, usuario: any): void {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.iniciarTemporizadorExpiracion(token);
  }

  // 5. Temporizador automático al vencer el JWT (sirve tanto para tu backend como para los JWT de Google)
  iniciarTemporizadorExpiracion(token: string): void {
    try {
      const payload = this.decodificarJwtPayload(token);
      if (!payload || !payload.exp) return;

      const tiempoRestanteMs = (payload.exp * 1000) - Date.now();

      if (this.timerExpiracion) clearTimeout(this.timerExpiracion);

      if (tiempoRestanteMs > 0) {
        console.log(`⏰ Sesión programada para expirar en ${Math.round(tiempoRestanteMs / 1000)}s.`);
        
        // Evitar desbordamiento de setTimeout (máximo ~24.8 días)
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

  // 6. Obtener usuario guardado
  obtenerUsuario(): any {
    const usuarioStr = localStorage.getItem('usuario');
    return usuarioStr ? JSON.parse(usuarioStr) : null;
  }

  // 7. Obtener token
  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  // 8. Cierre de sesión manual
  logout(): void {
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }

  // 9. Cierre de sesión por expiración con Modal Personalizado
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

  // Helper privado para decodificar la carga útil del JWT (soporte UTF-8)
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

  // Helper privado para evitar duplicidad al borrar la sesión
  private limpiarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    if (this.timerExpiracion) {
      clearTimeout(this.timerExpiracion);
      this.timerExpiracion = null;
    }
  }
}