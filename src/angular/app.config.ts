import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  ApplicationConfig,
  ErrorHandler,
  Injectable,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideRouter, Routes } from "@angular/router";
import { authGuard } from "./auth.guard";
import { authInterceptor } from "./auth.interceptor";

/** One place for uncaught errors: report them quietly and keep the app running. */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    console.error("Unhandled error", error); // a real app sends this to monitoring
  }
}

export const routes: Routes = [
  {
    path: "sign-in",
    loadComponent: () => import("./sign-in.component").then((m) => m.SignInComponent),
  },
  {
    path: "risks",
    canActivate: [authGuard],
    loadComponent: () => import("./risks.component").then((m) => m.RisksComponent),
  },
  {
    path: "forbidden",
    loadComponent: () => import("./forbidden.component").then((m) => m.ForbiddenComponent),
  },
  {
    path: "risks/new",
    canActivate: [authGuard],
    data: { role: "admin" },
    loadComponent: () => import("./risk-form.component").then((m) => m.RiskFormComponent),
  },
  { path: "**", redirectTo: "risks" },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: ErrorHandler, useClass: AppErrorHandler },
  ],
};
