/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow usage of `<img>` element. Use `<ImageWithFallback />` from `@/components/image-with-fallback` instead.",
    },
    messages: {
      noImgElement:
        "Do not use `<img>`. Use `<ImageWithFallback />` from `@/components/image-with-fallback` instead for built-in loading states and error handling.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type === "JSXIdentifier" && node.name.name === "img") {
          // Allow <img> inside image-with-fallback.tsx itself
          const filename = context.filename ?? context.getFilename();
          if (filename.includes("image-with-fallback")) {
            return;
          }

          context.report({
            node,
            messageId: "noImgElement",
          });
        }
      },
    };
  },
};
