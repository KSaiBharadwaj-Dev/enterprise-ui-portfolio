import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, retry, throwError, timer } from "rxjs";
import { AuthService } from "./auth.service";

const API_PREFIX = "/api/";

/** Only safe, repeatable requests are retried, and only for network failures and 5xx answers. */
const retryable = (req: HttpRequest<unknown>, error: unknown): boolean =>
  req.method === "GET" &&
  error instanceof HttpErrorResponse &&
  (error.status === 0 || error.status >= 500);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_PREFIX)) return next(req); // never send the token to another origin

  const auth = inject(AuthService);
  const session = auth.session();
  const outgoing = session
    ? req.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } })
    : req;

  return next(outgoing).pipe(
    retry({
      count: 2,
      delay: (error: unknown, attempt: number) =>
        retryable(req, error)
          ? timer(300 * 2 ** (attempt - 1) + Math.random() * 100)
          : throwError(() => error),
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) auth.expire(); // one place ends a dead session
      return throwError(() => error);
    }),
  );
};
