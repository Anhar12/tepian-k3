export const USER_STATUS = ["Active", "Inactive", "Banned"] as const;

export type UserStatus = (typeof USER_STATUS)[number];
