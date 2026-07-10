$secureToken = Read-Host "ADMIN_TOKEN" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)

try {
  $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if ($plainToken -eq "smoke-admin" -or $plainToken -notmatch "^[A-Za-z0-9_-]{20,}$") {
    [Console]::Error.WriteLine("ADMIN_TOKEN must be 20+ characters using only letters, digits, underscore, or hyphen; smoke-admin is forbidden.")
    exit 1
  }

  [Console]::Out.WriteLine($plainToken)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
