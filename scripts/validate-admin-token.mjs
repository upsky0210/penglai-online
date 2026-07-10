const token = process.env.ADMIN_TOKEN ?? "";

if (token === "smoke-admin") {
  console.error("ADMIN_TOKEN 不可使用 smoke-admin。請設定正式測試專用 Token。");
  process.exit(1);
}

if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) {
  console.error("ADMIN_TOKEN 必須至少 20 字元，且只能包含英文字母、數字、底線或連字號。");
  process.exit(1);
}

console.log("ADMIN_TOKEN 格式驗證通過。");
