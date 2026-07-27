export function maskBankAccount(account: string | null | undefined): string {
  if (!account) return "";
  if (account.length <= 4) return account.replace(/./g, "*");
  return "*".repeat(account.length - 4) + account.slice(-4);
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  if (phone.length <= 4) return phone.replace(/./g, "*");
  const first = phone.slice(0, 4);
  const last = phone.slice(-3);
  const masked = "*".repeat(Math.max(0, phone.length - 7));
  return `${first}${masked}${last}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [local = "", domain] = email.split("@");
  if (!domain) return email.replace(/./g, "*");
  if (local.length <= 2) {
    return `${local.replace(/./g, "*")}@${domain}`;
  }
  const first = local.slice(0, 2);
  const masked = "*".repeat(local.length - 2);
  return `${first}${masked}@${domain}`;
}

export function maskUserCompany<T extends Record<string, any>>(company: T): T {
  if (!company) return company;
  return {
    ...company,
    ...(company.companyBankAccount && {
      companyBankAccount: maskBankAccount(company.companyBankAccount),
    }),
    ...(company.responsibleTestingPersonPhone && {
      responsibleTestingPersonPhone: maskPhone(
        company.responsibleTestingPersonPhone,
      ),
    }),
    ...(company.email && { email: maskEmail(company.email) }),
    ...(company.responsibleTestingPersonEmail && {
      responsibleTestingPersonEmail: maskEmail(
        company.responsibleTestingPersonEmail
      ),
    }),
  };
}
