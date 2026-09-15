import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FinanzasService, RegistroHistorial } from '../../../../core/services/finanzas.service';
import { AuthService } from '../../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css'
})
export class HistorialComponent implements OnInit {
  private finanzasService = inject(FinanzasService);
  private authService = inject(AuthService);
  private router = inject(Router);

  historial: RegistroHistorial[] = [];
  usuario: any = null;

  ngOnInit(): void {
    this.usuario = this.authService.obtenerUsuario();

    this.finanzasService.historial$.subscribe({
      next: (data) => {
        this.historial = data;
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  eliminarRegistro(id: string): void {
    Swal.fire({
      title: '¿Eliminar registro?',
      text: 'Esta acción borrará el registro de este día en el historial.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0B192C',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.finanzasService.eliminarRegistroHistorial(id);
        Swal.fire('Eliminado', 'El registro ha sido eliminado del historial.', 'success');
      }
    });
  }
}