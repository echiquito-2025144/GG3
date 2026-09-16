import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);

  usuario: any = null;
  fotoPreview: string | null = null;

  // Propiedades requeridas por la plantilla
  monedaSeleccionada: string = 'GTQ';
  porcentajeAhorroMeta: number = 10;

  ngOnInit(): void {
    this.usuario = this.authService.obtenerUsuario() || {};
    this.fotoPreview = this.usuario?.foto || null;
    
    // Cargar preferencias guardadas si existen
    const configuracion = JSON.parse(localStorage.getItem('config_finanzas') || '{}');
    if (configuracion.moneda) this.monedaSeleccionada = configuracion.moneda;
    if (configuracion.ahorro) this.porcentajeAhorroMeta = configuracion.ahorro;
  }

  onFotoSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          title: 'Imagen muy grande',
          text: 'Por favor, selecciona una imagen menor a 2MB.',
          icon: 'warning',
          confirmButtonColor: '#0B192C'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPreview = reader.result as string;
        if (this.usuario) {
          this.usuario.foto = this.fotoPreview;
          this.authService.actualizarUsuario(this.usuario);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Métodos requeridos por la plantilla
  guardarPreferencias(): void {
    const config = {
      moneda: this.monedaSeleccionada,
      ahorro: this.porcentajeAhorroMeta
    };
    localStorage.setItem('config_finanzas', JSON.stringify(config));

    Swal.fire({
      title: 'Configuración guardada',
      text: 'Se han actualizado tus preferencias financieras.',
      icon: 'success',
      confirmButtonColor: '#0B192C'
    });
  }

  limpiarDatosMes(): void {
    Swal.fire({
      title: '¿Reiniciar el mes actual?',
      text: 'Se eliminarán los registros de ingresos y gastos guardados para iniciar de cero.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#0B192C',
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('ingresos_mes');
        localStorage.removeItem('gastos_mes');

        Swal.fire({
          title: 'Mes reiniciado',
          text: 'Tus registros se han limpiado correctamente.',
          icon: 'success',
          confirmButtonColor: '#0B192C'
        });
      }
    });
  }
}