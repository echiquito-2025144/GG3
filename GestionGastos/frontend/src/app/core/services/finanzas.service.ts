import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ItemGasto {
  concepto: string;
  monto: number | null;
}

export interface RegistroHistorial {
  id: string;
  mes: string;
  fecha?: string;
  ingresosTotal: number;
  gastosTotal: number;
  saldoRestante: number;
  tieneRegistros: boolean;
  detallesGastos: ItemGasto[];
}

@Injectable({
  providedIn: 'root'
})
export class FinanzasService {
  private ingresoMesSubject = new BehaviorSubject<number>(0);
  public ingresoMes$: Observable<number> = this.ingresoMesSubject.asObservable();

  private gastosMesSubject = new BehaviorSubject<number>(0);
  public gastosMes$: Observable<number> = this.gastosMesSubject.asObservable();

  private saldoActualSubject = new BehaviorSubject<number>(0);
  public saldoActual$: Observable<number> = this.saldoActualSubject.asObservable();

  private totalAhorroSubject = new BehaviorSubject<number>(0);
  public totalAhorro$: Observable<number> = this.totalAhorroSubject.asObservable();

  private historialSubject = new BehaviorSubject<RegistroHistorial[]>([]);
  public historial$: Observable<RegistroHistorial[]> = this.historialSubject.asObservable();

  private listaGastosSubject = new BehaviorSubject<ItemGasto[]>([]);
  public listaGastos$: Observable<ItemGasto[]> = this.listaGastosSubject.asObservable();

  constructor() {
    this.cargarDatosUsuario();
  }

  private obtenerKey(clave: string): string {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        const idUsuario = usuario?.email || usuario?.id || 'invitado';
        return `${idUsuario}_${clave}`;
      } catch {
        return `invitado_${clave}`;
      }
    }
    return `invitado_${clave}`;
  }

  cargarDatosUsuario(): void {
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) {
      this.resetearValores();
      return;
    }

    const ingresoGuardado = localStorage.getItem(this.obtenerKey('ingresoMes'));
    const gastosGuardados = localStorage.getItem(this.obtenerKey('listaGastos'));
    const historialGuardado = localStorage.getItem(this.obtenerKey('historialFinanzas'));

    const ingresoVal = ingresoGuardado ? parseFloat(ingresoGuardado) : 0;
    const gastosArr: ItemGasto[] = gastosGuardados ? JSON.parse(gastosGuardados) : [];
    const historialArr: RegistroHistorial[] = historialGuardado ? JSON.parse(historialGuardado) : [];

    this.ingresoMesSubject.next(ingresoVal);
    this.listaGastosSubject.next(gastosArr);
    this.historialSubject.next(historialArr);

    this.recalcularSaldosYAhorro(ingresoVal, gastosArr);
  }

  private resetearValores(): void {
    this.ingresoMesSubject.next(0);
    this.gastosMesSubject.next(0);
    this.saldoActualSubject.next(0);
    this.totalAhorroSubject.next(0);
    this.historialSubject.next([]);
    this.listaGastosSubject.next([]);
  }

  obtenerIngresoActual(): number {
    return this.ingresoMesSubject.value;
  }

  obtenerListaGastosActual(): ItemGasto[] {
    return this.listaGastosSubject.value;
  }

  actualizarIngreso(monto: number): void {
    localStorage.setItem(this.obtenerKey('ingresoMes'), monto.toString());
    this.ingresoMesSubject.next(monto);
    this.recalcularSaldosYAhorro(monto, this.listaGastosSubject.value);
  }

  actualizarListaGastos(gastos: ItemGasto[]): void {
    localStorage.setItem(this.obtenerKey('listaGastos'), JSON.stringify(gastos));
    this.listaGastosSubject.next(gastos);
    this.recalcularSaldosYAhorro(this.ingresoMesSubject.value, gastos);
  }

  actualizarGastos(monto: number): void {
    localStorage.setItem(this.obtenerKey('gastosMes'), monto.toString());
    this.gastosMesSubject.next(monto);
  }

  private recalcularSaldosYAhorro(ingreso: number, gastos: ItemGasto[]): void {
    const totalGastos = gastos.reduce((sum, g) => sum + (typeof g.monto === 'number' && !isNaN(g.monto) ? g.monto : 0), 0);
    this.gastosMesSubject.next(totalGastos);

    const saldo = ingreso - totalGastos;
    this.saldoActualSubject.next(saldo);

    // 5% de ahorro únicamente sobre el sobrante positivo
    const ahorro = saldo > 0 ? saldo * 0.05 : 0;
    this.totalAhorroSubject.next(ahorro);

    localStorage.setItem(this.obtenerKey('saldoActual'), saldo.toString());
    localStorage.setItem(this.obtenerKey('totalAhorro'), ahorro.toString());
  }

  eliminarRegistroHistorial(id: string): void {
    const actual = this.historialSubject.value;
    const filtrado = actual.filter(item => item.id !== id);
    localStorage.setItem(this.obtenerKey('historialFinanzas'), JSON.stringify(filtrado));
    this.historialSubject.next(filtrado);
  }
}