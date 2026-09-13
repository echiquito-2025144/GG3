import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ItemGasto {
  concepto: string;
  monto: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class FinanzasService {
  // Clave dinámica según el usuario activo para no mezclar datos de cuentas distintas
  private get userPrefix(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.email ? `nexus_${user.email}_` : 'nexus_guest_';
  }

  private get INGRESO_KEY(): string { return `${this.userPrefix}ingreso_mes_actual`; }
  private get GASTOS_KEY(): string { return `${this.userPrefix}gastos_mes_actual`; }
  private get LISTA_GASTOS_KEY(): string { return `${this.userPrefix}lista_gastos_actual`; }

  private listaInicial: ItemGasto[] = this.obtenerListaInicial();
  private ingresoInicial = Number(localStorage.getItem(this.INGRESO_KEY)) || 10;
  private gastosIniciales = Number(localStorage.getItem(this.GASTOS_KEY)) || 0;
  
  private ingresoSubject = new BehaviorSubject<number>(this.ingresoInicial);
  private gastosSubject = new BehaviorSubject<number>(this.gastosIniciales);
  private listaGastosSubject = new BehaviorSubject<ItemGasto[]>(this.listaInicial);

  ingresoMes$: Observable<number> = this.ingresoSubject.asObservable();
  gastosMes$: Observable<number> = this.gastosSubject.asObservable();
  listaGastos$: Observable<ItemGasto[]> = this.listaGastosSubject.asObservable();

  constructor() {}

  private obtenerListaInicial(): ItemGasto[] {
    const guardado = localStorage.getItem(this.LISTA_GASTOS_KEY);
    if (guardado) {
      try {
        return JSON.parse(guardado);
      } catch (e) {
        console.error('Error al parsear lista de gastos de localStorage', e);
      }
    }
    return [
      { concepto: '', monto: null },
      { concepto: '', monto: null },
      { concepto: '', monto: null },
      { concepto: '', monto: null }
    ];
  }

  // ==========================================
  // Métodos de Ingresos
  // ==========================================
  actualizarIngreso(nuevoMonto: number): void {
    const montoValido = nuevoMonto || 0;
    localStorage.setItem(this.INGRESO_KEY, montoValido.toString());
    this.ingresoSubject.next(montoValido);
  }

  obtenerIngresoActual(): number {
    return this.ingresoSubject.value;
  }

  // ==========================================
  // Métodos de Gastos
  // ==========================================
  actualizarGastos(nuevoMonto: number): void {
    const montoValido = nuevoMonto || 0;
    localStorage.setItem(this.GASTOS_KEY, montoValido.toString());
    this.gastosSubject.next(montoValido);
  }

  obtenerGastosActuales(): number {
    return this.gastosSubject.value;
  }

  // ==========================================
  // Métodos de Lista de Gastos
  // ==========================================
  actualizarListaGastos(lista: ItemGasto[]): void {
    localStorage.setItem(this.LISTA_GASTOS_KEY, JSON.stringify(lista));
    this.listaGastosSubject.next(lista);
  }

  obtenerListaGastosActual(): ItemGasto[] {
    return this.listaGastosSubject.value;
  }
}