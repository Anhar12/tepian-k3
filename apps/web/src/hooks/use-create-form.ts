import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
} from "react-hook-form";

/**
 * Options for {@link useCreateForm}.
 *
 * @template T - The form field values type, inferred from the Zod schema.
 */
interface UseCreateFormOptions<T extends FieldValues> {
  schema: Parameters<typeof zodResolver>[0];
  defaultValues: DefaultValues<T>;
}

/**
 * Reusable hook that wires up `useForm` + `useMutation` with Zod validation,
 * success/error toasts, form reset, and optional redirect-back on success.
 *
 * @returns `form` — react-hook-form instance, `mutation` — TanStack mutation, `handleSubmit` — bound submit handler.
 *
 * @example
 * ```ts
 * const { form, mutation, handleSubmit } = useCreateForm<
 *   z.infer<typeof clusterSchema.createClusterSchema>
 * >({
 *   schema: clusterSchema.createClusterSchema,
 *   defaultValues: { name: "", description: "" },
 *   mutationOptions: trpc.cluster.createCluster.mutationOptions(),
 *   successMessage: "Berhasil membuat cluster",
 *   errorMessage: "Gagal membuat cluster",
 * });
 *
 * // In JSX:
 * <form onSubmit={handleSubmit}>
 *   <Controller control={form.control} name="name" render={...} />
 *   <Button disabled={mutation.isPending}>Submit</Button>
 * </form>
 * ```
 */
export function useCreateForm<T extends FieldValues>({
  schema,
  defaultValues,
}: UseCreateFormOptions<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema) as Resolver<T>,
    defaultValues,
  });

  return { ...form };
}
