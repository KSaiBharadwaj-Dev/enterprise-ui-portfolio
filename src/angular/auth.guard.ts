import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService, Role } from "./auth.service";
import { safeReturnUrl } from "./validators";

/** Functional route guard: sign-in first, then the role the route asks for. */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isSignedIn()) {
    return router.createUrlTree(["/sign-in"], {
      queryParams: { returnUrl: safeReturnUrl(state.url) },
    });
  }
  const required = route.data["role"] as Role | undefined;
  return required && auth.role() !== required ? router.createUrlTree(["/forbidden"]) : true;
};
