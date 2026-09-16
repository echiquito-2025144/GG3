import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { FinanzasService } from '../../../../core/services/finanzas.service';
import { HistorialComponent } from '../historial/historial.component';
import { IngresosComponent } from '../../../../ingresos/ingresos';
import { SettingsComponent } from '../settings/settings.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    HistorialComponent, 
    IngresosComponent, 
    SettingsComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private finanzasService = inject(FinanzasService);
  public router = inject(Router);

  usuario: any = null;
  
  private subIngreso!: Subscription;
  private subGastos!: Subscription;
  private subSaldo!: Subscription;
  private subAhorro!: Subscription;
  private subMoneda!: Subscription;
  private subRouter!: Subscription;

  vistaActiva: 'inicio' | 'ingresos' | 'historial' | 'settings' = 'inicio';

  saldoActual: number = 0.00;
  ingresoMes: number = 0.00;
  gastosMes: number = 0.00;
  totalAhorro: number = 0.00;
  simboloMoneda: string = 'Q.';

  ngOnInit(): void {
    this.usuario = this.authService.obtenerUsuario();

    // Sincronizar estado inicial de la vista con la URL actual
    this.actualizarVistaSegunUrl(this.router.url);

    // Escuchar cambios de navegación
    this.subRouter = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.actualizarVistaSegunUrl(event.urlAfterRedirects);
      });

    // Suscripciones reactivas al servicio centralizado de finanzas
    this.subIngreso = this.finanzasService.ingresoMes$.subscribe((monto) => {
      this.ingresoMes = monto;
    });

    this.subGastos = this.finanzasService.gastosMes$.subscribe((monto) => {
      this.gastosMes = monto;
    });

    this.subSaldo = this.finanzasService.saldoActual$.subscribe((saldo) => {
      this.saldoActual = saldo;
    });

    this.subAhorro = this.finanzasService.totalAhorro$.subscribe((ahorro) => {
      this.totalAhorro = ahorro;
    });

    this.subMoneda = this.finanzasService.moneda$.subscribe((simbolo) => {
      this.simboloMoneda = simbolo;
    });

    // Forzar lectura inicial al montar el componente
    this.finanzasService.cargarDatosUsuario();
  }

  private actualizarVistaSegunUrl(url: string): void {
    if (url.includes('/historial')) {
      this.vistaActiva = 'historial';
    } else if (url.includes('/ingresos')) {
      this.vistaActiva = 'ingresos';
    } else if (url.includes('/settings')) {
      this.vistaActiva = 'settings';
    } else {
      this.vistaActiva = 'inicio';
    }
  }

  cambiarVista(vista: 'inicio' | 'ingresos' | 'historial' | 'settings'): void {
    this.vistaActiva = vista;
  }

  ngOnDestroy(): void {
    if (this.subIngreso) this.subIngreso.unsubscribe();
    if (this.subGastos) this.subGastos.unsubscribe();
    if (this.subSaldo) this.subSaldo.unsubscribe();
    if (this.subAhorro) this.subAhorro.unsubscribe();
    if (this.subMoneda) this.subMoneda.unsubscribe();
    if (this.subRouter) this.subRouter.unsubscribe();
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}