import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { FinanzasService } from '../../../../core/services/finanzas.service';
import { HistorialComponent } from '../historial/historial.component';
import { IngresosComponent } from '../../../../ingresos/ingresos';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HistorialComponent, IngresosComponent],
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
  private subRouter!: Subscription;

  vistaActiva: 'inicio' | 'ingresos' | 'historial' = 'inicio';

  saldoActual: number = 0.00;
  ingresoMes: number = 0.00;
  gastosMes: number = 0.00;
  totalAhorro: number = 0.00;

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

    // Forzar lectura inicial al montar el componente
    this.finanzasService.cargarDatosUsuario();
  }

  private actualizarVistaSegunUrl(url: string): void {
    if (url.includes('/historial')) {
      this.vistaActiva = 'historial';
    } else if (url.includes('/ingresos')) {
      this.vistaActiva = 'ingresos';
    } else {
      this.vistaActiva = 'inicio';
    }
  }

  cambiarVista(vista: 'inicio' | 'ingresos' | 'historial'): void {
    this.vistaActiva = vista;
  }

  ngOnDestroy(): void {
    if (this.subIngreso) this.subIngreso.unsubscribe();
    if (this.subGastos) this.subGastos.unsubscribe();
    if (this.subSaldo) this.subSaldo.unsubscribe();
    if (this.subAhorro) this.subAhorro.unsubscribe();
    if (this.subRouter) this.subRouter.unsubscribe();
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}