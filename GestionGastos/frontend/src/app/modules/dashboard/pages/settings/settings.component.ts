import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private subUsuario!: Subscription;

  usuario: any = null;
  fotoPreview: string | null = null;

  monedaSeleccionada: string = 'GTQ';
  porcentajeAhorroMeta: number = 10;

  ngOnInit(): void {
    this.subUsuario = this.authService.usuario$.subscribe((user) => {
      this.usuario = user || {};
      this.fotoPreview = this.usuario?.foto || null;
    });

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
        const fotoBase64 = reader.result as string;

        // Si el AuthService ya tiene el método para persistir en backend
        if (typeof (this.authService as any).actualizarFotoPerfil === 'function') {
          (this.authService as any).actualizarFotoPerfil(fotoBase64).subscribe({
            next: () => {
              this.fotoPreview = fotoBase64;
              Swal.fire({
                title: 'Foto guardada',
                text: 'Imagen de perfil sincronizada con tu cuenta.',
                icon: 'success',
                confirmButtonColor: '#0B192C',
                timer: 1800,
                showConfirmButton: false
              });
            },
            error: () => {
              this.actualizarLocal(fotoBase64);
            }
          });
        } else {
          this.actualizarLocal(fotoBase64);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  private actualizarLocal(fotoBase64: string): void {
    this.fotoPreview = fotoBase64;
    if (this.usuario) {
      this.usuario.foto = fotoBase64;
      this.authService.actualizarUsuario(this.usuario);
    }
  }

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

  ngOnDestroy(): void {
    if (this.subUsuario) {
      this.subUsuario.unsubscribe();
    }
  }
}