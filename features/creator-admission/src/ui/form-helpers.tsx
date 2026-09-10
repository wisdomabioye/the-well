import {
  creatorApplicationResponseSchema,
  type CreatorApplicationResponse,
} from "@ador/shared/creator-admission";

export async function sendCreatorAdmissionRequest(
  path: string,
  method: string,
  body: object,
): Promise<CreatorApplicationResponse> {
  const response = await fetch(path, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID(),
    },
    method,
  });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error("The request could not be completed.");
  return creatorApplicationResponseSchema.parse(payload);
}

export function AdmissionField({
  label,
  name,
  defaultValue = "",
  required = true,
}: {
  readonly defaultValue?: string;
  readonly label: string;
  readonly name: string;
  readonly required?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>
      <input defaultValue={defaultValue} name={name} required={required} />
    </label>
  );
}
