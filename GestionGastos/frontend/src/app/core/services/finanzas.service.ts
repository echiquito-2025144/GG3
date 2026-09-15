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

  private historialSubject = new BehaviorSubject<RegistroHistorial[]>([]);
  public historial$: Observable<RegistroHistorial[]> = this.historialSubject.asObservable();

  private listaGastosSubject = new BehaviorSubject<ItemGasto[]>([]);
  public listaGastos$: Observable<ItemGasto[]> = this.listaGastosSubject.asObservable();

  constructor() {
    this.cargarDatosUsuario();
  }

  // Genera clave única por usuario leyendo directamente localStorage
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
      this.ingresoMesSubject.next(0);
      this.gastosMesSubject.next(0);
      this.historialSubject.next([]);
      this.listaGastosSubject.next([]);
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
    this.recalcularTotalGastos(gastosArr);
    this.historialSubject.next(historialArr);
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
  }

  actualizarGastos(monto: number): void {
    localStorage.setItem(this.obtenerKey('gastosMes'), monto.toString());
    this.gastosMesSubject.next(monto);
  }

  actualizarListaGastos(gastos: ItemGasto[]): void {
    localStorage.setItem(this.obtenerKey('listaGastos'), JSON.stringify(gastos));
    this.listaGastosSubject.next(gastos);
    this.recalcularTotalGastos(gastos);
  }

  private recalcularTotalGastos(gastos: ItemGasto[]): void {
    const total = gastos.reduce((sum, g) => sum + (typeof g.monto === 'number' && !isNaN(g.monto) ? g.monto : 0), 0);
    this.gastosMesSubject.next(total);
  }

  eliminarRegistroHistorial(id: string): void {
    const actual = this.historialSubject.value;
    const filtrado = actual.filter(item => item.id !== id);
    localStorage.setItem(this.obtenerKey('historialFinanzas'), JSON.stringify(filtrado));
    this.historialSubject.next(filtrado);
  }
}