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

  // Obtiene el prefijo dinámico leyendo la clave 'usuario' (consistente con AuthService)
  private get userPrefix(): string {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      try {
        const user = JSON.parse(usuarioStr);
        if (user && user.email) {
          return `nexus_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}_`;
        }
      } catch (e) {
        console.error('Error parseando datos de usuario', e);
      }
    }
    return 'nexus_guest_';
  }

  private get INGRESO_KEY(): string { return `${this.userPrefix}ingreso_mes_actual`; }
  private get GASTOS_KEY(): string { return `${this.userPrefix}gastos_mes_actual`; }
  private get LISTA_GASTOS_KEY(): string { return `${this.userPrefix}lista_gastos_actual`; }

  private ingresoSubject = new BehaviorSubject<number>(0);
  private gastosSubject = new BehaviorSubject<number>(0);
  private listaGastosSubject = new BehaviorSubject<ItemGasto[]>([]);

  ingresoMes$: Observable<number> = this.ingresoSubject.asObservable();
  gastosMes$: Observable<number> = this.gastosSubject.asObservable();
  listaGastos$: Observable<ItemGasto[]> = this.listaGastosSubject.asObservable();

  constructor() {
    this.cargarDatosUsuario();
  }

  /**
   * Recarga los datos desde localStorage según el usuario activo actualmente.
   */
  public cargarDatosUsuario(): void {
    const ingresoGuardado = Number(localStorage.getItem(this.INGRESO_KEY)) || 0;
    const gastosGuardados = Number(localStorage.getItem(this.GASTOS_KEY)) || 0;
    const listaGuardada = this.obtenerListaInicial();

    this.ingresoSubject.next(ingresoGuardado);
    this.gastosSubject.next(gastosGuardados);
    this.listaGastosSubject.next(listaGuardada);
  }

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