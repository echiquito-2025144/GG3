import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { FinanzasService, ItemGasto } from '../core/services/finanzas.service';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ingresos.html',
  styleUrls: ['./ingresos.css']
})
export class IngresosComponent implements OnInit {
  usuario: any = null;
  nombreUsuario: string = 'Usuario';
  fechaHoy: string = '';

  saldoActual: number = 0.00;
  ingresoMes: number = 0.00;
  gastosMes: number = 0.00;
  totalAhorro: number = 0.00;

  listaGastos: ItemGasto[] = [];

  constructor(
    private authService: AuthService,
    private finanzasService: FinanzasService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.obtenerUsuario();
    if (this.usuario && this.usuario.nombre) {
      this.nombreUsuario = this.usuario.nombre;
    }

    const opciones: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    this.fechaHoy = new Date().toLocaleDateString('es-GT', opciones);

    // Cargar datos actuales desde el servicio
    this.ingresoMes = this.finanzasService.obtenerIngresoActual();
    this.listaGastos = [...this.finanzasService.obtenerListaGastosActual()];

    // Suscripción reactiva para mantener balance, saldo y ahorro sincronizados
    this.finanzasService.saldoActual$.subscribe(val => this.saldoActual = val);
    this.finanzasService.totalAhorro$.subscribe(val => this.totalAhorro = val);

    this.actualizarBalances();
  }

  agregarFila(): void {
    this.listaGastos.push({ concepto: '', monto: null });
    this.actualizarBalances();
  }

  calcularTotalGastos(): number {
    this.gastosMes = this.listaGastos.reduce((acc, curr) => {
      const montoValido = typeof curr.monto === 'number' && !isNaN(curr.monto) ? curr.monto : 0;
      return acc + montoValido;
    }, 0);
    
    // Notifica la lista al servicio (este recalcula automáticamente el saldo y el 5% de ahorro)
    this.finanzasService.actualizarListaGastos(this.listaGastos);
    
    return this.gastosMes;
  }

  actualizarBalances(): void {
    this.calcularTotalGastos();
  }

  guardarIngreso(): void {
    if (this.ingresoMes !== null && this.ingresoMes >= 0) {
      this.finanzasService.actualizarIngreso(this.ingresoMes);
      this.actualizarBalances();
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}