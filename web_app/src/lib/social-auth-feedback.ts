type TranslateFn = (key: string) => string;

export function getSocialAuthErrorMessage(t: TranslateFn, code: string | null) {
  switch (code) {
    case "provider_cancelled":
      return t("auth.google_error_provider_cancelled");
    case "provider_denied":
      return t("auth.google_error_provider_denied");
    case "state_mismatch":
      return t("auth.google_error_state_mismatch");
    case "account_exists_with_password":
      return t("auth.google_error_account_exists_with_password");
    case "google_email_not_verified":
      return t("auth.google_error_email_not_verified");
    case "google_profile_invalid":
      return t("auth.google_error_profile_invalid");
    case "google_already_linked":
      return t("auth.google_error_already_linked");
    case "google_account_linked_to_another_user":
      return t("auth.google_error_linked_elsewhere");
    case "google_email_mismatch":
      return t("auth.google_error_email_mismatch");
    case "login_required":
      return t("auth.google_error_login_required");
    case "exchange_failed":
    case "missing_token":
    case "google_exchange_failed":
      return t("auth.google_error_exchange_failed");
    case "unavailable":
      return t("auth.google_error_unavailable");
    default:
      return code ? t("auth.google_error_generic") : "";
  }
}

export function getSocialAuthSuccessMessage(t: TranslateFn, status: string | null) {
  switch (status) {
    case "logged_in":
      return t("auth.google_success_logged_in");
    case "registered":
      return t("auth.google_success_registered");
    case "linked":
      return t("auth.google_success_linked");
    default:
      return "";
  }
}
