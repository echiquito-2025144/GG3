import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth.service';
import { FinanzasService } from '../../../../core/services/finanzas.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private finanzasService = inject(FinanzasService);

  usuario: any = null;
  monedaSeleccionada: string = 'GTQ';
  porcentajeAhorroMeta: number = 5;

  ngOnInit(): void {
    this.usuario = this.authService.obtenerUsuario();

    // Carga los valores almacenados previamente
    const monedaActual = this.finanzasService.obtenerMonedaActual();
    this.monedaSeleccionada = monedaActual === '$' ? 'USD' : 'GTQ';
    this.porcentajeAhorroMeta = this.finanzasService.obtenerPorcentajeAhorroActual();
  }

  guardarPreferencias(): void {
    this.finanzasService.actualizarPreferencias(this.monedaSeleccionada, this.porcentajeAhorroMeta);

    Swal.fire({
      title: 'Configuración guardada',
      text: 'Tus preferencias han sido actualizadas correctamente.',
      icon: 'success',
      confirmButtonColor: '#0B192C',
      width: '380px'
    });
  }

  limpiarDatosMes(): void {
    Swal.fire({
      title: '¿Reiniciar datos del mes?',
      text: 'Esta acción limpiará tus ingresos y lista de gastos actuales.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0B192C',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.finanzasService.actualizarIngreso(0);
        this.finanzasService.actualizarListaGastos([]);
        
        Swal.fire({
          title: 'Reiniciado',
          text: 'Se han limpiado los registros del mes actual.',
          icon: 'success',
          confirmButtonColor: '#0B192C'
        });
      }
    });
  }
}