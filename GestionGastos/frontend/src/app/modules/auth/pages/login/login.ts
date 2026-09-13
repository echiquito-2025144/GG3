import { Component, inject, OnInit, NgZone, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html', 
  styleUrl: './login.css'        
})
export class LoginComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  @ViewChild('googleBtn') googleBtn!: ElementRef;

  email = '';
  password = '';
  errorMensaje = '';
  
  private clientId = '1027536962632-oe3i9s7m7ilv0776384qet84tua1l4b2.apps.googleusercontent.com';

  ngOnInit(): void {
    this.inicializarGoogle();
  }

  ngAfterViewInit(): void {
    this.renderizarBotonGoogle();
  }

  private inicializarGoogle(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => this.handleGoogleLogin(response)
      });
    }
  }

  private renderizarBotonGoogle(): void {
    if (typeof google !== 'undefined' && this.googleBtn) {
      google.accounts.id.renderButton(
        this.googleBtn.nativeElement,
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular'
        }
      );
    }
  }

  // Manejador del Login con Google integrado con AuthService
  handleGoogleLogin(response: any): void {
    const idToken = response.credential;
    
    if (!idToken) {
      this.ngZone.run(() => {
        this.errorMensaje = 'No se pudo obtener el token de Google.';
      });
      return;
    }

    this.authService.loginConGoogle(idToken).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.errorMensaje = err.error?.message || 'Error al autenticar con la cuenta de Google.';
        });
      }
    });
  }

  // Manejador del Login Local Tradicional
  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMensaje = 'Por favor completa todos los campos.';
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMensaje = err.error?.message || 'Credenciales incorrectas o problema de conexión.';
      }
    });
  }
}