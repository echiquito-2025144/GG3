import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { FinanzasService } from '../../../../core/services/finanzas.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private finanzasService = inject(FinanzasService);
  private router = inject(Router);

  usuario: any = null;
  private subIngreso!: Subscription;
  private subGastos!: Subscription;

  saldoActual: number = 0.00;
  ingresoMes: number = 0.00;
  gastosMes: number = 0.00;
  totalAhorro: number = 0.00;

  ngOnInit(): void {
    this.usuario = this.authService.obtenerUsuario();

    // Suscripción en tiempo real al valor guardado de ingresoMes
    this.subIngreso = this.finanzasService.ingresoMes$.subscribe((monto) => {
      this.ingresoMes = monto;
      this.recalcularSaldo();
    });

    // Suscripción en tiempo real al valor guardado de gastosMes
    this.subGastos = this.finanzasService.gastosMes$.subscribe((monto) => {
      this.gastosMes = monto;
      this.recalcularSaldo();
    });
  }

  recalcularSaldo(): void {
    // 1. Saldo disponible antes de retener ahorro
    const saldoBruto = Math.max(0, this.ingresoMes - this.gastosMes);

    // 2. Extraemos el 5% para ahorro
    this.totalAhorro = saldoBruto * 0.05;

    // 3. Restamos el ahorro al saldo actual
    this.saldoActual = saldoBruto - this.totalAhorro;
  }

  ngOnDestroy(): void {
    // Limpieza de suscripciones al destruir el componente
    if (this.subIngreso) {
      this.subIngreso.unsubscribe();
    }
    if (this.subGastos) {
      this.subGastos.unsubscribe();
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}