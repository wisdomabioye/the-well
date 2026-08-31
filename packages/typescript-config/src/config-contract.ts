export interface TypeScriptConfigContract {
  compilerOptions?: {
    noUncheckedIndexedAccess?: boolean;
    strict?: boolean;
  };
  extends?: string;
}

export function hasStrictSafety(config: TypeScriptConfigContract): boolean {
  return (
    config.compilerOptions?.strict === true &&
    config.compilerOptions.noUncheckedIndexedAccess === true
  );
}

export function inheritsBase(config: TypeScriptConfigContract): boolean {
  return config.extends === "./base.json";
}
