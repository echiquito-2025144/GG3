import { Component, OnInit, inject, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private authService = inject(AuthService);

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      // Si el usuario recarga la página (F5) y hay token, se inicia el temporizador de inactividad
      this.authService.reiniciarTemporizadorInactividad();
    }
  }

  // Detecta cualquier interacción del usuario en la ventana del navegador 
  // y reinicia los 2 minutos de tolerancia por inactividad.
  @HostListener('window:mousemove')
  @HostListener('window:keydown')
  @HostListener('window:click')
  @HostListener('window:scroll')
  resetearInactividad() {
    this.authService.reiniciarTemporizadorInactividad();
  }
}