import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/pages/login/login';
import { RegisterComponent } from './modules/auth/pages/register/register'; 
import { DashboardComponent } from './modules/dashboard/pages/dashboard/dashboard';
import { IngresosComponent } from './ingresos/ingresos';
import { GastosComponent } from './componentes/gastos/gastos';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'ingresos', component: IngresosComponent },
  { 
    path: 'historial', 
    loadComponent: () => import('./modules/dashboard/pages/historial/historial.component').then(m => m.HistorialComponent)
  },
  { path: 'gastos', component: GastosComponent },
  { path: '**', redirectTo: 'login' }
];