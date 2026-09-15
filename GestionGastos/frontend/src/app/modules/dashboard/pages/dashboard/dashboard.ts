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

    this.subIngreso = this.finanzasService.ingresoMes$.subscribe((monto) => {
      this.ingresoMes = monto;
      this.recalcularSaldo();
    });

    this.subGastos = this.finanzasService.gastosMes$.subscribe((monto) => {
      this.gastosMes = monto;
      this.recalcularSaldo();
    });
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

  recalcularSaldo(): void {
    const saldoBruto = Math.max(0, this.ingresoMes - this.gastosMes);
    this.totalAhorro = saldoBruto * 0.05;
    this.saldoActual = saldoBruto - this.totalAhorro;
  }

  ngOnDestroy(): void {
    if (this.subIngreso) this.subIngreso.unsubscribe();
    if (this.subGastos) this.subGastos.unsubscribe();
    if (this.subRouter) this.subRouter.unsubscribe();
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}