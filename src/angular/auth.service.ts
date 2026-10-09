import { HttpClient } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, finalize, tap } from "rxjs";
import { safeReturnUrl } from "./validators";

export type Role = "viewer" | "admin";
export type Permission = "risk:read" | "risk:update" | "risk:create";
export interface Session {
  readonly token: string;
  readonly user: string;
  readonly role: Role;
  readonly expiresAt: number;
}

const PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  viewer: ["risk:read"],
  admin: ["risk:read", "risk:update", "risk:create"],
};

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  // In memory only. Nothing goes to localStorage, so injected script cannot read the token back.
  private readonly state = signal<Session | null>(null);

  readonly session = this.state.asReadonly();
  readonly isSignedIn = computed(() => this.state() !== null);
  readonly role = computed(() => this.state()?.role ?? null);

  signIn(username: string, password: string): Observable<Session> {
    return this.http
      .post<Session>("/api/session", { username, password })
      .pipe(tap((session) => this.state.set(session)));
  }

  signOut(): void {
    this.http
      .delete("/api/session")
      .pipe(
        finalize(() => {
          this.state.set(null); // clear locally even if the server cannot be reached
          void this.router.navigateByUrl("/sign-in");
        }),
      )
      .subscribe({ error: () => undefined });
  }

  /** Called by the interceptor when the server says the session is gone. */
  expire(): void {
    this.state.set(null);
    // Send the person to sign in, and bring them back to this page afterwards.
    void this.router.navigate(["/sign-in"], {
      queryParams: { returnUrl: safeReturnUrl(this.router.url) },
    });
  }

  can(permission: Permission): boolean {
    const role = this.role();
    return role !== null && PERMISSIONS[role].includes(permission);
  }
}
