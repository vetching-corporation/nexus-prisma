import { GraphQLResolveInfo } from 'graphql'
import { core } from 'nexus'
import { CommonFieldConfig } from 'nexus/dist/core'
import * as Helpers from './helpers'

// todo remove framework types from here once
// https://github.com/graphql-nexus/nexus/issues/1069

/**
 * Framework & Library
 */

export type ModelNameInGraphQLTypes<ReturnType> = ReturnType extends core.GetGen<'objectNames'> ? true : false

export type CustomFieldResolver<TypeName extends string, FieldName extends string> = (
  root: core.SourceValue<TypeName>,
  args: core.ArgsValue<TypeName, FieldName>,
  context: core.GetGen<'context'>,
  info: GraphQLResolveInfo,
  originalResolve: core.FieldResolver<TypeName, FieldName>
) =>
  | core.MaybePromise<core.ResultValue<TypeName, FieldName>>
  | core.MaybePromiseDeep<core.ResultValue<TypeName, FieldName>>

type NexusPrismaScalarOpts<
  TypeName extends string,
  MethodName extends string,
  Alias extends string | undefined
> = {
  /**
   * Alias the field name
   */
  alias?: Alias
  /**
   * Provide a custom resolver on any resolver generated by the plugin via t.crud or t.model.
   * You can either entirely replace the generated resolver, or wrap it via the use of the `originalResolve` parameter.
   *
   * @example
   *
   * ```ts
   * t.crud.posts({
   *  async resolve(root, args, ctx, info, originalResolve) {
   *   console.log('logic before the resolver')
   *    const res = await originalResolve(root, args, ctx, info)
   *    console.log('logic after the resolver')
   *    return res
   *  }
   * })
   * ```
   */
  resolve?: CustomFieldResolver<TypeName, Alias extends undefined ? MethodName : Alias>
} & NexusGenPluginFieldConfig<TypeName, Alias extends undefined ? MethodName : Alias> &
  CommonFieldConfig

type RootObjectTypes = Pick<core.GetGen<'rootTypes'>, core.GetGen<'objectNames'>>

/**
 * Determine if `B` is a subset (or equivalent to) of `A`.
 */
type IsSubset<A, B> = keyof A extends never ? false : B extends A ? true : false

type OmitByValue<T, ValueType> = Pick<
  T,
  { [Key in keyof T]: T[Key] extends ValueType ? never : Key }[keyof T]
>

type GetSubsetTypes<ModelName extends string> = keyof OmitByValue<
  {
    [P in keyof RootObjectTypes]: ModelName extends keyof Helpers.GetGen<'models'> // if
      ? IsSubset<RootObjectTypes[P], Helpers.GetGen2<'models', ModelName>> extends true // else if
        ? RootObjectTypes[P]
        : never // else
      : never
  },
  never
>

type SubsetTypes<ModelName extends string> = GetSubsetTypes<ModelName> extends never
  ? "ERROR: No subset types are available. Please make sure that one of your GraphQL type is a subset of your t.model('<ModelName>')"
  : GetSubsetTypes<ModelName>

type DynamicRequiredType<ReturnType extends string> = ModelNameInGraphQLTypes<ReturnType> extends true
  ? { type?: SubsetTypes<ReturnType> }
  : { type: SubsetTypes<ReturnType> }

type GetNexusPrismaInput<
  ModelName extends string,
  MethodName extends string,
  InputName extends 'filtering' | 'ordering'
> = ModelName extends keyof Helpers.GetGen<'inputs'>
  ? MethodName extends keyof Helpers.GetGen2<'inputs', ModelName>
    ? InputName extends keyof Helpers.GetGen3<'inputs', ModelName, MethodName>
      ? Helpers.GetGen3<'inputs', ModelName, MethodName>[InputName] & string
      : never
    : never
  : never

/**
 *  Represents arguments required by Prisma Client JS that will
 *  be derived from a request's input (args, context, and info)
 *  and omitted from the GraphQL API. The object itself maps the
 *  names of these args to a function that takes an object representing
 *  the request's input and returns the value to pass to the prisma
 *  arg of the same name.
 */
export type LocalComputedInputs<MethodName extends string> = Record<
  string,
  (params: LocalMutationResolverParams<MethodName>) => unknown
>

export type GlobalComputedInputs = Record<string, (params: GlobalMutationResolverParams) => unknown>

type BaseMutationResolverParams = {
  info: GraphQLResolveInfo
  ctx: Context
}

export type GlobalMutationResolverParams = BaseMutationResolverParams & {
  args: Record<string, any> & { data: unknown }
}

export type LocalMutationResolverParams<MethodName extends string> = BaseMutationResolverParams & {
  args: MethodName extends keyof core.GetGen2<'argTypes', 'Mutation'>
    ? core.GetGen3<'argTypes', 'Mutation', MethodName>
    : any
}

export type Context = core.GetGen<'context'>

export type BaseRelationOptions<
  TypeName extends string,
  MethodName extends string,
  Alias extends string | undefined,
  ReturnType extends string
> = DynamicRequiredType<ReturnType> & {
  /**
   * Alias the default field name
   */
  alias?: Alias
  /**
   * Enable the usage of a custom resolver on any resolver generated by the plugin via t.crud or t.model.
   * You can either entirely replace the generated resolver, or wrap it via the use of the `originalResolve` parameter.
   *
   * @example
   *
   * ```ts
   * t.crud.posts({
   *  async resolve(root, args, ctx, info, originalResolve) {
   *   console.log('logic before the resolver')
   *    const res = await originalResolve(root, args, ctx, info)
   *    console.log('logic after the resolver')
   *    return res
   *  }
   * })
   * ```
   */
  resolve?: CustomFieldResolver<TypeName, Alias extends undefined ? MethodName : Alias>
  computedInputs?: LocalComputedInputs<MethodName>
} & NexusGenPluginFieldConfig<TypeName, Alias extends undefined ? MethodName : Alias> &
  CommonFieldConfig

// If GetNexusPrismaInput returns never, it means there are no filtering/ordering args for it.
type NexusPrismaRelationOpts<
  ModelName extends string,
  MethodName extends string,
  Alias extends string | undefined,
  ReturnType extends string
> = GetNexusPrismaInput<ModelName, MethodName, 'filtering'> extends never
  ? BaseRelationOptions<ModelName, MethodName, Alias, ReturnType> // else if
  : GetNexusPrismaInput<ModelName, MethodName, 'ordering'> extends never
  ? BaseRelationOptions<ModelName, MethodName, Alias, ReturnType> // else
  : BaseRelationOptions<ModelName, MethodName, Alias, ReturnType> & {
      filtering?: boolean | Partial<Record<GetNexusPrismaInput<ModelName, MethodName, 'filtering'>, boolean>>
      ordering?: boolean | Partial<Record<GetNexusPrismaInput<ModelName, MethodName, 'ordering'>, boolean>>
      pagination?: boolean | Helpers.GetGen<'pagination'>
    }

type IsScalar<TypeName extends string> = TypeName extends core.GetGen<'scalarNames'> ? true : false

type IsObject<Name extends string> = Name extends core.GetGen<'objectNames'> ? true : false

type IsEnum<Name extends string> = Name extends core.GetGen<'enumNames'> ? true : false

type IsInputObject<Name extends string> = Name extends core.GetGen<'inputNames'> ? true : false

/**
 * The kind that a GraphQL type may be.
 */
type Kind = 'Enum' | 'Object' | 'Scalar' | 'InputObject'

/**
 * Helper to safely reference a Kind type. For example instead of the following
 * which would admit a typo:
 *
 * ```ts
 * type Foo = Bar extends 'scalar' ? ...
 * ```
 *
 * You can do this which guarantees a correct reference:
 *
 * ```ts
 * type Foo = Bar extends AKind<'Scalar'> ? ...
 * ```
 *
 */
type AKind<T extends Kind> = T

type GetKind<Name extends string> = IsEnum<Name> extends true
  ? 'Enum' // else if
  : IsScalar<Name> extends true
  ? 'Scalar' // else if
  : IsObject<Name> extends true
  ? 'Object' // else if
  : IsInputObject<Name> extends true
  ? 'InputObject' // else // FIXME should be \`never\`, but GQL objects named differently // than backing type fall into this branch
  : 'Object'

export type NexusPrismaFields<ModelName extends keyof Helpers.GetGen<'outputs'> & string> = {
  [MethodName in keyof Helpers.GetGen2<'outputs', ModelName> & string]: NexusPrismaMethod<
    ModelName,
    MethodName,
    GetKind<Helpers.GetGen3<'outputs', ModelName, MethodName> & string> // Is the return type a scalar?
  >
}

type NexusPrismaMethod<
  ModelName extends keyof Helpers.GetGen<'outputs'> & string,
  MethodName extends keyof Helpers.GetGen2<'outputs', ModelName> & string,
  ThisKind extends Kind,
  ReturnType extends string = Helpers.GetGen3<'outputs', ModelName, MethodName> & string
> = ThisKind extends AKind<'Enum'>
  ? () => NexusPrismaFields<ModelName> // else if // if scalar return scalar opts
  : ThisKind extends AKind<'Scalar'>
  ? <Alias extends string | undefined = undefined>(
      opts?: NexusPrismaScalarOpts<ModelName, MethodName, Alias>
    ) => NexusPrismaFields<ModelName> // else if // if model name has a mapped graphql types then make opts optional
  : ModelNameInGraphQLTypes<ReturnType> extends true
  ? <Alias extends string | undefined = undefined>(
      opts?: NexusPrismaRelationOpts<ModelName, MethodName, Alias, ReturnType>
    ) => NexusPrismaFields<ModelName> // else // force use input the related graphql type -> { type: '...' }
  : <Alias extends string | undefined = undefined>(
      opts: NexusPrismaRelationOpts<ModelName, MethodName, Alias, ReturnType>
    ) => NexusPrismaFields<ModelName>

type GetNexusPrismaMethod<TypeName extends string> = TypeName extends keyof Helpers.GetGen<'methods'>
  ? Helpers.GetGen2<'methods', TypeName>
  : <CustomTypeName extends keyof Helpers.GetGen<'models'>>(
      typeName: CustomTypeName
    ) => Helpers.GetGen2<'methods', CustomTypeName>

export type GetNexusPrisma<
  TypeName extends string,
  ModelOrCrud extends 'model' | 'crud'
> = ModelOrCrud extends 'model'
  ? TypeName extends 'Mutation'
    ? never
    : TypeName extends 'Query'
    ? never
    : GetNexusPrismaMethod<TypeName>
  : ModelOrCrud extends 'crud'
  ? TypeName extends 'Mutation'
    ? GetNexusPrismaMethod<TypeName>
    : TypeName extends 'Query'
    ? GetNexusPrismaMethod<TypeName>
    : never
  : never
