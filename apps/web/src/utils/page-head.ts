const APP_NAME = "Tepian K3";

export function pageHead(title: string, description?: string) {
  return {
    meta: [
      { title: `${title} | ${APP_NAME}` },
      ...(description
        ? [{ name: "description" as const, content: description }]
        : []),
    ],
  };
}
